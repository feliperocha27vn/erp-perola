import { DrizzleProductRepository } from "../../repositories/drizzle/drizzle-product-repository.js"
import { DrizzleStockRepository } from "../../repositories/drizzle/drizzle-stock-repository.js"
import { CreateStockUseCase } from "../../use-cases/stocks/create-stock.js"

export function makeCreateStockUseCase() {
	const productRepository = new DrizzleProductRepository()
	const stockRepository = new DrizzleStockRepository()
	const createStockUseCase = new CreateStockUseCase(
		productRepository,
		stockRepository,
	)

	return createStockUseCase
}
