import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "./db/connection.js"
import * as schema from "./db/schema.js"
import { env } from "./env.js"

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema,
	}),
	emailAndPassword: {
		enabled: true,
	},
	session: {
		expiresIn: 604800,
		updateAge: 86400,
		cookieCache: {
			enabled: true,
			maxAge: 300,
		},
	},
	trustedOrigins: env.CORS_ORIGINS
		? env.CORS_ORIGINS.split(",").map((o) => o.trim())
		: ["http://localhost:5173"],
})

export type Auth = typeof auth