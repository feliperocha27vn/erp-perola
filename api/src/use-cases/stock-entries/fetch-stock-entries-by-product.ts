import type { StockEntryRepository, StockEntryWithContext } from "../../repositories/stock-entry-repository.js"

interface FetchStockEntriesByProductUseCaseRequest {
	productId: string
}

interface FetchStockEntriesByProductUseCaseResponse {
	entries: StockEntryWithContext[]
}

export class FetchStockEntriesByProductUseCase {
	constructor(private stockEntryRepo: StockEntryRepository) {}

	async execute({
		productId,
	}: FetchStockEntriesByProductUseCaseRequest): Promise<FetchStockEntriesByProductUseCaseResponse> {
		const entries = await this.stockEntryRepo.findByProductId(productId)
		return { entries }
	}
}
