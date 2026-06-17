import { describe, expect, it } from "vitest"
import type {
	StockReportRepository,
	StockReportRow,
} from "../../repositories/report-repository.js"
import { FetchStockReportUseCase } from "./fetch-stock-report.js"

class FakeReportRepository implements StockReportRepository {
	constructor(private rows: (StockReportRow & { brandId: string | null })[]) {}

	async fetchStockReport(brandId: string | null): Promise<StockReportRow[]> {
		return this.rows
			.filter((row) => row.brandId === brandId)
			.map(({ productId, sku, stocks, total }) => ({
				productId,
				sku,
				stocks,
				total,
			}))
	}
}

describe("FetchStockReportUseCase", () => {
	it("returns products with stocks for the given brandId", async () => {
		const repo = new FakeReportRepository([
			{
				brandId: "brand-1",
				productId: "p-1",
				sku: "REL-001",
				stocks: [
					{ id: "s-1", title: "Galpão", qtde: 10 },
					{ id: "s-2", title: "Loja", qtde: 3 },
				],
				total: 13,
			},
			{
				brandId: "brand-2",
				productId: "p-2",
				sku: "REL-002",
				stocks: [{ id: "s-3", title: "Galpão", qtde: 5 }],
				total: 5,
			},
		])

		const useCase = new FetchStockReportUseCase(repo)
		const { products } = await useCase.execute({ brandId: "brand-1" })

		expect(products).toHaveLength(1)
		expect(products[0].sku).toBe("REL-001")
		expect(products[0].stocks).toHaveLength(2)
		expect(products[0].total).toBe(13)
	})

	it("returns empty array when brand has no products", async () => {
		const repo = new FakeReportRepository([])

		const useCase = new FetchStockReportUseCase(repo)
		const { products } = await useCase.execute({ brandId: "brand-x" })

		expect(products).toHaveLength(0)
	})

	it("includes products with no stocks (total = 0, stocks = [])", async () => {
		const repo = new FakeReportRepository([
			{
				brandId: "brand-1",
				productId: "p-1",
				sku: "REL-001",
				stocks: [],
				total: 0,
			},
		])

		const useCase = new FetchStockReportUseCase(repo)
		const { products } = await useCase.execute({ brandId: "brand-1" })

		expect(products).toHaveLength(1)
		expect(products[0].stocks).toHaveLength(0)
		expect(products[0].total).toBe(0)
	})

	it("returns products with no brand when brandId is null", async () => {
		const repo = new FakeReportRepository([
			{
				brandId: null,
				productId: "p-1",
				sku: "REL-SEM-MARCA",
				stocks: [{ id: "s-1", title: "Galpão", qtde: 7 }],
				total: 7,
			},
			{
				brandId: "brand-1",
				productId: "p-2",
				sku: "REL-COM-MARCA",
				stocks: [],
				total: 0,
			},
		])

		const useCase = new FetchStockReportUseCase(repo)
		const { products } = await useCase.execute({ brandId: null })

		expect(products).toHaveLength(1)
		expect(products[0].sku).toBe("REL-SEM-MARCA")
	})
})
