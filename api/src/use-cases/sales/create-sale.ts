import { ProductNotFoundError } from "../../errors/product-not-found-error.js"
import type { ProductRepository } from "../../repositories/product-repository.js"
import type {
	SaleChannel,
	SaleRepository,
} from "../../repositories/sale-repository.js"

interface CreateSaleUseCaseRequest {
	product_id: string
	stock_id: string
	store_id?: string | null
	quantity: number
	sale_price: number
	channel: SaleChannel
	sale_date: Date
}

interface CreateSaleUseCaseResponse {
	sale: Awaited<ReturnType<SaleRepository["createInTransaction"]>>
}

export class CreateSaleUseCase {
	constructor(
		private saleRepository: SaleRepository,
		private productRepository: ProductRepository,
	) {}

	async execute({
		product_id,
		stock_id,
		store_id,
		quantity,
		sale_price,
		channel,
		sale_date,
	}: CreateSaleUseCaseRequest): Promise<CreateSaleUseCaseResponse> {
		const product = await this.productRepository.getProductById(product_id)

		if (!product) {
			throw new ProductNotFoundError()
		}

		const sale = await this.saleRepository.createInTransaction({
			product_id,
			stock_id,
			store_id,
			quantity,
			sale_price,
			total_price: quantity * sale_price,
			channel,
			sale_date,
		})

		return { sale }
	}
}
