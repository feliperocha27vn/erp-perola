import type {
	SalesReportRepository,
	SalesReportRow,
} from "../../repositories/report-repository.js"

interface FetchSalesReportUseCaseRequest {
	startDate: Date
	endDate: Date
}

interface FetchSalesReportUseCaseResponse {
	items: SalesReportRow[]
}

export class FetchSalesReportUseCase {
	constructor(private reportRepository: SalesReportRepository) {}

	async execute(
		request: FetchSalesReportUseCaseRequest,
	): Promise<FetchSalesReportUseCaseResponse> {
		const items = await this.reportRepository.fetchSalesReport(
			request.startDate,
			request.endDate,
		)
		return { items }
	}
}
