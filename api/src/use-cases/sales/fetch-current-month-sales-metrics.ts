import type { SaleRepository } from "../../repositories/sale-repository.js"

interface FetchCurrentMonthSalesMetricsUseCaseResponse {
	items: Awaited<ReturnType<SaleRepository["fetchCurrentMonthSalesMetrics"]>>["items"]
	daily_average_cents: number
}

export class FetchCurrentMonthSalesMetricsUseCase {
	constructor(private saleRepository: SaleRepository) {}

	async execute(): Promise<FetchCurrentMonthSalesMetricsUseCaseResponse> {
		const result = await this.saleRepository.fetchCurrentMonthSalesMetrics()

		return {
			items: result.items,
			daily_average_cents: result.daily_average_cents,
		}
	}
}
