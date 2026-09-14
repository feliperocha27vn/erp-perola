import type { AlertNotificationRepository } from "../../repositories/alert-notification-repository.js"

interface MarkAllAlertNotificationsReadUseCaseResponse {
	updated: number
}

export class MarkAllAlertNotificationsReadUseCase {
	constructor(
		private repo: AlertNotificationRepository,
		private now: () => Date = () => new Date(),
	) {}

	async execute(): Promise<MarkAllAlertNotificationsReadUseCaseResponse> {
		const updated = await this.repo.markAllRead(this.now())
		return { updated }
	}
}
