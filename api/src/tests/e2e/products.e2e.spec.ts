import request from "supertest"
import { beforeEach, describe, expect, it } from "vitest"
import { makeTestApp } from "./utils/build-app.js"
import { cleanDatabase } from "./utils/clean-database.js"
import { createAndAuthenticateUser } from "./utils/create-and-authenticate-user.js"

describe("Products (e2e)", () => {
	beforeEach(async () => {
		await cleanDatabase()
	})

	it("should create and list a product when authenticated", async () => {
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

		expect(productResponse.status).toBe(201)
		expect(productResponse.body.product).toBeDefined()
		expect(productResponse.body.product.sku).toBe("SKU-001")

		const listResponse = await request(app.server)
			.get("/products")
			.set("Cookie", cookie)

		expect(listResponse.status).toBe(200)
		expect(listResponse.body.items).toBeInstanceOf(Array)
		expect(listResponse.body.items).toHaveLength(1)
	})

	it("should reject product creation without authentication", async () => {
		const app = await makeTestApp()

		const response = await request(app.server).post("/products").send({
			sku: "SKU-001",
			ean: "EAN-001",
			brand_id: crypto.randomUUID(),
		})

		expect(response.status).toBe(401)
	})
})
