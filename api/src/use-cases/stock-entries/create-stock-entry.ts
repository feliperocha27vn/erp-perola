import { StockNotFoundError } from "../../errors/stock-not-found-error.js"
import type { StockEntryRepository } from "../../repositories/stock-entry-repository.js"
import type { StockRepository } from "../../repositories/stock-repository.js"

interface CreateStockEntryUseCaseRequest {
	stockId: string
	quantity: number
	notes: string | null
}

interface CreateStockEntryUseCaseResponse {
	entry: {
		id: string
		stock_id: string
		quantity: number
		notes: string | null
		created_at: Date
	}
}

export class CreateStockEntryUseCase {
	constructor(
		private stockRepo: StockRepository,
		private stockEntryRepo: StockEntryRepository,
	) {}

	async execute({
		stockId,
		quantity,
		notes,
	}: CreateStockEntryUseCaseRequest): Promise<CreateStockEntryUseCaseResponse> {
		const stock = await this.stockRepo.getById(stockId)

		if (!stock) {
			throw new StockNotFoundError()
		}

		const entry = await this.stockEntryRepo.create({
			stock_id: stockId,
			quantity,
			notes,
		})

		await this.stockRepo.update(stockId, { qtde: stock.qtde + quantity })

		return { entry }
	}
}
