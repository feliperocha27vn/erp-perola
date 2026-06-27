import { DrizzleReportRepository } from "../../repositories/drizzle/drizzle-report-repository.js"
import { FetchSalesReportUseCase } from "../../use-cases/reports/fetch-sales-report.js"

export function makeFetchSalesReportUseCase() {
	const repository = new DrizzleReportRepository()
	return new FetchSalesReportUseCase(repository)
}
