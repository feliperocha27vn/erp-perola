import type { FastifyInstance } from "fastify"
import { createStock } from "./create-stock.js"
import { deleteStock } from "./delete-stock.js"
import { fetchStocksByProductId } from "./fetch-stocks-by-product-id.js"
import { updateStock } from "./update-stock.js"

export async function stocksRoutes(app: FastifyInstance) {
	app.register(createStock)
	app.register(fetchStocksByProductId)
	app.register(updateStock)
	app.register(deleteStock)
}
