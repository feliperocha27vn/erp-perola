import type { FastifyInstance } from "fastify"
import { fetchCurrentMonthSales } from "./fetch-current-month-sales.js"
import { fetchLastMonthSales } from "./fetch-last-month-sales.js"
import { fetchMonthlySalesPace } from "./fetch-monthly-sales-pace.js"

export async function dashboardRoutes(app: FastifyInstance) {
	app.register(fetchMonthlySalesPace)
	app.register(fetchLastMonthSales)
	app.register(fetchCurrentMonthSales)
}
