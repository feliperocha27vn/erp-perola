declare module "fastify" {
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
