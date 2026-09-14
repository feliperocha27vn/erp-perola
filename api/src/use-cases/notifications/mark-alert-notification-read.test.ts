import { beforeEach, describe, expect, it } from "vitest"
import { AlertNotificationNotFoundError } from "../../errors/alert-notification-not-found-error.js"
import type { AlertNotification } from "../../repositories/alert-notification-repository.js"
import { InMemoryAlertNotificationRepository } from "../../repositories/in-memory/in-memory-alert-notification-repository.js"
import { MarkAlertNotificationReadUseCase } from "./mark-alert-notification-read.js"
import { MarkAllAlertNotificationsReadUseCase } from "./mark-all-alert-notifications-read.js"

function notification(overrides: Partial<AlertNotification>): AlertNotification {
	return {
		id: "n1",
		subject_key: "reposicao:p1",
		kind: "reposicao",
		transition: "entrou",
		severity: "critico",
		product_id: "p1",
		sku: "469WC2NH",
		stock_id: null,
		stock_title: null,
		store_id: null,
		store_name: null,
		marketplace: null,
		physical_stock_qty: 3,
		units_30d: 8,
		days_of_autonomy: null,
		lead_time_days: null,
		account_units: null,
		created_at: new Date("2026-09-14T09:00:00Z"),
		read_at: null,
		resolved_at: null,
		...overrides,
	}
}

describe("MarkAlertNotificationReadUseCase", () => {
	let repo: InMemoryAlertNotificationRepository
	const now = new Date("2026-09-14T12:00:00Z")

	beforeEach(() => {
		repo = new InMemoryAlertNotificationRepository()
	})

	it("marks the notification as read now", async () => {
		repo.notifications = [notification({ id: "n1" }), notification({ id: "n2" })]

		await new MarkAlertNotificationReadUseCase(repo, () => now).execute({ id: "n1" })

		expect(repo.notifications.map((n) => n.read_at)).toEqual([now, null])
	})

	it("keeps the original read date of a notification already read", async () => {
		const readAt = new Date("2026-09-13T08:00:00Z")
		repo.notifications = [notification({ id: "n1", read_at: readAt })]

		await new MarkAlertNotificationReadUseCase(repo, () => now).execute({ id: "n1" })

		expect(repo.notifications[0].read_at).toEqual(readAt)
	})

	it("throws when the notification does not exist", async () => {
		await expect(
			new MarkAlertNotificationReadUseCase(repo, () => now).execute({ id: "missing" }),
		).rejects.toBeInstanceOf(AlertNotificationNotFoundError)
	})
})

describe("MarkAllAlertNotificationsReadUseCase", () => {
	it("marks every unread notification as read and leaves read ones untouched", async () => {
		const repo = new InMemoryAlertNotificationRepository()
		const now = new Date("2026-09-14T12:00:00Z")
		const readAt = new Date("2026-09-13T08:00:00Z")
		repo.notifications = [
			notification({ id: "n1" }),
			notification({ id: "n2", read_at: readAt }),
			notification({ id: "n3" }),
		]

		const result = await new MarkAllAlertNotificationsReadUseCase(repo, () => now).execute()

		expect(result).toEqual({ updated: 2 })
		expect(repo.notifications.map((n) => n.read_at)).toEqual([now, readAt, now])
	})
})
