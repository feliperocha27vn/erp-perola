import type { FastifyInstance } from "fastify"
import { createSale } from "./create-sale.js"
import { deleteSale } from "./delete-sale.js"
import { fetchSales } from "./fetch-sales.js"
import { updateSale } from "./update-sale.js"

export async function salesRoutes(app: FastifyInstance) {
	app.register(createSale)
	app.register(fetchSales)
	app.register(updateSale)
	app.register(deleteSale)
}
