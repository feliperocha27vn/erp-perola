import { DrizzleSaleRepository } from "../../repositories/drizzle/drizzle-sale-repository.js"
import { FetchLastMonthSalesMetricsUseCase } from "../../use-cases/sales/fetch-last-month-sales-metrics.js"

export function makeFetchLastMonthSalesMetricsUseCase() {
	const saleRepository = new DrizzleSaleRepository()
	const fetchLastMonthSalesMetricsUseCase =
		new FetchLastMonthSalesMetricsUseCase(saleRepository)

	return fetchLastMonthSalesMetricsUseCase
}
