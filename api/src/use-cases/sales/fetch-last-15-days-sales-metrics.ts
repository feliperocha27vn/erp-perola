import type { SaleRepository } from "../../repositories/sale-repository.js"

interface FetchLast15DaysSalesMetricsUseCaseResponse {
	items: Awaited<
		ReturnType<SaleRepository["fetchLast15DaysSalesMetrics"]>
	>["items"]
	daily_average_cents: number
}

export class FetchLast15DaysSalesMetricsUseCase {
	constructor(private saleRepository: SaleRepository) {}

	async execute(): Promise<FetchLast15DaysSalesMetricsUseCaseResponse> {
		const result = await this.saleRepository.fetchLast15DaysSalesMetrics()

		return {
			items: result.items,
			daily_average_cents: result.daily_average_cents,
		}
	}
}
