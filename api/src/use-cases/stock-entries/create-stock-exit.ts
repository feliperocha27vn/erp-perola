import { InsufficientStockError } from "../../errors/insufficient-stock-error.js"
import { StockNotFoundError } from "../../errors/stock-not-found-error.js"
import type { StockEntryRepository } from "../../repositories/stock-entry-repository.js"
import type { StockRepository } from "../../repositories/stock-repository.js"

interface CreateStockExitUseCaseRequest {
	stockId: string
	quantity: number
	notes: string | null
}

interface CreateStockExitUseCaseResponse {
	entry: {
		id: string
		stock_id: string
		quantity: number
		notes: string | null
		created_at: Date
	}
}

/**
 * Retirada manual de estoque.
 *
 * Vira um lancamento negativo em stock_entries, o mesmo formato que o despacho
 * de envio ja grava. Assim o historico de lancamentos e a reconstrucao do
 * estoque passado no Abastecimento do Full enxergam a saida sem tabela nova.
 */
export class CreateStockExitUseCase {
	constructor(
		private stockRepo: StockRepository,
		private stockEntryRepo: StockEntryRepository,
	) {}

	async execute({
		stockId,
		quantity,
		notes,
	}: CreateStockExitUseCaseRequest): Promise<CreateStockExitUseCaseResponse> {
		const stock = await this.stockRepo.getById(stockId)

		if (!stock) {
			throw new StockNotFoundError()
		}

		if (stock.qtde < quantity) {
			throw new InsufficientStockError()
		}

		const entry = await this.stockEntryRepo.create({
			stock_id: stockId,
			quantity: -quantity,
			notes,
		})

		await this.stockRepo.update(stockId, { qtde: stock.qtde - quantity })

		return { entry }
	}
}
