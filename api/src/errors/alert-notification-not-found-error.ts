export class AlertNotificationNotFoundError extends Error {
	constructor() {
		super("Notificação não encontrada")
		this.name = "AlertNotificationNotFoundError"
	}
}
