import { DrizzleSaleRepository } from "../../repositories/drizzle/drizzle-sale-repository.js"
import { FetchMonthlySalesPaceMetricsUseCase } from "../../use-cases/sales/fetch-monthly-sales-pace-metrics.js"

export function makeFetchMonthlySalesPaceMetricsUseCase() {
	const saleRepository = new DrizzleSaleRepository()
	const fetchMonthlySalesPaceMetricsUseCase =
		new FetchMonthlySalesPaceMetricsUseCase(saleRepository)

	return fetchMonthlySalesPaceMetricsUseCase
}
