import request from "supertest"
import { beforeEach, describe, expect, it } from "vitest"
import { makeTestApp } from "./utils/build-app.js"
import { cleanDatabase } from "./utils/clean-database.js"
import { createAndAuthenticateUser } from "./utils/create-and-authenticate-user.js"

describe("Stocks (e2e)", () => {
	beforeEach(async () => {
		await cleanDatabase()
	})

	it("should create and list stocks for a product when authenticated", async () => {
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

		const createResponse = await request(app.server)
			.post(`/products/${productId}/stocks`)
			.set("Cookie", cookie)
			.send({
				title: "Estoque principal",
				qtde: 10,
				full: true,
			})

		expect(createResponse.status).toBe(201)
		expect(createResponse.body.stock).toBeDefined()
		expect(createResponse.body.stock.title).toBe("Estoque principal")

		const listResponse = await request(app.server)
			.get(`/products/${productId}/stocks`)
			.set("Cookie", cookie)

		expect(listResponse.status).toBe(200)
		expect(listResponse.body.stocks).toBeInstanceOf(Array)
		expect(listResponse.body.stocks).toHaveLength(1)
	})

	it("should reject stock creation without authentication", async () => {
		const app = await makeTestApp()

		const response = await request(app.server)
			.post(`/products/${crypto.randomUUID()}/stocks`)
			.send({
				title: "Estoque principal",
				qtde: 10,
				full: true,
			})

		expect(response.status).toBe(401)
	})
})
