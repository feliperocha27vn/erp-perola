import { AlertNotificationNotFoundError } from "../../errors/alert-notification-not-found-error.js"
import type { AlertNotificationRepository } from "../../repositories/alert-notification-repository.js"

interface MarkAlertNotificationReadUseCaseRequest {
	id: string
}

/** Uma notificacao so vira lida quando e clicada — ver o toast nao conta. */
export class MarkAlertNotificationReadUseCase {
	constructor(
		private repo: AlertNotificationRepository,
		private now: () => Date = () => new Date(),
	) {}

	async execute({ id }: MarkAlertNotificationReadUseCaseRequest): Promise<void> {
		const found = await this.repo.markRead(id, this.now())
		if (!found) throw new AlertNotificationNotFoundError()
	}
}
