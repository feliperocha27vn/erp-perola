import { DrizzleProductRepository } from "../../repositories/drizzle/drizzle-product-repository.js"
import { DrizzleStockRepository } from "../../repositories/drizzle/drizzle-stock-repository.js"
import { FetchStocksByProductIdUseCase } from "../../use-cases/stocks/fetch-stocks-by-product-id.js"

export function makeFetchStocksByProductIdUseCase() {
	const productRepository = new DrizzleProductRepository()
	const stockRepository = new DrizzleStockRepository()
	const fetchStocksByProductIdUseCase = new FetchStocksByProductIdUseCase(
		productRepository,
		stockRepository,
	)

	return fetchStocksByProductIdUseCase
}
