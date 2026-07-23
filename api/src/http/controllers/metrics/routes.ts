import type { FastifyInstance } from "fastify"
import { fetchCurrentMonthSales } from "./fetch-current-month-sales.js"
import { fetchLast15DaysSales } from "./fetch-last-15-days-sales.js"
import { fetchLastMonthSales } from "./fetch-last-month-sales.js"

export async function dashboardRoutes(app: FastifyInstance) {
	app.register(fetchLast15DaysSales)
	app.register(fetchLastMonthSales)
	app.register(fetchCurrentMonthSales)
}
