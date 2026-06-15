import request from "supertest"
import { beforeEach, describe, expect, it } from "vitest"
import { makeTestApp } from "./utils/build-app.js"
import { cleanDatabase } from "./utils/clean-database.js"
import { createAndAuthenticateUser } from "./utils/create-and-authenticate-user.js"

describe("Brands (e2e)", () => {
	beforeEach(async () => {
		await cleanDatabase()
	})

	it("should create a brand when authenticated", async () => {
		const app = await makeTestApp()
		const { cookie } = await createAndAuthenticateUser(app)

		const response = await request(app.server)
			.post("/brands")
			.set("Cookie", cookie)
			.send({ name: "Rolex" })

		expect(response.status).toBe(201)
		expect(response.body.brand).toBeDefined()
		expect(response.body.brand.name).toBe("Rolex")
	})

	it("should reject brand creation without authentication", async () => {
		const app = await makeTestApp()

		const response = await request(app.server)
			.post("/brands")
			.send({ name: "Rolex" })

		expect(response.status).toBe(401)
	})

	it("should list brands when authenticated", async () => {
		const app = await makeTestApp()
		const { cookie } = await createAndAuthenticateUser(app)

		await request(app.server)
			.post("/brands")
			.set("Cookie", cookie)
			.send({ name: "Rolex" })

		const response = await request(app.server)
			.get("/brands")
			.set("Cookie", cookie)

		expect(response.status).toBe(200)
		expect(response.body.brands).toBeInstanceOf(Array)
		expect(response.body.brands).toHaveLength(1)
	})
})
