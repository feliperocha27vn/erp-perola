import { DrizzleAlertNotificationRepository } from "../../repositories/drizzle/drizzle-alert-notification-repository.js"
import { MarkAllAlertNotificationsReadUseCase } from "../../use-cases/notifications/mark-all-alert-notifications-read.js"

export function makeMarkAllAlertNotificationsReadUseCase() {
	const repo = new DrizzleAlertNotificationRepository()
	return new MarkAllAlertNotificationsReadUseCase(repo)
}
