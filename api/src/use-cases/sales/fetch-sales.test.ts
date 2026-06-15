import { beforeEach, describe, expect, it } from "vitest"
import { InMemorySaleRepository } from "../../repositories/in-memory/in-memory-sale-repository.js"
import { FetchSalesUseCase } from "./fetch-sales.js"

function makeSale(
	overrides: Partial<{
		id: string
		product_id: string
		stock_id: string
		store_id: string | null
		quantity: number
		sale_price: number
		total_price: number
		channel: "Amazon" | "Mercado Livre" | "Shopee" | "Direto"
		sale_date: Date
		product_brand_id: string | null
	}> = {},
) {
	const now = new Date()
	const id = overrides.id ?? crypto.randomUUID()
	const product_id = overrides.product_id ?? crypto.randomUUID()
	const stock_id = overrides.stock_id ?? crypto.randomUUID()

	return {
		id,
		product_id,
		stock_id,
		store_id: overrides.store_id ?? null,
		quantity: overrides.quantity ?? 1,
		sale_price: overrides.sale_price ?? 100,
		total_price: overrides.total_price ?? 100,
		channel: overrides.channel ?? ("Amazon" as const),
		sale_date: overrides.sale_date ?? now,
		created_at: now,
		updated_at: now,
		product: {
			id: product_id,
			sku: "SKU-001",
			ean: "EAN-001",
			brand_id: overrides.product_brand_id ?? null,
			url_image: null,
			created_at: now,
			updated_at: now,
		},
		stock: {
			id: stock_id,
			product_id,
			title: "Stock",
			qtde: 10,
			full: true,
			created_at: now,
			updated_at: now,
		},
		store: null,
	}
}

describe("FetchSalesUseCase", () => {
	let saleRepository: InMemorySaleRepository
	let sut: FetchSalesUseCase

	beforeEach(() => {
		saleRepository = new InMemorySaleRepository()
		sut = new FetchSalesUseCase(saleRepository)
	})

	it("should return paginated sales", async () => {
		saleRepository.sales = [makeSale(), makeSale(), makeSale()]

		const result = await sut.execute({ page: 1, limit: 2 })

		expect(result.items).toHaveLength(2)
		expect(result.totalCount).toBe(3)
		expect(result.totalPages).toBe(2)
		expect(result.currentPage).toBe(1)
	})

	it("should calculate offset based on page", async () => {
		saleRepository.sales = [
			makeSale({ id: "sale-1" }),
			makeSale({ id: "sale-2" }),
			makeSale({ id: "sale-3" }),
		]

		const result = await sut.execute({ page: 2, limit: 2 })

		expect(result.items).toHaveLength(1)
		expect(result.items[0].id).toBe("sale-3")
		expect(result.totalPages).toBe(2)
		expect(result.currentPage).toBe(2)
	})

	it("should return at least one page when there are no sales", async () => {
		const result = await sut.execute({ page: 1, limit: 10 })

		expect(result.items).toHaveLength(0)
		expect(result.totalCount).toBe(0)
		expect(result.totalPages).toBe(1)
		expect(result.currentPage).toBe(1)
	})

	it("should pass filters to repository", async () => {
		const brandId = crypto.randomUUID()
		const storeId = crypto.randomUUID()
		const startDate = new Date("2024-01-01")
		const endDate = new Date("2024-01-31")

		saleRepository.sales = [
			makeSale({
				product_brand_id: brandId,
				store_id: storeId,
				sale_date: new Date("2024-01-15"),
			}),
			makeSale({ sale_date: new Date("2024-02-15") }),
		]

		const result = await sut.execute({
			brandId,
			storeId,
			startDate,
			endDate,
			page: 1,
			limit: 10,
		})

		expect(result.items).toHaveLength(1)
		expect(result.totalCount).toBe(1)
	})
})
