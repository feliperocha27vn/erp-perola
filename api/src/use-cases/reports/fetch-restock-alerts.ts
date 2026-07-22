import type { RestockAlertRepository } from "../../repositories/report-repository.js"

export type RestockAlertReason = "perto_do_limite" | "vendas_acelerando"

export interface RestockAlertItem {
	product_id: string
	sku: string
	brand_name: string | null
	physical_stock_qty: number
	units_15d: number
	units_30d: number
	coverage_percentage: number
	severity: "critico" | "atencao"
	reasons: RestockAlertReason[]
}

interface FetchRestockAlertsUseCaseResponse {
	items: RestockAlertItem[]
}

const ATTENTION_COVERAGE_THRESHOLD = 130

export class FetchRestockAlertsUseCase {
	constructor(private repo: RestockAlertRepository) {}

	async execute(): Promise<FetchRestockAlertsUseCaseResponse> {
		const [products, salesPace] = await Promise.all([
			this.repo.fetchRestockAlertProducts(),
			this.repo.fetchRestockAlertSalesPace(),
		])

		const salesByProduct = new Map(salesPace.map((row) => [row.product_id, row]))

		const items: RestockAlertItem[] = []

		for (const product of products) {
			const sales = salesByProduct.get(product.product_id)
			const units_30d = sales?.units_30d ?? 0
			const units_15d = sales?.units_15d ?? 0

			if (units_30d === 0) continue

			const coverage_percentage =
				Math.round((product.physical_stock_qty / units_30d) * 10000) / 100

			if (units_30d > product.physical_stock_qty) {
				items.push({
					product_id: product.product_id,
					sku: product.sku,
					brand_name: product.brand_name,
					physical_stock_qty: product.physical_stock_qty,
					units_15d,
					units_30d,
					coverage_percentage,
					severity: "critico",
					reasons: [],
				})
				continue
			}

			const reasons: RestockAlertReason[] = []
			if (coverage_percentage <= ATTENTION_COVERAGE_THRESHOLD) reasons.push("perto_do_limite")
			if (units_15d * 2 > units_30d) reasons.push("vendas_acelerando")

			if (reasons.length === 0) continue

			items.push({
				product_id: product.product_id,
				sku: product.sku,
				brand_name: product.brand_name,
				physical_stock_qty: product.physical_stock_qty,
				units_15d,
				units_30d,
				coverage_percentage,
				severity: "atencao",
				reasons,
			})
		}

		items.sort((a, b) => {
			if (a.severity !== b.severity) return a.severity === "critico" ? -1 : 1
			return a.coverage_percentage - b.coverage_percentage
		})

		return { items }
	}
}
