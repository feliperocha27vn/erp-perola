import type { FastifyInstance } from "fastify"
import { fetchMonthlySales } from "./fetch-monthly-sales.js"
import { fetchLastMonthSales } from "./fetch-last-month-sales.js"

export async function metricsRoutes(app: FastifyInstance) {
	app.register(fetchMonthlySales)
	app.register(fetchLastMonthSales)
}
