import type { AbcReportRepository } from "../../repositories/report-repository.js"

interface FetchAbcReportUseCaseRequest {
	startDate: Date
	endDate: Date
}

export interface AbcItem {
	rank: number
	sku: string
	total_revenue: number
	qty_sales: number
	qty_units: number
	percentage: number
	cumulative_percentage: number
	class: "A" | "B" | "C"
	stock_qty: number
	units_90d: number
	coverage_percentage: number | null
	needs_purchase: boolean
}

export interface AbcStore {
	store_name: string
	total_revenue: number
	items: AbcItem[]
}

interface FetchAbcReportUseCaseResponse {
	stores: AbcStore[]
}

const CLASS_A_THRESHOLD = 80
const CLASS_B_THRESHOLD = 95
const COVERAGE_ALERT_THRESHOLD = 100

export class FetchAbcReportUseCase {
	constructor(private repo: AbcReportRepository) {}

	async execute({ startDate, endDate }: FetchAbcReportUseCaseRequest): Promise<FetchAbcReportUseCaseResponse> {
		const [rows, stockTotals, units90d] = await Promise.all([
			this.repo.fetchAbcReport(startDate, endDate),
			this.repo.fetchStockTotals(),
			this.repo.fetchUnits90dByStore(),
		])

		const stockBySku = new Map(stockTotals.map((row) => [row.sku, row.stock_qty]))
		const units90dByKey = new Map(
			units90d.map((row) => [`${row.store_name ?? "Sem loja"}::${row.sku}`, row.units_90d]),
		)

		type SkuData = { revenue: number; qty_sales: number; qty_units: number }
		const storeMap = new Map<string, { total: number; skus: Map<string, SkuData> }>()

		for (const row of rows) {
			const key = row.store_name ?? "Sem loja"
			if (!storeMap.has(key)) {
				storeMap.set(key, { total: 0, skus: new Map() })
			}
			const store = storeMap.get(key)!
			store.total += row.total_revenue
			const existing = store.skus.get(row.sku)
			store.skus.set(row.sku, {
				revenue: (existing?.revenue ?? 0) + row.total_revenue,
				qty_sales: (existing?.qty_sales ?? 0) + row.qty_sales,
				qty_units: (existing?.qty_units ?? 0) + row.qty_units,
			})
		}

		const stores: AbcStore[] = []

		for (const [store_name, { total, skus }] of storeMap) {
			const sorted = Array.from(skus.entries()).sort((a, b) => b[1].revenue - a[1].revenue)

			let cumulative = 0
			const items: AbcItem[] = sorted.map(([sku, { revenue, qty_sales, qty_units }], idx) => {
				const percentage = total > 0 ? (revenue / total) * 100 : 0
				const prevCumulative = cumulative
				cumulative += percentage

				const cls: "A" | "B" | "C" =
					prevCumulative < CLASS_A_THRESHOLD
						? "A"
						: prevCumulative < CLASS_B_THRESHOLD
							? "B"
							: "C"

				const stock_qty = stockBySku.get(sku) ?? 0
				const units_90d = units90dByKey.get(`${store_name}::${sku}`) ?? 0
				const coverage_percentage =
					units_90d > 0 ? Math.round((stock_qty / units_90d) * 10000) / 100 : null
				const needs_purchase = coverage_percentage !== null && coverage_percentage < COVERAGE_ALERT_THRESHOLD

				return {
					rank: idx + 1,
					sku,
					total_revenue: revenue,
					qty_sales,
					qty_units,
					percentage: Math.round(percentage * 100) / 100,
					cumulative_percentage: Math.round(cumulative * 100) / 100,
					class: cls,
					stock_qty,
					units_90d,
					coverage_percentage,
					needs_purchase,
				}
			})

			stores.push({ store_name, total_revenue: total, items })
		}

		stores.sort((a, b) => b.total_revenue - a.total_revenue)

		return { stores }
	}
}
