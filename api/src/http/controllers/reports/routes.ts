import type { FastifyInstance } from "fastify"
import { fetchSalesReport } from "./fetch-sales-report.js"
import { fetchStockReport } from "./fetch-stock-report.js"

export async function reportsRoutes(app: FastifyInstance) {
	app.register(fetchStockReport)
	app.register(fetchSalesReport)
}
