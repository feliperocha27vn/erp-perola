import { ProductNotFoundError } from "../../errors/product-not-found-error.js"
import type { ProductRepository } from "../../repositories/product-repository.js"

interface UpdateProductImageUseCaseRequest {
	id: string
	url_image: string
}

interface UpdateProductImageUseCaseReply {
	product: {
		id: string
		sku: string
		ean: string
		sale_price_cents: number | null
		brand_id: string | null
		brand: {
			id: string
			name: string
			created_at: Date
			updated_at: Date
		} | null
		url_image: string | null
		stocks: {
			id: string
			product_id: string
			title: string
			qtde: number
			full: boolean
		marketplace: "mercado_livre" | "amazon" | "shopee" | null
		store_id: string | null
			created_at: Date
			updated_at: Date
		}[]
		created_at: Date
		updated_at: Date
	}
}

export class UpdateProductImageUseCase {
	constructor(private productRepository: ProductRepository) {}

	async execute({
		id,
		url_image,
	}: UpdateProductImageUseCaseRequest): Promise<UpdateProductImageUseCaseReply> {
		const updatedProduct = await this.productRepository.updateProductImage(
			id,
			url_image,
		)

		if (!updatedProduct) {
			throw new ProductNotFoundError()
		}

		return { product: updatedProduct }
	}
}
