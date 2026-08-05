import { DrizzleFullReplenishmentRepository } from "../../repositories/drizzle/drizzle-full-replenishment-repository.js"
import { FetchFullReplenishmentAlertsUseCase } from "../../use-cases/reports/fetch-full-replenishment-alerts.js"

export function makeFetchFullReplenishmentAlertsUseCase() {
	const repo = new DrizzleFullReplenishmentRepository()
	return new FetchFullReplenishmentAlertsUseCase(repo)
}
