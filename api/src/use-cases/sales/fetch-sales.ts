import type { SaleRepository } from "../../repositories/sale-repository.js"

interface FetchSalesUseCaseRequest {
	startDate?: Date
	endDate?: Date
	brandId?: string
	storeId?: string
	page: number
	limit: number
}

interface FetchSalesUseCaseResponse {
	items: Awaited<ReturnType<SaleRepository["fetchSales"]>>["items"]
	totalCount: number
	totalPages: number
	currentPage: number
	brandCounts: Awaited<ReturnType<SaleRepository["fetchSales"]>>["brandCounts"]
}

export class FetchSalesUseCase {
	constructor(private saleRepository: SaleRepository) {}

	async execute({ startDate, endDate, brandId, storeId, page, limit }: FetchSalesUseCaseRequest): Promise<FetchSalesUseCaseResponse> {
		const result = await this.saleRepository.fetchSales({ startDate, endDate, brandId, storeId, page, limit })

		return {
			items: result.items,
			totalCount: result.totalCount,
			totalPages: result.totalPages,
			currentPage: result.currentPage,
			brandCounts: result.brandCounts,
		}
	}
}
