import { DrizzleSaleRepository } from "../../repositories/drizzle/drizzle-sale-repository.js"
import { FetchCurrentMonthSalesMetricsUseCase } from "../../use-cases/sales/fetch-current-month-sales-metrics.js"

export function makeFetchCurrentMonthSalesMetricsUseCase() {
	const saleRepository = new DrizzleSaleRepository()
	const fetchCurrentMonthSalesMetricsUseCase =
		new FetchCurrentMonthSalesMetricsUseCase(saleRepository)

	return fetchCurrentMonthSalesMetricsUseCase
}
