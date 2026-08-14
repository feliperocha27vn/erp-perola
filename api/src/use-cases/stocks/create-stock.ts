import { ProductNotFoundError } from "../../errors/product-not-found-error.js"
import type { Marketplace, ProductRepository } from "../../repositories/product-repository.js"
import type { StockRepository } from "../../repositories/stock-repository.js"

interface CreateStockUseCaseRequest {
	productId: string
	title: string
	qtde: number
	full: boolean
	marketplace?: Marketplace | null
	storeId?: string | null
}

interface CreateStockUseCaseResponse {
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
		marketplace,
		storeId,
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
			// Marketplace so faz sentido em estoque full; no fisico fica nulo.
			marketplace: full ? (marketplace ?? null) : null,
			// Conta idem: o deposito proprio atende todas, entao nao pertence a nenhuma.
			store_id: full ? (storeId ?? null) : null,
		})

		return { stock }
	}
}
