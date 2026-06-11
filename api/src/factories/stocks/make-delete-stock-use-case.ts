import { DrizzleStockRepository } from "../../repositories/drizzle/drizzle-stock-repository.js"
import { DeleteStockUseCase } from "../../use-cases/stocks/delete-stock.js"

export function makeDeleteStockUseCase() {
	const stockRepository = new DrizzleStockRepository()
	const deleteStockUseCase = new DeleteStockUseCase(stockRepository)

	return deleteStockUseCase
}
