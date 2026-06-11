import { StockNotFoundError } from "../../errors/stock-not-found-error.js"
import type { StockRepository } from "../../repositories/stock-repository.js"

interface DeleteStockUseCaseRequest {
	stockId: string
}

export class DeleteStockUseCase {
	constructor(private stockRepository: StockRepository) {}

	async execute({ stockId }: DeleteStockUseCaseRequest): Promise<void> {
		const stock = await this.stockRepository.getById(stockId)

		if (!stock) {
			throw new StockNotFoundError()
		}

		await this.stockRepository.delete(stockId)
	}
}
