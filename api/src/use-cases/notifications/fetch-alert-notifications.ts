import type {
	AlertNotification,
	AlertNotificationRepository,
} from "../../repositories/alert-notification-repository.js"
import {
	type EvaluateAlertNotificationsUseCase,
	NOTIFICATION_HISTORY_DAYS,
} from "./evaluate-alert-notifications.js"

const DAY_MS = 24 * 60 * 60 * 1000

interface FetchAlertNotificationsUseCaseResponse {
	unread_count: number
	notifications: AlertNotification[]
}

/**
 * O que o sininho mostra. Avalia antes de listar: a consulta do sininho e o
 * momento em que as transicoes sao observadas, entao a venda que acabou de
 * deixar um produto critico ja volta nesta mesma resposta.
 */
export class FetchAlertNotificationsUseCase {
	constructor(
		private evaluate: Pick<EvaluateAlertNotificationsUseCase, "execute">,
		private repo: AlertNotificationRepository,
		private now: () => Date = () => new Date(),
	) {}

	async execute(): Promise<FetchAlertNotificationsUseCaseResponse> {
		await this.evaluate.execute()

		const cutoff = new Date(this.now().getTime() - NOTIFICATION_HISTORY_DAYS * DAY_MS)
		const [notifications, unread_count] = await Promise.all([
			this.repo.listVisible(cutoff),
			this.repo.countUnread(),
		])

		return { unread_count, notifications }
	}
}
