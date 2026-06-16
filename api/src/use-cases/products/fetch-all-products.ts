import type { ProductRepository } from "../../repositories/product-repository.js"

interface FetchAllProductsUseCaseRequest {
	pageIndex: number
	withoutImage?: boolean
	search?: string
	brandId?: string
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
		technical_subtitle: string | null
		technical_analysis: string | null
		technical_movement: string | null
		technical_case_and_crystal: string | null
		technical_specific_functionality: string | null
		technical_dial_and_luminosity: string | null
		technical_bracelet_construction: string | null
		technical_table: string | null
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
	}: FetchAllProductsUseCaseRequest): Promise<FetchAllProductsUseCaseReply> {
		const result = await this.productRepository.fetchProducts({
			pageIndex,
			withoutImage,
			search,
			brandId,
		})

		return result
	}
}
