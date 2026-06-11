import { DrizzleStockRepository } from "../../repositories/drizzle/drizzle-stock-repository.js"
import { UpdateStockUseCase } from "../../use-cases/stocks/update-stock.js"

export function makeUpdateStockUseCase() {
	const stockRepository = new DrizzleStockRepository()
	const updateStockUseCase = new UpdateStockUseCase(stockRepository)

	return updateStockUseCase
}
