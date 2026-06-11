import type { SaleRepository } from "../../repositories/sale-repository.js"

interface FetchLastMonthSalesMetricsUseCaseResponse {
	total_cents: number
}

export class FetchLastMonthSalesMetricsUseCase {
	constructor(private saleRepository: SaleRepository) {}

	async execute(): Promise<FetchLastMonthSalesMetricsUseCaseResponse> {
		const result = await this.saleRepository.fetchLastMonthSalesMetrics()

		return {
			total_cents: result.total_cents,
		}
	}
}
