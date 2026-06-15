import type { FastifyInstance } from "fastify"
import request from "supertest"
import { auth } from "../../../auth.js"

interface CreateAndAuthenticateUserReply {
	cookie: string[]
}

export async function createAndAuthenticateUser(
	app: FastifyInstance,
	email = "admin@example.com",
	password = "admin123",
	name = "Admin",
): Promise<CreateAndAuthenticateUserReply> {
	await auth.api.signUpEmail({
		body: {
			email,
			password,
			name,
		},
	})

	const signInResponse = await request(app.server)
		.post("/api/auth/sign-in/email")
		.send({
			email,
			password,
		})

	const rawCookie = signInResponse.headers["set-cookie"]
	const cookie = Array.isArray(rawCookie)
		? rawCookie
		: ([rawCookie].filter(Boolean) as string[])

	if (cookie.length === 0) {
		throw new Error("Failed to authenticate user: no session cookie returned")
	}

	return { cookie }
}
