import { DrizzleAlertNotificationRepository } from "../../repositories/drizzle/drizzle-alert-notification-repository.js"
import { MarkAlertNotificationReadUseCase } from "../../use-cases/notifications/mark-alert-notification-read.js"

export function makeMarkAlertNotificationReadUseCase() {
	const repo = new DrizzleAlertNotificationRepository()
	return new MarkAlertNotificationReadUseCase(repo)
}
