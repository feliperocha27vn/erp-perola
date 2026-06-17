import type {
	StockReportRepository,
	StockReportRow,
} from "../../repositories/report-repository.js"

interface FetchStockReportUseCaseRequest {
	brandId: string | null
}

interface FetchStockReportUseCaseResponse {
	products: StockReportRow[]
}

export class FetchStockReportUseCase {
	constructor(private reportRepository: StockReportRepository) {}

	async execute(
		request: FetchStockReportUseCaseRequest,
	): Promise<FetchStockReportUseCaseResponse> {
		const products = await this.reportRepository.fetchStockReport(
			request.brandId,
		)
		return { products }
	}
}
