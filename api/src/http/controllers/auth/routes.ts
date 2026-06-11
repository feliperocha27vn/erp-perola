import type { FastifyInstance } from "fastify"
import { fromNodeHeaders } from "better-auth/node"
import { auth } from "../../../auth.js"

export async function authRoutes(app: FastifyInstance) {
	app.all("/api/auth/*", async (request, reply) => {
		const url = new URL(request.url, `http://${request.headers.host}`)

		const headers = fromNodeHeaders(request.headers)

		const body = request.method !== "GET" && request.method !== "HEAD"
			? JSON.stringify(request.body)
			: undefined

		const req = new Request(url.toString(), {
			method: request.method,
			headers,
			body,
		})

		const response = await auth.handler(req)

		reply.status(response.status)
		response.headers.forEach((value, key) => reply.header(key, value))

		const responseBody = response.body ? await response.text() : null
		return reply.send(responseBody)
	})
}