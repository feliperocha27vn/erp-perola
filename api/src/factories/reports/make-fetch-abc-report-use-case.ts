import { DrizzleReportRepository } from "../../repositories/drizzle/drizzle-report-repository.js"
import { FetchAbcReportUseCase } from "../../use-cases/reports/fetch-abc-report.js"

export function makeFetchAbcReportUseCase() {
	const repo = new DrizzleReportRepository()
	return new FetchAbcReportUseCase(repo)
}
