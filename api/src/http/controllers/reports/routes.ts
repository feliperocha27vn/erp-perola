import type { FastifyInstance } from "fastify"
import { analyzeFullReplenishmentSuggestion } from "./analyze-full-replenishment-suggestion.js"
import { fetchAbcReport } from "./fetch-abc-report.js"
import { fetchFullReplenishmentAlerts } from "./fetch-full-replenishment-alerts.js"
import { fetchRestockAlerts } from "./fetch-restock-alerts.js"
import { fetchSalesReport } from "./fetch-sales-report.js"
import { fetchStockReport } from "./fetch-stock-report.js"

export async function reportsRoutes(app: FastifyInstance) {
	app.register(fetchStockReport)
	app.register(fetchSalesReport)
	app.register(fetchAbcReport)
	app.register(fetchRestockAlerts)
	app.register(fetchFullReplenishmentAlerts)
	app.register(analyzeFullReplenishmentSuggestion)
}
