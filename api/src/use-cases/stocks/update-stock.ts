import { StockNotFoundError } from "../../errors/stock-not-found-error.js"
import type { Marketplace } from "../../repositories/product-repository.js"
import type { StockRepository } from "../../repositories/stock-repository.js"

interface UpdateStockUseCaseRequest {
	stockId: string
	title?: string
	qtde?: number
	full?: boolean
	marketplace?: Marketplace | null
}

interface UpdateStockUseCaseResponse {
	stock: {
		id: string
		product_id: string
		title: string
		qtde: number
		full: boolean
		marketplace: Marketplace | null
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
		marketplace,
	}: UpdateStockUseCaseRequest): Promise<UpdateStockUseCaseResponse> {
		// Deixar de ser full limpa o marketplace: estoque fisico nao tem centro de distribuicao.
		const nextMarketplace = full === false ? null : marketplace

		const stock = await this.stockRepository.update(stockId, {
			title,
			qtde,
			full,
			marketplace: nextMarketplace,
		})

		if (!stock) {
			throw new StockNotFoundError()
		}

		return { stock }
	}
}
