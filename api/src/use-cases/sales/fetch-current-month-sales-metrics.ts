import type { SaleRepository } from "../../repositories/sale-repository.js"

interface FetchCurrentMonthSalesMetricsUseCaseResponse {
	total_cents: number
}

export class FetchCurrentMonthSalesMetricsUseCase {
	constructor(private saleRepository: SaleRepository) {}

	async execute(): Promise<FetchCurrentMonthSalesMetricsUseCaseResponse> {
		const result = await this.saleRepository.fetchCurrentMonthSalesMetrics()

		return {
			total_cents: result.total_cents,
		}
	}
}
