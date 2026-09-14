import type { FastifyInstance } from "fastify"
import { fetchAlertNotifications } from "./fetch-alert-notifications.js"
import { markAlertNotificationRead } from "./mark-alert-notification-read.js"
import { markAllAlertNotificationsRead } from "./mark-all-alert-notifications-read.js"

export async function notificationsRoutes(app: FastifyInstance) {
	app.register(fetchAlertNotifications)
	app.register(markAlertNotificationRead)
	app.register(markAllAlertNotificationsRead)
}
