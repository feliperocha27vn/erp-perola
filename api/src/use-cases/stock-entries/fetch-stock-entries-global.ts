import type { FetchGlobalParams, StockEntryRepository, StockEntryWithContext } from "../../repositories/stock-entry-repository.js"

interface FetchStockEntriesGlobalUseCaseRequest {
	brandId: string | null
	noBrand: boolean
	startDate: Date
	endDate: Date
}

interface FetchStockEntriesGlobalUseCaseResponse {
	entries: StockEntryWithContext[]
}

export class FetchStockEntriesGlobalUseCase {
	constructor(private stockEntryRepo: StockEntryRepository) {}

	async execute(
		req: FetchStockEntriesGlobalUseCaseRequest,
	): Promise<FetchStockEntriesGlobalUseCaseResponse> {
		const params: FetchGlobalParams = {
			brandId: req.noBrand ? null : req.brandId,
			noBrand: req.noBrand,
			startDate: req.startDate,
			endDate: req.endDate,
		}
		const entries = await this.stockEntryRepo.findGlobal(params)
		return { entries }
	}
}
