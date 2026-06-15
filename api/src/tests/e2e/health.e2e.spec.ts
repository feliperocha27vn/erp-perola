import request from "supertest"
import { describe, expect, it } from "vitest"
import { makeTestApp } from "./utils/build-app.js"

describe("Health check (e2e)", () => {
	it("should return ok status", async () => {
		const app = await makeTestApp()

		const response = await request(app.server).get("/health")

		expect(response.status).toBe(200)
		expect(response.body.status).toBe("ok")
	})
})
