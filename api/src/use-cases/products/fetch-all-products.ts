import type { ProductRepository } from "../../repositories/product-repository.js"

interface FetchAllProductsUseCaseRequest {
	pageIndex: number
	withoutImage?: boolean
	search?: string
	brandId?: string
	sortOrder?: 'asc' | 'desc'
}

interface FetchAllProductsUseCaseReply {
	items: {
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
		technical_title: string | null
		technical_description: string | null
		stocks: {
			id: string
			product_id: string
			title: string
			qtde: number
			full: boolean
		marketplace: "mercado_livre" | "amazon" | "shopee" | null
			created_at: Date
			updated_at: Date
		}[]
		created_at: Date
		updated_at: Date
	}[]
	total: number
	pageIndex: number
}

export class FetchAllProductsUseCase {
	constructor(private productRepository: ProductRepository) {}

	async execute({
		pageIndex,
		withoutImage,
		search,
		brandId,
		sortOrder,
	}: FetchAllProductsUseCaseRequest): Promise<FetchAllProductsUseCaseReply> {
		const result = await this.productRepository.fetchProducts({
			pageIndex,
			withoutImage,
			search,
			brandId,
			sortOrder,
		})

		return result
	}
}
