import type {
	StockReportRepository,
	StockReportRow,
} from "../../repositories/report-repository.js"

interface FetchStockReportUseCaseRequest {
	brandId: string | null
}

export interface StockReportItem extends StockReportRow {
	daysWithoutSale: number | null
}

interface FetchStockReportUseCaseResponse {
	products: StockReportItem[]
}

const MS_PER_DAY = 1000 * 60 * 60 * 24

export class FetchStockReportUseCase {
	constructor(
		private reportRepository: StockReportRepository,
		private now: () => Date = () => new Date(),
	) {}

	async execute(
		request: FetchStockReportUseCaseRequest,
	): Promise<FetchStockReportUseCaseResponse> {
		const rows = await this.reportRepository.fetchStockReport(request.brandId)
		const today = this.now()

		const products: StockReportItem[] = rows.map((row) => ({
			...row,
			daysWithoutSale:
				row.lastSaleDate === null
					? null
					: Math.floor((today.getTime() - row.lastSaleDate.getTime()) / MS_PER_DAY),
		}))

		return { products }
	}
}
