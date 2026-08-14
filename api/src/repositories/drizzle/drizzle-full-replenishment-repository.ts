import { sql } from "drizzle-orm"
import { db } from "../../db/connection.js"
import type {
	AccountChannelDemandRow,
	AccountChannelRow,
	DraftedSourceRow,
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
				s.qtde            AS qtde,
				s.store_id::text  AS store_id,
				st.name           AS store_name
			FROM stocks s
			JOIN products p ON p.id = s.product_id
			LEFT JOIN brands b ON b.id = p.brand_id
			LEFT JOIN stores st ON st.id = s.store_id
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
			store_id: row.store_id === null ? null : String(row.store_id),
			store_name: row.store_name === null ? null : String(row.store_name),
		}))
	}

	/**
	 * Demanda por conta e canal, independente de qual deposito despachou.
	 *
	 * O `channel` da venda diz em qual marketplace o pedido entrou; o `stock_id`
	 * diz de onde a mercadoria saiu. Sao coisas diferentes, e e a primeira que
	 * mede a procura: uma venda no Mercado Livre despachada do galpao continua
	 * sendo demanda do Mercado Livre daquela conta, e e ela que migraria para o
	 * full se ele estivesse abastecido.
	 *
	 * Vendas diretas ficam de fora — nao pertencem a canal nenhum.
	 */
	async fetchAccountChannelDemand(
		longDays: number,
		shortDays: number,
	): Promise<AccountChannelDemandRow[]> {
		const rows = await db.execute(sql`
			SELECT
				sa.product_id::text AS product_id,
				p.sku               AS sku,
				b.name              AS brand_name,
				sa.store_id::text   AS store_id,
				st.name             AS store_name,
				CASE sa.channel
					WHEN 'Mercado Livre' THEN 'mercado_livre'
					WHEN 'Amazon'        THEN 'amazon'
					WHEN 'Shopee'        THEN 'shopee'
				END AS marketplace,
				COALESCE(SUM(sa.quantity), 0)::int AS units_long,
				COALESCE(SUM(sa.quantity) FILTER (
					WHERE sa.sale_date >= (CURRENT_DATE - (${shortDays}::int - 1))
				), 0)::int AS units_short
			FROM sales sa
			JOIN stores st ON st.id = sa.store_id
			JOIN products p ON p.id = sa.product_id
			LEFT JOIN brands b ON b.id = p.brand_id
			WHERE sa.channel <> 'Direto'
				AND sa.sale_date >= (CURRENT_DATE - (${longDays}::int - 1))
				AND p.deleted_at IS NULL
			GROUP BY sa.product_id, p.sku, b.name, sa.store_id, st.name, sa.channel
		`)

		return [...rows].map((row) => ({
			product_id: String(row.product_id),
			sku: String(row.sku),
			brand_name: row.brand_name === null ? null : String(row.brand_name),
			store_id: String(row.store_id),
			store_name: String(row.store_name),
			marketplace: String(row.marketplace) as Marketplace,
			units_long: Number(row.units_long),
			units_short: Number(row.units_short),
		}))
	}

	/**
	 * Em quais canais cada conta ja opera full. So faz sentido sugerir que um
	 * produto entre no full de uma conta que ja tem operacao naquele canal — a
	 * sugestao e abrir mais um SKU, nao abrir uma conta.
	 */
	async fetchAccountsOperatingFull(): Promise<AccountChannelRow[]> {
		const rows = await db.execute(sql`
			SELECT DISTINCT ON (s.store_id, s.marketplace)
				s.store_id::text AS store_id,
				st.name          AS store_name,
				s.marketplace    AS marketplace,
				s.title          AS sample_stock_title
			FROM stocks s
			JOIN stores st ON st.id = s.store_id
			WHERE s.full = true
				AND s.marketplace IS NOT NULL
				AND s.store_id IS NOT NULL
			ORDER BY s.store_id, s.marketplace, s.created_at ASC
		`)

		return [...rows].map((row) => ({
			store_id: String(row.store_id),
			store_name: String(row.store_name),
			marketplace: String(row.marketplace) as Marketplace,
			sample_stock_title: String(row.sample_stock_title),
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
	 * Fonte de suprimento por produto: todos os depositos proprios, nao so o de
	 * maior saldo. Um Envio comporta itens com origens diferentes, entao o que da
	 * para abastecer e a soma — e essa e a mesma leitura de Estoque Fisico que o
	 * Alerta de Reposicao ja usava, o que antes fazia os dois relatorios darem
	 * numeros diferentes para o mesmo produto.
	 *
	 * Depositos zerados entram na lista: sao origem valida assim que receberem
	 * mercadoria e aparecem no detalhamento da tela.
	 *
	 * A reserva conta so o canal Direto. Uma venda de marketplace despachada do
	 * galpao sai do saldo proprio hoje, mas e justamente a demanda que o full
	 * deveria absorver: contando-a aqui, o mesmo pedido virava motivo para
	 * abastecer o full e motivo para segurar o estoque, e o produto ficava preso
	 * em "reserva de venda direta" com mercadoria em casa.
	 */
	async fetchPhysicalSupply(windowDays: number): Promise<PhysicalSupplyRow[]> {
		const rows = await db.execute(sql`
			WITH physical_sales AS (
				SELECT s.product_id, COALESCE(SUM(sa.quantity), 0)::int AS units
				FROM sales sa
				JOIN stocks s ON s.id = sa.stock_id
				WHERE s.full = false
					AND sa.channel = 'Direto'
					AND sa.sale_date >= (CURRENT_DATE - (${windowDays}::int - 1))
				GROUP BY s.product_id
			)
			SELECT
				s.product_id::text AS product_id,
				s.id::text         AS stock_id,
				s.title            AS stock_title,
				s.qtde             AS qtde,
				COALESCE(ps.units, 0)::int AS units_window
			FROM stocks s
			JOIN products p ON p.id = s.product_id
			LEFT JOIN physical_sales ps ON ps.product_id = s.product_id
			WHERE s.full = false AND p.deleted_at IS NULL
			ORDER BY s.product_id, s.qtde DESC, s.created_at ASC
		`)

		const byProduct = new Map<string, PhysicalSupplyRow>()

		for (const row of rows) {
			const productId = String(row.product_id)
			let supply = byProduct.get(productId)

			if (!supply) {
				supply = {
					product_id: productId,
					units_window: Number(row.units_window),
					deposits: [],
				}
				byProduct.set(productId, supply)
			}

			supply.deposits.push({
				stock_id: String(row.stock_id),
				stock_title: String(row.stock_title),
				qtde: Number(row.qtde),
			})
		}

		return [...byProduct.values()]
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

	/**
	 * O outro lado do rascunho: ele conta como a caminho do destino, mas o saldo
	 * da origem so e debitado no despacho. Sem isso o mesmo estoque fisico seria
	 * oferecido a um segundo CD e os dois rascunhos juntos nao caberiam.
	 *
	 * Envio em transito nao entra: aquele ja saiu do saldo da origem.
	 */
	async fetchDraftedSourceCommitments(): Promise<DraftedSourceRow[]> {
		const rows = await db.execute(sql`
			SELECT
				si.source_stock_id::text AS source_stock_id,
				SUM(si.quantity)::int    AS quantity
			FROM shipment_items si
			JOIN shipments sh ON sh.id = si.shipment_id
			WHERE sh.status = 'rascunho'
			GROUP BY si.source_stock_id
		`)

		return [...rows].map((row) => ({
			source_stock_id: String(row.source_stock_id),
			quantity: Number(row.quantity),
		}))
	}
}
