import type {
	BrandSalesCount,
	Sale,
	SaleRepository,
} from "../../repositories/sale-repository.js"

interface FetchSalesUseCaseRequest {
	startDate?: Date
	endDate?: Date
	brandId?: string
	storeId?: string
	page: number
	limit: number
}

interface FetchSalesUseCaseResponse {
	items: Sale[]
	totalCount: number
	totalPages: number
	currentPage: number
	brandCounts: BrandSalesCount[]
}

export class FetchSalesUseCase {
	constructor(private saleRepository: SaleRepository) {}

	async execute({
		startDate,
		endDate,
		brandId,
		storeId,
		page,
		limit,
	}: FetchSalesUseCaseRequest): Promise<FetchSalesUseCaseResponse> {
		const offset = (page - 1) * limit

		const result = await this.saleRepository.findMany({
			startDate,
			endDate,
			brandId,
			storeId,
			limit,
			offset,
		})

		const totalPages = Math.max(1, Math.ceil(result.totalCount / limit))

		return {
			items: result.items,
			totalCount: result.totalCount,
			totalPages,
			currentPage: page,
			brandCounts: result.brandCounts,
		}
	}
}
