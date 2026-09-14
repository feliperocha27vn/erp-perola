import { beforeEach, describe, expect, it } from "vitest"
import { InMemoryAlertNotificationRepository } from "../../repositories/in-memory/in-memory-alert-notification-repository.js"
import type {
	FullReplenishmentAlertItem,
	MissingFullListingItem,
} from "../reports/fetch-full-replenishment-alerts.js"
import type { RestockAlertItem } from "../reports/fetch-restock-alerts.js"
import { EvaluateAlertNotificationsUseCase } from "./evaluate-alert-notifications.js"

const DAY_MS = 24 * 60 * 60 * 1000

/** O que os dois relatorios dizem agora. Cada teste troca as listas entre avaliacoes. */
class FakeAlertReports {
	restock: RestockAlertItem[] = []
	full: FullReplenishmentAlertItem[] = []
	missing: MissingFullListingItem[] = []

	restockSource = {
		execute: async () => ({ items: this.restock }),
	}

	fullSource = {
		execute: async () => ({ alerts: this.full, idle: [], missing: this.missing }),
	}
}

function restockItem(overrides: Partial<RestockAlertItem> = {}): RestockAlertItem {
	return {
		product_id: "p1",
		sku: "469WC2NH",
		brand_name: "ORIENT",
		physical_stock_qty: 3,
		units_15d: 4,
		units_30d: 8,
		coverage_percentage: 37.5,
		severity: "critico",
		reasons: [],
		...overrides,
	}
}

function fullAlert(overrides: Partial<FullReplenishmentAlertItem> = {}): FullReplenishmentAlertItem {
	return {
		product_id: "p1",
		sku: "469WC2NH",
		brand_name: "ORIENT",
		stock_id: "stock-lilian",
		stock_title: "Lilian",
		store_id: "store-lilian",
		store_name: "Lilian",
		marketplace: "mercado_livre",
		available_qty: 2,
		in_transit_qty: 0,
		units_window: 30,
		demand_rate_per_day: 0.5,
		demand_source: "deposito",
		demand_trend: "estavel",
		account_units_long: 30,
		account_units_short: 5,
		days_of_autonomy: 4,
		rate_is_estimated: false,
		reorder_point_days: 14,
		severity: "critico",
		needed_quantity: 20,
		suggested_quantity: 10,
		sources: [],
		physical_total_qty: 10,
		physical_reserved_qty: 0,
		physical_committed_qty: 0,
		physical_available_qty: 10,
		shortfall_reason: null,
		...overrides,
	}
}

function missingListing(overrides: Partial<MissingFullListingItem> = {}): MissingFullListingItem {
	return {
		product_id: "p2",
		sku: "GW-9400",
		brand_name: "CASIO",
		store_id: "store-laurinda",
		store_name: "Laurinda",
		marketplace: "mercado_livre",
		account_units_long: 6,
		account_units_short: 1,
		demand_rate_per_day: 0.07,
		demand_trend: "estavel",
		target_quantity: 4,
		physical_available_qty: 5,
		suggested_stock_title: "Laurinda",
		...overrides,
	}
}

