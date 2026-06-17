import { DrizzleReportRepository } from "../../repositories/drizzle/drizzle-report-repository.js"
import { FetchStockReportUseCase } from "../../use-cases/reports/fetch-stock-report.js"

export function makeFetchStockReportUseCase() {
	const repository = new DrizzleReportRepository()
	return new FetchStockReportUseCase(repository)
}
