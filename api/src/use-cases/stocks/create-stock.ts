import { ProductNotFoundError } from "../../errors/product-not-found-error.js"
import type { ProductRepository } from "../../repositories/product-repository.js"
import type { StockRepository } from "../../repositories/stock-repository.js"

interface CreateStockUseCaseRequest {
	productId: string
	title: string
	qtde: number
	full: boolean
}

interface CreateStockUseCaseResponse {
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

export class CreateStockUseCase {
	constructor(
		private productRepository: ProductRepository,
		private stockRepository: StockRepository,
	) {}

	async execute({
		productId,
		title,
		qtde,
		full,
	}: CreateStockUseCaseRequest): Promise<CreateStockUseCaseResponse> {
		const product = await this.productRepository.getProductById(productId)

		if (!product) {
			throw new ProductNotFoundError()
		}

		const stock = await this.stockRepository.create({
			product_id: productId,
			title,
			qtde,
			full,
		})

		return { stock }
	}
}
