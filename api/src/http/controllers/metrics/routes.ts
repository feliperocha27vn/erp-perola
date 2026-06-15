import type { FastifyInstance } from "fastify"
import { fetchLastMonthSales } from "./fetch-last-month-sales.js"
import { fetchMonthlySales } from "./fetch-monthly-sales.js"

export async function dashboardRoutes(app: FastifyInstance) {
	app.register(fetchMonthlySales)
	app.register(fetchLastMonthSales)
}
