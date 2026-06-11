import type { db } from "./db/connection.js"
import type { AnalyzeFbaCsvUseCase } from "./use-cases/fba/analyze-fba-csv.js"

declare module "fastify" {
	interface FastifyInstance {
		db: typeof db
		analyzeFbaCsvUseCase: AnalyzeFbaCsvUseCase
	}
}
