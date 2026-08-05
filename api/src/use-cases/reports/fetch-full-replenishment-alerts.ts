import type {
	FullReplenishmentRepository,
	FullStockRow,
	Marketplace,
} from "../../repositories/report-repository.js"

/** Janela de apuracao. Relogio gira devagar; 30 dias devolve zero na maioria dos SKUs. */
export const WINDOW_DAYS = 90

/**
 * Abaixo disto o denominador "dias com estoque" e pequeno demais para confiar:
 * um deposito que teve estoque 2 dias e vendeu 1 implicaria 0,5 unidade/dia.
 */
export const MIN_DAYS_WITH_STOCK = 14

/** Folga sobre o lead time, para o alerta nao chegar em cima da hora. */
export const SAFETY_MARGIN_DAYS = 7

/** Dias de venda direta que ficam reservados no estoque fisico. */
export const PHYSICAL_RESERVE_DAYS = 15

interface MarketplaceParams {
	/** Do despacho ate ficar vendavel no CD. */
	leadTimeDays: number
	/** Cobertura que se busca ao abastecer. */
	targetDays: number
	/** Acima disto o CD vira custo: Amazon trata como excesso, ML cobra por parado. */
	maxDays: number
}

export const MARKETPLACE_PARAMS: Record<Marketplace, MarketplaceParams> = {
	mercado_livre: { leadTimeDays: 7, targetDays: 45, maxDays: 90 },
	amazon: { leadTimeDays: 14, targetDays: 60, maxDays: 90 },
	shopee: { leadTimeDays: 10, targetDays: 45, maxDays: 90 },
}

export interface FullReplenishmentAlertItem {
	product_id: string
	sku: string
	brand_name: string | null
	stock_id: string
	stock_title: string
	marketplace: Marketplace
	available_qty: number
	in_transit_qty: number
	units_window: number
	demand_rate_per_day: number
	/** Autonomia do que esta disponivel para venda hoje, sem contar o que vem a caminho. */
	days_of_autonomy: number | null
	rate_is_estimated: boolean
	reorder_point_days: number
	severity: "critico" | "atencao"
	suggested_quantity: number
	limited_by_physical_stock: boolean
	physical_stock_id: string | null
	physical_stock_title: string | null
	physical_available_qty: number
}

export interface IdleFullStockItem {
	product_id: string
	sku: string
	brand_name: string | null
	stock_id: string
	stock_title: string
	marketplace: Marketplace
	qtde: number
	units_window: number
	/** null quando nao houve nenhuma venda na janela. */
	days_of_autonomy: number | null
	max_days: number
}

interface FetchFullReplenishmentAlertsUseCaseResponse {
	alerts: FullReplenishmentAlertItem[]
	idle: IdleFullStockItem[]
}

interface Evaluated {
	stock: FullStockRow
	rate: number
	rateIsEstimated: boolean
	unitsWindow: number
	inTransit: number
	/** Autonomia do disponivel — e o que aparece na tela. */
	autonomy: number | null
	/** Autonomia contando o que ja vem a caminho — e o que decide se alerta. */
	effectiveAutonomy: number | null
}

export class FetchFullReplenishmentAlertsUseCase {
	constructor(private repo: FullReplenishmentRepository) {}

	async execute(): Promise<FetchFullReplenishmentAlertsUseCaseResponse> {
		const [fullStocks, demandRows, physicalRows, inTransitRows] = await Promise.all([
			this.repo.fetchFullStocks(),
			this.repo.fetchFullStockDemand(WINDOW_DAYS),
			this.repo.fetchPhysicalSupply(WINDOW_DAYS),
			this.repo.fetchInTransitQuantities(),
		])

		const demandByStock = new Map(demandRows.map((row) => [row.stock_id, row]))
		const physicalByProduct = new Map(physicalRows.map((row) => [row.product_id, row]))

		const inTransitByStock = new Map<string, number>()
		for (const row of inTransitRows) {
			const current = inTransitByStock.get(row.destination_stock_id) ?? 0
			inTransitByStock.set(row.destination_stock_id, current + row.quantity)
		}

		// Ritmo medio por deposito do produto, usado quando um deposito especifico
		// nao tem dias com estoque suficientes para uma taxa propria.
		const productTotals = new Map<string, { units: number; days: number }>()
		for (const stock of fullStocks) {
			const demand = demandByStock.get(stock.stock_id)
			const totals = productTotals.get(stock.product_id) ?? { units: 0, days: 0 }
			totals.units += demand?.units_window ?? 0
			totals.days += demand?.days_with_stock ?? 0
			productTotals.set(stock.product_id, totals)
		}

		const evaluated: Evaluated[] = fullStocks.map((stock) => {
			const demand = demandByStock.get(stock.stock_id)
			const unitsWindow = demand?.units_window ?? 0
			const daysWithStock = demand?.days_with_stock ?? 0
			const inTransit = inTransitByStock.get(stock.stock_id) ?? 0

			let rate: number
			let rateIsEstimated: boolean

			if (daysWithStock >= MIN_DAYS_WITH_STOCK) {
				rate = unitsWindow / daysWithStock
				rateIsEstimated = false
			} else {
				const totals = productTotals.get(stock.product_id)
				rate = totals && totals.days > 0 ? totals.units / totals.days : 0
				rateIsEstimated = true
			}

			return {
				stock,
				rate,
				rateIsEstimated,
				unitsWindow,
				inTransit,
				autonomy: rate > 0 ? stock.qtde / rate : null,
				effectiveAutonomy: rate > 0 ? (stock.qtde + inTransit) / rate : null,
			}
		})

		const idle: IdleFullStockItem[] = []
		const candidates: Evaluated[] = []

		for (const entry of evaluated) {
			const params = MARKETPLACE_PARAMS[entry.stock.marketplace]
			const reorderPoint = params.leadTimeDays + SAFETY_MARGIN_DAYS

			// Sem ritmo nao ha o que projetar. Se ainda assim ha estoque parado la,
			// isso e o caso "90 dias sem venda" que o ML penaliza.
			if (entry.rate === 0) {
				if (entry.stock.qtde > 0) {
					idle.push(this.toIdleItem(entry, params.maxDays, null))
				}
				continue
			}

			if (entry.autonomy !== null && entry.autonomy > params.maxDays) {
				idle.push(this.toIdleItem(entry, params.maxDays, entry.autonomy))
				continue
			}

			if (entry.effectiveAutonomy !== null && entry.effectiveAutonomy < reorderPoint) {
				candidates.push(entry)
			}
		}

		const alerts = this.allocate(candidates, physicalByProduct)

		alerts.sort((a, b) => {
			if (a.severity !== b.severity) return a.severity === "critico" ? -1 : 1
			return (a.days_of_autonomy ?? 0) - (b.days_of_autonomy ?? 0)
		})

		idle.sort((a, b) => (b.days_of_autonomy ?? Number.MAX_SAFE_INTEGER) - (a.days_of_autonomy ?? Number.MAX_SAFE_INTEGER))

		return { alerts, idle }
	}

