import type { SaleRepository } from "../../repositories/sale-repository.js"

interface FetchMonthlySalesPaceMetricsUseCaseResponse {
	items: Awaited<
		ReturnType<SaleRepository["fetchMonthlySalesPaceMetrics"]>
	>["items"]
	current_month_total_cents: number
	last_month_total_cents: number
}

export class FetchMonthlySalesPaceMetricsUseCase {
	constructor(private saleRepository: SaleRepository) {}

	async execute(): Promise<FetchMonthlySalesPaceMetricsUseCaseResponse> {
		const result = await this.saleRepository.fetchMonthlySalesPaceMetrics()

		return {
			items: result.items,
			current_month_total_cents: result.current_month_total_cents,
			last_month_total_cents: result.last_month_total_cents,
		}
	}
}
