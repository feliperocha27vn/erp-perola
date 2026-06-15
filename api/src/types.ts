import type { Auth } from "./auth.js"
import type { db } from "./db/connection.js"
import type { AnalyzeFbaCsvUseCase } from "./use-cases/fba/analyze-fba-csv.js"

declare module "fastify" {
	interface FastifyInstance {
		db: typeof db
		analyzeFbaCsvUseCase: AnalyzeFbaCsvUseCase
		auth: Auth
	}

	interface FastifyRequest {
		user?: {
			id: string
			name: string
			email: string
			emailVerified: boolean
			image: string | null
			createdAt: Date
			updatedAt: Date
		}
		session?: {
			id: string
			userId: string
			token: string
			expiresAt: Date
			ipAddress: string | null
			userAgent: string | null
			createdAt: Date
			updatedAt: Date
		}
	}
}
