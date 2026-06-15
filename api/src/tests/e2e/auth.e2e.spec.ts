import request from "supertest"
import { beforeEach, describe, expect, it } from "vitest"
import { makeTestApp } from "./utils/build-app.js"
import { cleanDatabase } from "./utils/clean-database.js"
import { createAndAuthenticateUser } from "./utils/create-and-authenticate-user.js"

describe("Authentication (e2e)", () => {
	beforeEach(async () => {
		await cleanDatabase()
	})

	it("should create a user and return a session cookie", async () => {
		const app = await makeTestApp()

		const { cookie } = await createAndAuthenticateUser(app)

		expect(cookie).toBeDefined()
		expect(cookie.length).toBeGreaterThan(0)
		expect(cookie[0]).toContain("better-auth.session_token")
	})

	it("should return a valid session when calling get-session with cookie", async () => {
		const app = await makeTestApp()
		const { cookie } = await createAndAuthenticateUser(app)

		const response = await request(app.server)
			.get("/api/auth/get-session")
			.set("Cookie", cookie)

		expect(response.status).toBe(200)
		expect(response.body.session).toBeDefined()
		expect(response.body.user).toBeDefined()
	})

	it("should reject unauthenticated requests to business routes", async () => {
		const app = await makeTestApp()

		const response = await request(app.server).get("/products")

		expect(response.status).toBe(401)
		expect(response.body.message).toContain("Sessão expirada ou inválida")
	})

	it("should reject unauthenticated requests even with dotted query strings", async () => {
		const app = await makeTestApp()

		const response = await request(app.server).get("/products?foo.bar=baz")

		expect(response.status).toBe(401)
	})

	it("should allow authenticated requests to business routes", async () => {
		const app = await makeTestApp()
		const { cookie } = await createAndAuthenticateUser(app)

		const response = await request(app.server)
			.get("/products")
			.set("Cookie", cookie)

		expect(response.status).toBe(200)
	})
})
