import { DrizzleSaleRepository } from "../../repositories/drizzle/drizzle-sale-repository.js"
import { FetchLast15DaysSalesMetricsUseCase } from "../../use-cases/sales/fetch-last-15-days-sales-metrics.js"

export function makeFetchLast15DaysSalesMetricsUseCase() {
	const saleRepository = new DrizzleSaleRepository()
	const fetchLast15DaysSalesMetricsUseCase =
		new FetchLast15DaysSalesMetricsUseCase(saleRepository)

	return fetchLast15DaysSalesMetricsUseCase
}
