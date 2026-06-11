import type { FastifyInstance } from "fastify"
import { fromNodeHeaders } from "better-auth/node"
import { auth } from "../../../auth.js"

const PUBLIC_AUTH_PATHS = new Set(["/api/auth/sign-in/email", "/api/auth/sign-up/email", "/api/auth/session"])

export async function authRoutes(app: FastifyInstance) {
	app.all("/api/auth/*", async (request, reply) => {
		const url = new URL(request.url, `http://${request.headers.host}`)

		const headers = fromNodeHeaders(request.headers)

		const req = new Request(url.toString(), {
			method: request.method,
			headers,
		})

		const response = await auth.handler(req)

		reply.status(response.status)
		response.headers.forEach((value, key) => reply.header(key, value))

		const body = response.body ? await response.text() : null
		return reply.send(body)
	})
}