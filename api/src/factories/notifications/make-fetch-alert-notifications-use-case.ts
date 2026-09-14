import { DrizzleAlertNotificationRepository } from "../../repositories/drizzle/drizzle-alert-notification-repository.js"
import { DrizzleFullReplenishmentRepository } from "../../repositories/drizzle/drizzle-full-replenishment-repository.js"
import { DrizzleReportRepository } from "../../repositories/drizzle/drizzle-report-repository.js"
import { EvaluateAlertNotificationsUseCase } from "../../use-cases/notifications/evaluate-alert-notifications.js"
import { FetchAlertNotificationsUseCase } from "../../use-cases/notifications/fetch-alert-notifications.js"
import { FetchFullReplenishmentAlertsUseCase } from "../../use-cases/reports/fetch-full-replenishment-alerts.js"
import { FetchRestockAlertsUseCase } from "../../use-cases/reports/fetch-restock-alerts.js"

export function makeFetchAlertNotificationsUseCase() {
	const repo = new DrizzleAlertNotificationRepository()

	const evaluate = new EvaluateAlertNotificationsUseCase(
		new FetchRestockAlertsUseCase(new DrizzleReportRepository()),
		new FetchFullReplenishmentAlertsUseCase(new DrizzleFullReplenishmentRepository()),
		repo,
	)

	return new FetchAlertNotificationsUseCase(evaluate, repo)
}
