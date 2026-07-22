import { describe, expect, it } from "vitest"
import type {
	RestockAlertProductRow,
	RestockAlertRepository,
	RestockAlertSalesRow,
} from "../../repositories/report-repository.js"
import { FetchRestockAlertsUseCase } from "./fetch-restock-alerts.js"

class FakeRestockAlertRepository implements RestockAlertRepository {
	constructor(
		private products: RestockAlertProductRow[],
		private sales: RestockAlertSalesRow[] = [],
	) {}

	async fetchRestockAlertProducts(): Promise<RestockAlertProductRow[]> {
		return this.products
	}

	async fetchRestockAlertSalesPace(): Promise<RestockAlertSalesRow[]> {
		return this.sales
	}
}

describe("FetchRestockAlertsUseCase", () => {
	it("flags critico when 30d sales exceed physical stock", async () => {
		const repo = new FakeRestockAlertRepository(
			[{ product_id: "p1", sku: "REL-001", brand_name: "ORIENT", physical_stock_qty: 5 }],
			[{ product_id: "p1", units_15d: 4, units_30d: 8 }],
		)

		const { items } = await new FetchRestockAlertsUseCase(repo).execute()

		expect(items).toHaveLength(1)
		expect(items[0].severity).toBe("critico")
		expect(items[0].reasons).toEqual([])
	})

	it("never flags a product with zero 30d sales, regardless of stock", async () => {
		const repo = new FakeRestockAlertRepository(
			[{ product_id: "p1", sku: "REL-001", brand_name: null, physical_stock_qty: 0 }],
			[],
		)

		const { items } = await new FetchRestockAlertsUseCase(repo).execute()

		expect(items).toHaveLength(0)
	})

	it("flags atencao with perto_do_limite when coverage is between 100% and 130%", async () => {
		const repo = new FakeRestockAlertRepository(
			[{ product_id: "p1", sku: "REL-001", brand_name: "ORIENT", physical_stock_qty: 12 }],
			[{ product_id: "p1", units_15d: 5, units_30d: 10 }],
		)

		const { items } = await new FetchRestockAlertsUseCase(repo).execute()

		expect(items).toHaveLength(1)
		expect(items[0].severity).toBe("atencao")
		expect(items[0].coverage_percentage).toBe(120)
		expect(items[0].reasons).toEqual(["perto_do_limite"])
	})

	it("flags atencao with vendas_acelerando when 15d pace projected exceeds 30d total, even with comfortable coverage", async () => {
		const repo = new FakeRestockAlertRepository(
			[{ product_id: "p1", sku: "REL-001", brand_name: "ORIENT", physical_stock_qty: 100 }],
			[{ product_id: "p1", units_15d: 9, units_30d: 10 }],
		)

		const { items } = await new FetchRestockAlertsUseCase(repo).execute()

		expect(items).toHaveLength(1)
		expect(items[0].severity).toBe("atencao")
		expect(items[0].reasons).toEqual(["vendas_acelerando"])
	})

	it("includes both reasons when both conditions match", async () => {
		const repo = new FakeRestockAlertRepository(
			[{ product_id: "p1", sku: "REL-001", brand_name: "ORIENT", physical_stock_qty: 12 }],
			[{ product_id: "p1", units_15d: 9, units_30d: 10 }],
		)

		const { items } = await new FetchRestockAlertsUseCase(repo).execute()

		expect(items[0].reasons).toEqual(["perto_do_limite", "vendas_acelerando"])
	})

	it("does not flag a product comfortably stocked with no acceleration", async () => {
		const repo = new FakeRestockAlertRepository(
			[{ product_id: "p1", sku: "REL-001", brand_name: "ORIENT", physical_stock_qty: 50 }],
			[{ product_id: "p1", units_15d: 3, units_30d: 10 }],
		)

		const { items } = await new FetchRestockAlertsUseCase(repo).execute()

		expect(items).toHaveLength(0)
	})

	it("sorts critico before atencao, then by coverage_percentage ascending", async () => {
		const repo = new FakeRestockAlertRepository(
			[
				{ product_id: "p1", sku: "REL-ATENCAO-HIGH", brand_name: null, physical_stock_qty: 13 },
				{ product_id: "p2", sku: "REL-CRITICO", brand_name: null, physical_stock_qty: 2 },
				{ product_id: "p3", sku: "REL-ATENCAO-LOW", brand_name: null, physical_stock_qty: 10 },
			],
			[
				{ product_id: "p1", units_15d: 0, units_30d: 10 },
				{ product_id: "p2", units_15d: 0, units_30d: 10 },
				{ product_id: "p3", units_15d: 0, units_30d: 10 },
			],
		)

		const { items } = await new FetchRestockAlertsUseCase(repo).execute()

		expect(items.map((i) => i.sku)).toEqual(["REL-CRITICO", "REL-ATENCAO-LOW", "REL-ATENCAO-HIGH"])
	})
})
