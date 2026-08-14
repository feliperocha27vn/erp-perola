import { StockNotFoundError } from "../../errors/stock-not-found-error.js"
import type { Marketplace } from "../../repositories/product-repository.js"
import type { StockRepository } from "../../repositories/stock-repository.js"

interface UpdateStockUseCaseRequest {
	stockId: string
	title?: string
	qtde?: number
	full?: boolean
	marketplace?: Marketplace | null
	storeId?: string | null
}

interface UpdateStockUseCaseResponse {
	stock: {
		id: string
		product_id: string
		title: string
		qtde: number
		full: boolean
		marketplace: Marketplace | null
		store_id: string | null
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
		storeId,
	}: UpdateStockUseCaseRequest): Promise<UpdateStockUseCaseResponse> {
		// Deixar de ser full limpa o marketplace e a conta: estoque fisico nao tem
		// centro de distribuicao nem dono, atende todas as contas.
		const nextMarketplace = full === false ? null : marketplace
		const nextStoreId = full === false ? null : storeId

		const stock = await this.stockRepository.update(stockId, {
			title,
			qtde,
			full,
			marketplace: nextMarketplace,
			store_id: nextStoreId,
		})

		if (!stock) {
			throw new StockNotFoundError()
		}

		return { stock }
	}
}
