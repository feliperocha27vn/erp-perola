import type { FastifyInstance } from "fastify"
import { fetchStockReport } from "./fetch-stock-report.js"

export async function reportsRoutes(app: FastifyInstance) {
	app.register(fetchStockReport)
}
