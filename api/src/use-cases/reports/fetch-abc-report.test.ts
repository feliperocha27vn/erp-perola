import { describe, expect, it } from "vitest"
import type {
	AbcReportRawRow,
	AbcReportRepository,
	StockTotalRow,
	Units90dRow,
} from "../../repositories/report-repository.js"
import { FetchAbcReportUseCase } from "./fetch-abc-report.js"

class FakeAbcReportRepository implements AbcReportRepository {
	constructor(
		private rows: AbcReportRawRow[],
		private stockTotals: StockTotalRow[] = [],
		private units90d: Units90dRow[] = [],
	) {}

	async fetchAbcReport(): Promise<AbcReportRawRow[]> {
		return this.rows
	}

	async fetchStockTotals(): Promise<StockTotalRow[]> {
		return this.stockTotals
	}

	async fetchUnits90dByStore(): Promise<Units90dRow[]> {
		return this.units90d
	}
}

describe("FetchAbcReportUseCase — stock coverage", () => {
	it("computes coverage_percentage as stock_qty / units_90d * 100 for that store", async () => {
		const repo = new FakeAbcReportRepository(
			[{ store_name: "Lilian", sku: "REL-001", total_revenue: 1000, qty_sales: 5, qty_units: 5 }],
			[{ sku: "REL-001", stock_qty: 10 }],
			[{ store_name: "Lilian", sku: "REL-001", units_90d: 20 }],
		)

		const useCase = new FetchAbcReportUseCase(repo)
		const { stores } = await useCase.execute({ startDate: new Date(), endDate: new Date() })

		const item = stores[0].items[0]
		expect(item.stock_qty).toBe(10)
		expect(item.units_90d).toBe(20)
		expect(item.coverage_percentage).toBe(50)
		expect(item.needs_purchase).toBe(true)
	})

	it("does not flag needs_purchase when coverage is 100% or above", async () => {
		const repo = new FakeAbcReportRepository(
			[{ store_name: "Lilian", sku: "REL-001", total_revenue: 1000, qty_sales: 5, qty_units: 5 }],
			[{ sku: "REL-001", stock_qty: 20 }],
			[{ store_name: "Lilian", sku: "REL-001", units_90d: 20 }],
		)

		const useCase = new FetchAbcReportUseCase(repo)
		const { stores } = await useCase.execute({ startDate: new Date(), endDate: new Date() })

		const item = stores[0].items[0]
		expect(item.coverage_percentage).toBe(100)
		expect(item.needs_purchase).toBe(false)
	})

	it("returns null coverage_percentage and no alert when units_90d is zero", async () => {
		const repo = new FakeAbcReportRepository(
			[{ store_name: "Lilian", sku: "REL-001", total_revenue: 1000, qty_sales: 5, qty_units: 5 }],
			[{ sku: "REL-001", stock_qty: 10 }],
			[],
		)

		const useCase = new FetchAbcReportUseCase(repo)
		const { stores } = await useCase.execute({ startDate: new Date(), endDate: new Date() })

		const item = stores[0].items[0]
		expect(item.units_90d).toBe(0)
		expect(item.coverage_percentage).toBeNull()
		expect(item.needs_purchase).toBe(false)
	})

	it("repeats the same stock_qty across store blocks but varies units_90d per store", async () => {
		const repo = new FakeAbcReportRepository(
			[
				{ store_name: "Lilian", sku: "REL-001", total_revenue: 500, qty_sales: 2, qty_units: 2 },
				{ store_name: "Santo", sku: "REL-001", total_revenue: 500, qty_sales: 2, qty_units: 2 },
			],
			[{ sku: "REL-001", stock_qty: 10 }],
			[
				{ store_name: "Lilian", sku: "REL-001", units_90d: 5 },
				{ store_name: "Santo", sku: "REL-001", units_90d: 20 },
			],
		)

		const useCase = new FetchAbcReportUseCase(repo)
		const { stores } = await useCase.execute({ startDate: new Date(), endDate: new Date() })

		const lilian = stores.find((s) => s.store_name === "Lilian")!.items[0]
		const santo = stores.find((s) => s.store_name === "Santo")!.items[0]

		expect(lilian.stock_qty).toBe(10)
		expect(santo.stock_qty).toBe(10)
		expect(lilian.coverage_percentage).toBe(200)
		expect(santo.coverage_percentage).toBe(50)
		expect(lilian.needs_purchase).toBe(false)
		expect(santo.needs_purchase).toBe(true)
	})

	it("uses store_id null bucket ('Sem loja') to key units_90d lookup", async () => {
		const repo = new FakeAbcReportRepository(
			[{ store_name: null, sku: "REL-001", total_revenue: 500, qty_sales: 2, qty_units: 2 }],
			[{ sku: "REL-001", stock_qty: 4 }],
			[{ store_name: null, sku: "REL-001", units_90d: 8 }],
		)

		const useCase = new FetchAbcReportUseCase(repo)
		const { stores } = await useCase.execute({ startDate: new Date(), endDate: new Date() })

		expect(stores[0].store_name).toBe("Sem loja")
		expect(stores[0].items[0].coverage_percentage).toBe(50)
	})

	it("defaults stock_qty to 0 when the sku has no stock record", async () => {
		const repo = new FakeAbcReportRepository(
			[{ store_name: "Lilian", sku: "REL-001", total_revenue: 500, qty_sales: 2, qty_units: 2 }],
			[],
			[{ store_name: "Lilian", sku: "REL-001", units_90d: 8 }],
		)

		const useCase = new FetchAbcReportUseCase(repo)
		const { stores } = await useCase.execute({ startDate: new Date(), endDate: new Date() })

		const item = stores[0].items[0]
		expect(item.stock_qty).toBe(0)
		expect(item.coverage_percentage).toBe(0)
		expect(item.needs_purchase).toBe(true)
	})
})
