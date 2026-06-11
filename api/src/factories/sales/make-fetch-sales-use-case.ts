import { DrizzleSaleRepository } from "../../repositories/drizzle/drizzle-sale-repository.js"
import { FetchSalesUseCase } from "../../use-cases/sales/fetch-sales.js"

export function makeFetchSalesUseCase() {
	const saleRepository = new DrizzleSaleRepository()
	const fetchSalesUseCase = new FetchSalesUseCase(saleRepository)

	return fetchSalesUseCase
}
