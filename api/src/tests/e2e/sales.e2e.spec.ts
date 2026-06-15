import request from "supertest"
import { beforeEach, describe, expect, it } from "vitest"
import { makeTestApp } from "./utils/build-app.js"
import { cleanDatabase } from "./utils/clean-database.js"
import { createAndAuthenticateUser } from "./utils/create-and-authenticate-user.js"

describe("Sales (e2e)", () => {
	beforeEach(async () => {
		await cleanDatabase()
	})

	it("should create and list a sale when authenticated", async () => {
		const app = await makeTestApp()
		const { cookie } = await createAndAuthenticateUser(app)

		const brandResponse = await request(app.server)
			.post("/brands")
			.set("Cookie", cookie)
			.send({ name: "Rolex" })
		const brandId = brandResponse.body.brand.id

		const productResponse = await request(app.server)
			.post("/products")
			.set("Cookie", cookie)
			.send({
				sku: "SKU-001",
				ean: "EAN-001",
				brand_id: brandId,
			})
		const productId = productResponse.body.product.id

		const stockResponse = await request(app.server)
			.post(`/products/${productId}/stocks`)
			.set("Cookie", cookie)
			.send({
				title: "Estoque principal",
				qtde: 10,
				full: true,
			})
		const stockId = stockResponse.body.stock.id

		const saleResponse = await request(app.server)
			.post("/sales")
			.set("Cookie", cookie)
			.send({
				product_id: productId,
				stock_id: stockId,
				quantity: 2,
				sale_price: 10000,
				channel: "Amazon",
				sale_date: "2024-01-15",
			})

		expect(saleResponse.status).toBe(201)
		expect(saleResponse.body.sale).toBeDefined()
		expect(saleResponse.body.sale.quantity).toBe(2)

		const listResponse = await request(app.server)
			.get("/sales")
			.set("Cookie", cookie)

		expect(listResponse.status).toBe(200)
		expect(listResponse.body.items).toBeInstanceOf(Array)
		expect(listResponse.body.items).toHaveLength(1)
	})

	it("should reject sale creation without authentication", async () => {
		const app = await makeTestApp()

		const response = await request(app.server).post("/sales").send({
			product_id: crypto.randomUUID(),
			stock_id: crypto.randomUUID(),
			quantity: 1,
			sale_price: 10000,
			channel: "Amazon",
			sale_date: "2024-01-15",
		})

		expect(response.status).toBe(401)
	})
})
