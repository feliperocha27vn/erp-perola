import { sql } from "drizzle-orm"
import { db } from "../../db/connection.js"
import type {
	FullReplenishmentRepository,
	FullStockDemandRow,
	FullStockRow,
	InTransitRow,
	Marketplace,
	PhysicalSupplyRow,
} from "../report-repository.js"

export class DrizzleFullReplenishmentRepository implements FullReplenishmentRepository {
	async fetchFullStocks(): Promise<FullStockRow[]> {
		const rows = await db.execute(sql`
			SELECT
				p.id::text        AS product_id,
				p.sku             AS sku,
				b.name            AS brand_name,
				s.id::text        AS stock_id,
				s.title           AS stock_title,
				s.marketplace     AS marketplace,
				s.qtde            AS qtde
			FROM stocks s
			JOIN products p ON p.id = s.product_id
			LEFT JOIN brands b ON b.id = p.brand_id
			WHERE s.full = true
				AND s.marketplace IS NOT NULL
				AND p.deleted_at IS NULL
		`)

		return [...rows].map((row) => ({
			product_id: String(row.product_id),
			sku: String(row.sku),
			brand_name: row.brand_name === null ? null : String(row.brand_name),
			stock_id: String(row.stock_id),
			stock_title: String(row.stock_title),
			marketplace: String(row.marketplace) as Marketplace,
			qtde: Number(row.qtde),
		}))
	}

	/**
	 * Reconstroi, dia a dia, quanto cada deposito full tinha em estoque na janela.
	 *
	 * O saldo atual e o unico ponto conhecido, entao a serie e montada de tras para
	 * frente: o saldo no inicio do dia D e o saldo de hoje menos tudo que entrou e
	 * saiu de D em diante. Um dia so conta como "com estoque" se havia saldo no
	 * inicio dele ou se houve venda nele — sem isso, um deposito que ficou zerado
	 * pareceria ter demanda baixa quando na verdade nao tinha o que vender.
	 *
	 * Pressupoe que toda variacao passou por venda ou lancamento de estoque.
	 * Edicao manual de qtde nao deixa rastro e distorce o periodo afetado.
	 */
	async fetchFullStockDemand(windowDays: number): Promise<FullStockDemandRow[]> {
		const rows = await db.execute(sql`
			WITH bounds AS (
				SELECT (CURRENT_DATE - (${windowDays}::int - 1)) AS start_date, CURRENT_DATE AS end_date
			),
			full_stocks AS (
				SELECT s.id, s.qtde
				FROM stocks s
				JOIN products p ON p.id = s.product_id
				WHERE s.full = true AND s.marketplace IS NOT NULL AND p.deleted_at IS NULL
			),
			days AS (
				SELECT generate_series(
					(SELECT start_date FROM bounds),
					(SELECT end_date FROM bounds),
					'1 day'
				)::date AS d
			),
			daily_sales AS (
				SELECT sa.stock_id, sa.sale_date::date AS d, SUM(sa.quantity)::int AS units
				FROM sales sa
				WHERE sa.sale_date >= (SELECT start_date FROM bounds)
				GROUP BY 1, 2
			),
			daily_entries AS (
				SELECT se.stock_id, se.created_at::date AS d, SUM(se.quantity)::int AS units
				FROM stock_entries se
				WHERE se.created_at >= (SELECT start_date FROM bounds)
				GROUP BY 1, 2
			),
			grid AS (
				SELECT
					fs.id AS stock_id,
					fs.qtde AS current_qtde,
					d.d AS d,
					COALESCE(ds.units, 0) AS sold,
					COALESCE(de.units, 0) AS entered
				FROM full_stocks fs
				CROSS JOIN days d
				LEFT JOIN daily_sales ds ON ds.stock_id = fs.id AND ds.d = d.d
				LEFT JOIN daily_entries de ON de.stock_id = fs.id AND de.d = d.d
			),
			timeline AS (
				SELECT
					stock_id,
					sold,
					current_qtde - COALESCE(SUM(entered - sold) OVER (
						PARTITION BY stock_id ORDER BY d
						ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING
					), 0) AS qty_start_of_day
				FROM grid
			)
			SELECT
				stock_id::text AS stock_id,
				COALESCE(SUM(sold), 0)::int AS units_window,
				COUNT(*) FILTER (WHERE qty_start_of_day > 0 OR sold > 0)::int AS days_with_stock
			FROM timeline
			GROUP BY stock_id
		`)

		return [...rows].map((row) => ({
			stock_id: String(row.stock_id),
			units_window: Number(row.units_window),
			days_with_stock: Number(row.days_with_stock),
		}))
	}

	/**
	 * Fonte de suprimento por produto. Quando ha mais de um deposito fisico, usa o
	 * de maior saldo — o envio sai de um estoque so, entao somar todos prometeria
	 * uma quantidade que a origem escolhida nao tem.
	 */
	async fetchPhysicalSupply(windowDays: number): Promise<PhysicalSupplyRow[]> {
		const rows = await db.execute(sql`
			WITH physical AS (
				SELECT
					s.id, s.product_id, s.title, s.qtde,
					ROW_NUMBER() OVER (
						PARTITION BY s.product_id ORDER BY s.qtde DESC, s.created_at ASC
					) AS rn
				FROM stocks s
				JOIN products p ON p.id = s.product_id
				WHERE s.full = false AND p.deleted_at IS NULL
			),
			physical_sales AS (
				SELECT s.product_id, COALESCE(SUM(sa.quantity), 0)::int AS units
				FROM sales sa
				JOIN stocks s ON s.id = sa.stock_id
				WHERE s.full = false
					AND sa.sale_date >= (CURRENT_DATE - (${windowDays}::int - 1))
				GROUP BY s.product_id
			)
			SELECT
				ph.product_id::text AS product_id,
				ph.id::text         AS stock_id,
				ph.title            AS stock_title,
				ph.qtde             AS qtde,
				COALESCE(ps.units, 0)::int AS units_window
			FROM physical ph
			LEFT JOIN physical_sales ps ON ps.product_id = ph.product_id
			WHERE ph.rn = 1
		`)

		return [...rows].map((row) => ({
			product_id: String(row.product_id),
			stock_id: String(row.stock_id),
			stock_title: String(row.stock_title),
			qtde: Number(row.qtde),
			units_window: Number(row.units_window),
		}))
	}

	/** Rascunho conta junto: ja e um envio planejado, nao deve ser sugerido de novo. */
	async fetchInTransitQuantities(): Promise<InTransitRow[]> {
		const rows = await db.execute(sql`
			SELECT
				si.destination_stock_id::text AS destination_stock_id,
				SUM(si.quantity)::int         AS quantity
			FROM shipment_items si
			JOIN shipments sh ON sh.id = si.shipment_id
			WHERE sh.status IN ('rascunho', 'em_transito')
			GROUP BY si.destination_stock_id
		`)

		return [...rows].map((row) => ({
			destination_stock_id: String(row.destination_stock_id),
			quantity: Number(row.quantity),
		}))
	}
}
