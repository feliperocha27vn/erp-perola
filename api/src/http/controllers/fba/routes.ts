import type { FastifyInstance } from "fastify"
import { analyzeFbaCsv } from "./analyze-fba-csv.js"

export async function fbaRoutes(app: FastifyInstance) {
	app.register(analyzeFbaCsv)
}