describe("EvaluateAlertNotificationsUseCase", () => {
	let reports: FakeAlertReports
	let repo: InMemoryAlertNotificationRepository
	let now: Date
	let sut: EvaluateAlertNotificationsUseCase

	beforeEach(() => {
		reports = new FakeAlertReports()
		repo = new InMemoryAlertNotificationRepository()
		now = new Date("2026-09-14T12:00:00Z")
		sut = new EvaluateAlertNotificationsUseCase(
			reports.restockSource,
			reports.fullSource,
			repo,
			() => now,
		)
	})

	/** Avalia com as listas vazias, para os testes comecarem depois da linha de base. */
	async function establishEmptyBaseline() {
		await sut.execute()
		now = new Date(now.getTime() + 60_000)
	}

	it("records the first evaluation as a silent baseline", async () => {
		reports.restock = [restockItem()]
		reports.full = [fullAlert()]

		const result = await sut.execute()

		expect(result).toEqual({ baseline: true, created: 0, resolved: 0 })
		expect(repo.notifications).toHaveLength(0)
		expect(repo.states.map((state) => state.subject_key).sort()).toEqual([
			"abastecimento_full:stock-lilian",
			"reposicao:p1",
		])

		await sut.execute()

		expect(repo.notifications).toHaveLength(0)
	})

	it("does not treat a baseline with nothing in alert as a missing baseline", async () => {
		await establishEmptyBaseline()
		reports.restock = [restockItem()]

		const result = await sut.execute()

		expect(result.baseline).toBe(false)
		expect(repo.notifications).toHaveLength(1)
	})

	it("notifies a Product entering the restock alert, freezing its figures", async () => {
		await establishEmptyBaseline()
		reports.restock = [restockItem({ physical_stock_qty: 3, units_30d: 8 })]

		await sut.execute()

		expect(repo.notifications).toEqual([
			expect.objectContaining({
				kind: "reposicao",
				subject_key: "reposicao:p1",
				transition: "entrou",
				severity: "critico",
				product_id: "p1",
				sku: "469WC2NH",
				physical_stock_qty: 3,
				units_30d: 8,
				days_of_autonomy: null,
				created_at: now,
				read_at: null,
				resolved_at: null,
			}),
		])
	})

	it("does not notify again while the subject stays in the same state", async () => {
		await establishEmptyBaseline()
		reports.restock = [restockItem()]

		await sut.execute()
		reports.restock = [restockItem({ physical_stock_qty: 1, units_30d: 10 })]
		await sut.execute()
		await sut.execute()

		expect(repo.notifications).toHaveLength(1)
		expect(repo.notifications[0].physical_stock_qty).toBe(3)
	})

	it("notifies an escalation from atencao to critico", async () => {
		await establishEmptyBaseline()
		reports.restock = [
			restockItem({ severity: "atencao", reasons: ["perto_do_limite"], physical_stock_qty: 10 }),
		]
		await sut.execute()

		reports.restock = [restockItem({ severity: "critico", physical_stock_qty: 6 })]
		await sut.execute()

		expect(repo.notifications.map((n) => [n.transition, n.severity])).toEqual([
			["entrou", "atencao"],
			["piorou", "critico"],
		])
	})

	it("records an improvement silently and notifies a later escalation again", async () => {
		await establishEmptyBaseline()
		reports.restock = [restockItem({ severity: "critico" })]
		await sut.execute()

		reports.restock = [restockItem({ severity: "atencao", reasons: ["perto_do_limite"] })]
		const improved = await sut.execute()

		expect(improved).toEqual({ baseline: false, created: 0, resolved: 0 })

		reports.restock = [restockItem({ severity: "critico" })]
		await sut.execute()

		expect(repo.notifications.map((n) => n.transition)).toEqual(["entrou", "piorou"])
		expect(repo.notifications.every((n) => n.resolved_at === null)).toBe(true)
	})

	it("notifies an escalation of a subject that was already in alert at the baseline", async () => {
		reports.restock = [restockItem({ severity: "atencao", reasons: ["perto_do_limite"] })]
		await sut.execute()

		reports.restock = [restockItem({ severity: "critico" })]
		await sut.execute()

		expect(repo.notifications.map((n) => n.transition)).toEqual(["piorou"])
	})

	it("resolves and marks as read every open notification of a subject that left", async () => {
		await establishEmptyBaseline()
		reports.restock = [restockItem({ severity: "atencao", reasons: ["perto_do_limite"] })]
		await sut.execute()

		const readAt = new Date(now.getTime() + 60_000)
		repo.notifications[0].read_at = readAt

		reports.restock = [restockItem({ severity: "critico" })]
		await sut.execute()

		now = new Date(now.getTime() + DAY_MS)
		reports.restock = []
		const result = await sut.execute()

		expect(result.resolved).toBe(2)
		expect(repo.notifications.map((n) => n.resolved_at)).toEqual([now, now])
		expect(repo.notifications.map((n) => n.read_at)).toEqual([readAt, now])
		expect(repo.states).toHaveLength(0)
	})

	it("notifies again when a subject re-enters after being resolved", async () => {
		await establishEmptyBaseline()
		reports.restock = [restockItem()]
		await sut.execute()
		reports.restock = []
		await sut.execute()
		reports.restock = [restockItem()]
		await sut.execute()

		expect(repo.notifications.map((n) => n.transition)).toEqual(["entrou", "entrou"])
		expect(repo.notifications[1].resolved_at).toBeNull()
	})

	it("ignores a restock alert flagged only as vendas_acelerando", async () => {
		await establishEmptyBaseline()
		reports.restock = [
			restockItem({ severity: "atencao", reasons: ["vendas_acelerando"], physical_stock_qty: 20, units_30d: 1 }),
		]

		await sut.execute()

		expect(repo.notifications).toHaveLength(0)
		expect(repo.states).toHaveLength(0)
	})

	it("counts gaining perto_do_limite as entering and falling back to vendas_acelerando alone as leaving", async () => {
		await establishEmptyBaseline()
		reports.restock = [restockItem({ severity: "atencao", reasons: ["vendas_acelerando"] })]
		await sut.execute()

		reports.restock = [
			restockItem({ severity: "atencao", reasons: ["perto_do_limite", "vendas_acelerando"] }),
		]
		await sut.execute()

		expect(repo.notifications.map((n) => n.transition)).toEqual(["entrou"])

		reports.restock = [restockItem({ severity: "atencao", reasons: ["vendas_acelerando"] })]
		await sut.execute()

		expect(repo.notifications[0].resolved_at).toEqual(now)
	})

	it("notifies full replenishment alerts at both severities, one subject per fulfillment center", async () => {
		await establishEmptyBaseline()
		reports.full = [
			fullAlert({ stock_id: "stock-lilian", stock_title: "Lilian", severity: "critico", days_of_autonomy: 4 }),
			fullAlert({
				stock_id: "stock-lilian-fba",
				stock_title: "Lilian FBA",
				marketplace: "amazon",
				severity: "atencao",
				days_of_autonomy: 20,
			}),
		]

		await sut.execute()

		expect(repo.notifications).toEqual([
			expect.objectContaining({
				kind: "abastecimento_full",
				subject_key: "abastecimento_full:stock-lilian",
				severity: "critico",
				stock_id: "stock-lilian",
				stock_title: "Lilian",
				store_name: "Lilian",
				marketplace: "mercado_livre",
				days_of_autonomy: 4,
				lead_time_days: 7,
				physical_stock_qty: null,
			}),
			expect.objectContaining({
				kind: "abastecimento_full",
				subject_key: "abastecimento_full:stock-lilian-fba",
				severity: "atencao",
				marketplace: "amazon",
				days_of_autonomy: 20,
				lead_time_days: 14,
			}),
		])
	})

	it("notifies a missing full listing on entering, with the account's channel demand", async () => {
		await establishEmptyBaseline()
		reports.missing = [missingListing({ account_units_long: 6 })]

		await sut.execute()

		expect(repo.notifications).toEqual([
			expect.objectContaining({
				kind: "fora_do_full",
				subject_key: "fora_do_full:p2:store-laurinda:mercado_livre",
				transition: "entrou",
				severity: null,
				store_id: "store-laurinda",
				store_name: "Laurinda",
				marketplace: "mercado_livre",
				account_units: 6,
				stock_id: null,
			}),
		])
	})

	it("resolves the missing listing and notifies the new pair once its full stock is created", async () => {
		await establishEmptyBaseline()
		reports.missing = [missingListing({ product_id: "p1", store_id: "store-lilian" })]
		await sut.execute()

		reports.missing = []
		reports.full = [fullAlert({ product_id: "p1", severity: "atencao" })]
		await sut.execute()

		expect(repo.notifications.map((n) => [n.kind, n.resolved_at === null])).toEqual([
			["fora_do_full", false],
			["abastecimento_full", true],
		])
	})

	it("deletes read notifications older than 30 days but keeps unread ones", async () => {
		await establishEmptyBaseline()
		const old = new Date(now.getTime() - 31 * DAY_MS)
		const base = {
			kind: "reposicao" as const,
			transition: "entrou" as const,
			severity: "critico" as const,
			product_id: "p9",
			sku: "OLD-1",
			stock_id: null,
			stock_title: null,
			store_id: null,
			store_name: null,
			marketplace: null,
			physical_stock_qty: 1,
			units_30d: 2,
			days_of_autonomy: null,
			lead_time_days: null,
			account_units: null,
			created_at: old,
			resolved_at: null,
		}
		repo.notifications.push(
			{ ...base, id: "old-read", subject_key: "reposicao:p9", read_at: old },
			{ ...base, id: "old-unread", subject_key: "reposicao:p8", read_at: null },
		)

		await sut.execute()

		expect(repo.notifications.map((n) => n.id)).toEqual(["old-unread"])
	})
})
