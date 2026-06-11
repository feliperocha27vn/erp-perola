import { ProductNotFoundError } from "../../errors/product-not-found-error.js"
import type { ProductRepository } from "../../repositories/product-repository.js"
import type { StockRepository } from "../../repositories/stock-repository.js"

interface FetchStocksByProductIdUseCaseRequest {
	productId: string
}

interface FetchStocksByProductIdUseCaseResponse {
	stocks: {
		id: string
		product_id: string
		title: string
		qtde: number
		full: boolean
		created_at: Date
		updated_at: Date
	}[]
}

export class FetchStocksByProductIdUseCase {
	constructor(
		private productRepository: ProductRepository,
		private stockRepository: StockRepository,
	) {}

	async execute({
		productId,
	}: FetchStocksByProductIdUseCaseRequest): Promise<FetchStocksByProductIdUseCaseResponse> {
		const product = await this.productRepository.getProductById(productId)

		if (!product) {
			throw new ProductNotFoundError()
		}

		const stocks = await this.stockRepository.findByProductId(productId)

		return { stocks }
	}
}