	private toIdleItem(
		entry: Evaluated,
		maxDays: number,
		autonomy: number | null,
	): IdleFullStockItem {
		return {
			product_id: entry.stock.product_id,
			sku: entry.stock.sku,
			brand_name: entry.stock.brand_name,
			stock_id: entry.stock.stock_id,
			stock_title: entry.stock.stock_title,
			marketplace: entry.stock.marketplace,
			qtde: entry.stock.qtde,
			units_window: entry.unitsWindow,
			days_of_autonomy: autonomy === null ? null : round2(autonomy),
			max_days: maxDays,
		}
	}

	/**
	 * O estoque fisico e do produto e disputado por todos os seus depositos full.
	 * Quem rupturar primeiro e servido primeiro; o que sobra vai para o proximo.
	 */
	private allocate(
		candidates: Evaluated[],
		physicalByProduct: Map<string, { stock_id: string; stock_title: string; qtde: number; units_window: number }>,
	): FullReplenishmentAlertItem[] {
		const byProduct = new Map<string, Evaluated[]>()
		for (const entry of candidates) {
			const list = byProduct.get(entry.stock.product_id) ?? []
			list.push(entry)
			byProduct.set(entry.stock.product_id, list)
		}

		const items: FullReplenishmentAlertItem[] = []

		for (const [productId, entries] of byProduct) {
			const physical = physicalByProduct.get(productId)
			const physicalRate = physical ? physical.units_window / WINDOW_DAYS : 0
			const reserve = Math.ceil(physicalRate * PHYSICAL_RESERVE_DAYS)
			let available = Math.max(0, (physical?.qtde ?? 0) - reserve)

			const ordered = [...entries].sort(
				(a, b) => (a.autonomy ?? 0) - (b.autonomy ?? 0),
			)

			for (const entry of ordered) {
				const params = MARKETPLACE_PARAMS[entry.stock.marketplace]
				const onHand = entry.stock.qtde + entry.inTransit

				const toTarget = Math.ceil(entry.rate * params.targetDays) - onHand
				const toCeiling = Math.floor(entry.rate * params.maxDays) - onHand
				const wanted = Math.max(0, Math.min(toTarget, toCeiling))

				const granted = Math.min(wanted, available)
				available -= granted

				items.push({
					product_id: entry.stock.product_id,
					sku: entry.stock.sku,
					brand_name: entry.stock.brand_name,
					stock_id: entry.stock.stock_id,
					stock_title: entry.stock.stock_title,
					marketplace: entry.stock.marketplace,
					available_qty: entry.stock.qtde,
					in_transit_qty: entry.inTransit,
					units_window: entry.unitsWindow,
					demand_rate_per_day: round2(entry.rate),
					days_of_autonomy: entry.autonomy === null ? null : round2(entry.autonomy),
					rate_is_estimated: entry.rateIsEstimated,
					reorder_point_days: params.leadTimeDays + SAFETY_MARGIN_DAYS,
					severity:
						entry.effectiveAutonomy !== null && entry.effectiveAutonomy < params.leadTimeDays
							? "critico"
							: "atencao",
					suggested_quantity: granted,
					limited_by_physical_stock: granted < wanted,
					physical_stock_id: physical?.stock_id ?? null,
					physical_stock_title: physical?.stock_title ?? null,
					physical_available_qty: physical?.qtde ?? 0,
				})
			}
		}

		return items
	}
}

function round2(value: number) {
	return Math.round(value * 100) / 100
}
