import { StockNotFoundError } from "../../errors/stock-not-found-error.js"
import type { StockRepository } from "../../repositories/stock-repository.js"

interface UpdateStockUseCaseRequest {
	stockId: string
	title?: string
	qtde?: number
	full?: boolean
}

interface UpdateStockUseCaseResponse {
	stock: {
		id: string
		product_id: string
		title: string
		qtde: number
		full: boolean
		created_at: Date
		updated_at: Date
	}
}

export class UpdateStockUseCase {
	constructor(private stockRepository: StockRepository) {}

	async execute({
		stockId,
		title,
		qtde,
		full,
	}: UpdateStockUseCaseRequest): Promise<UpdateStockUseCaseResponse> {
		const stock = await this.stockRepository.update(stockId, {
			title,
			qtde,
			full,
		})

		if (!stock) {
			throw new StockNotFoundError()
		}

		return { stock }
	}
}
