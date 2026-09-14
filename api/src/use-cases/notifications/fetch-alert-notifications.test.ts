import { beforeEach, describe, expect, it } from "vitest"
import type { AlertNotification } from "../../repositories/alert-notification-repository.js"
import { InMemoryAlertNotificationRepository } from "../../repositories/in-memory/in-memory-alert-notification-repository.js"
import type { RestockAlertItem } from "../reports/fetch-restock-alerts.js"
import { EvaluateAlertNotificationsUseCase } from "./evaluate-alert-notifications.js"
import { FetchAlertNotificationsUseCase } from "./fetch-alert-notifications.js"

const DAY_MS = 24 * 60 * 60 * 1000

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

describe("FetchAlertNotificationsUseCase", () => {
	let restock: RestockAlertItem[]
	let repo: InMemoryAlertNotificationRepository
	let now: Date
	let sut: FetchAlertNotificationsUseCase

	beforeEach(() => {
		restock = []
		repo = new InMemoryAlertNotificationRepository()
		repo.baselineAt = new Date("2026-08-01T00:00:00Z")
		now = new Date("2026-09-14T12:00:00Z")

		const evaluate = new EvaluateAlertNotificationsUseCase(
			{ execute: async () => ({ items: restock }) },
			{ execute: async () => ({ alerts: [], idle: [], missing: [] }) },
			repo,
			() => now,
		)
		sut = new FetchAlertNotificationsUseCase(evaluate, repo, () => now)
	})

	it("evaluates before listing, so a transition shows up in the same request", async () => {
		restock = [
			{
				product_id: "p1",
				sku: "469WC2NH",
				brand_name: "ORIENT",
				physical_stock_qty: 3,
				units_15d: 4,
				units_30d: 8,
				coverage_percentage: 37.5,
				severity: "critico",
				reasons: [],
			},
		]

		const result = await sut.execute()

		expect(result.unread_count).toBe(1)
		expect(result.notifications).toHaveLength(1)
		expect(result.notifications[0]).toEqual(
			expect.objectContaining({ sku: "469WC2NH", transition: "entrou" }),
		)
	})

	it("shows unread notifications of any age and read ones from the last 30 days, newest first", async () => {
		repo.notifications = [
			notification({ id: "old-unread", created_at: new Date(now.getTime() - 60 * DAY_MS) }),
			notification({
				id: "recent-read",
				created_at: new Date(now.getTime() - 2 * DAY_MS),
				read_at: new Date(now.getTime() - DAY_MS),
			}),
			notification({ id: "newest-unread", created_at: new Date(now.getTime() - DAY_MS) }),
		]

		const result = await sut.execute()

		expect(result.notifications.map((n) => n.id)).toEqual([
			"newest-unread",
			"recent-read",
			"old-unread",
		])
		expect(result.unread_count).toBe(2)
	})
})
