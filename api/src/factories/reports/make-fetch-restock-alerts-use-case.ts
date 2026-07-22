import { DrizzleReportRepository } from "../../repositories/drizzle/drizzle-report-repository.js"
import { FetchRestockAlertsUseCase } from "../../use-cases/reports/fetch-restock-alerts.js"

export function makeFetchRestockAlertsUseCase() {
	const repo = new DrizzleReportRepository()
	return new FetchRestockAlertsUseCase(repo)
}
