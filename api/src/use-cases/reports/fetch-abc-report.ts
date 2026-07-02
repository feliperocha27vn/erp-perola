import type { AbcReportRepository } from "../../repositories/report-repository.js"

interface FetchAbcReportUseCaseRequest {
	startDate: Date
	endDate: Date
}

export interface AbcItem {
	rank: number
	sku: string
	total_revenue: number
	percentage: number
	cumulative_percentage: number
	class: "A" | "B" | "C"
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

export class FetchAbcReportUseCase {
	constructor(private repo: AbcReportRepository) {}

	async execute({ startDate, endDate }: FetchAbcReportUseCaseRequest): Promise<FetchAbcReportUseCaseResponse> {
		const rows = await this.repo.fetchAbcReport(startDate, endDate)

		const storeMap = new Map<string, { total: number; skus: Map<string, number> }>()

		for (const row of rows) {
			const key = row.store_name ?? "Sem loja"
			if (!storeMap.has(key)) {
				storeMap.set(key, { total: 0, skus: new Map() })
			}
			const store = storeMap.get(key)!
			store.total += row.total_revenue
			store.skus.set(row.sku, (store.skus.get(row.sku) ?? 0) + row.total_revenue)
		}

		const stores: AbcStore[] = []

		for (const [store_name, { total, skus }] of storeMap) {
			const sorted = Array.from(skus.entries()).sort((a, b) => b[1] - a[1])

			let cumulative = 0
			const items: AbcItem[] = sorted.map(([sku, revenue], idx) => {
				const percentage = total > 0 ? (revenue / total) * 100 : 0
				const prevCumulative = cumulative
				cumulative += percentage

				const cls: "A" | "B" | "C" =
					prevCumulative < CLASS_A_THRESHOLD
						? "A"
						: prevCumulative < CLASS_B_THRESHOLD
							? "B"
							: "C"

				return {
					rank: idx + 1,
					sku,
					total_revenue: revenue,
					percentage: Math.round(percentage * 100) / 100,
					cumulative_percentage: Math.round(cumulative * 100) / 100,
					class: cls,
				}
			})

			stores.push({ store_name, total_revenue: total, items })
		}

		stores.sort((a, b) => b.total_revenue - a.total_revenue)

		return { stores }
	}
}
