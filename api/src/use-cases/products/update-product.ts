import { BrandNotFoundError } from "../../errors/brand-not-found-error.js"
import { ProductAlreadyExistsError } from "../../errors/product-already-exists-error.js"
import { ProductNotFoundError } from "../../errors/product-not-found-error.js"
import type { BrandRepository } from "../../repositories/brand-repository.js"
import type { ProductRepository } from "../../repositories/product-repository.js"

interface UpdateProductUseCaseRequest {
	id: string
	sku?: string
	ean?: string
	sale_price_cents?: number | null
	brand_id?: string
	url_image?: string | null
	technical_title?: string | null
	technical_description?: string | null
}

function normalizeValue(value: string): string {
	return value.trim().toUpperCase()
}

interface UpdateProductUseCaseResponse {
	product: {
		id: string
		sku: string
		ean: string
		brand_id: string | null
		sale_price_cents: number | null
		brand: {
			id: string
			name: string
			created_at: Date
			updated_at: Date
		} | null
		url_image: string | null
		technical_title: string | null
		technical_description: string | null
		stocks: {
			id: string
			product_id: string
			title: string
			qtde: number
			full: boolean
			created_at: Date
			updated_at: Date
		}[]
		created_at: Date
		updated_at: Date
	}
}

export class UpdateProductUseCase {
	constructor(
		private productRepository: ProductRepository,
		private brandRepository: BrandRepository,
	) {}

	async execute({
		id,
		sku,
		ean,
		sale_price_cents,
		brand_id,
		url_image,
		technical_title,
		technical_description,
	}: UpdateProductUseCaseRequest): Promise<UpdateProductUseCaseResponse> {
		const existingProduct = await this.productRepository.getProductById(id)

		if (!existingProduct) {
			throw new ProductNotFoundError()
		}

		if (brand_id) {
			const brand = await this.brandRepository.getById(brand_id)

			if (!brand) {
				throw new BrandNotFoundError()
			}
		}

		let normalizedSku: string | undefined

		if (sku !== undefined) {
			normalizedSku = normalizeValue(sku)
			const existingSku = await this.productRepository.getBySku(normalizedSku)

			if (existingSku && existingSku.id !== id) {
				throw new ProductAlreadyExistsError()
			}
		}

		let normalizedEan: string | undefined

		if (ean !== undefined) {
			normalizedEan = normalizeValue(ean)
			const existingEan = await this.productRepository.getByEan(normalizedEan)

			if (existingEan && existingEan.id !== id) {
				throw new ProductAlreadyExistsError()
			}
		}

		const product = await this.productRepository.update(id, {
			sku: normalizedSku,
			ean: normalizedEan,
			brand_id,
			sale_price_cents,
			url_image,
			technical_title,
			technical_description,
		})

		if (!product) {
			throw new ProductNotFoundError()
		}

		return { product }
	}
}
