import type { FastifyInstance } from "fastify"
import { createStockEntry } from "./create-stock-entry.js"
import { fetchStockEntriesByProduct } from "./fetch-stock-entries-by-product.js"
import { fetchStockEntriesGlobal } from "./fetch-stock-entries-global.js"

export async function stockEntriesRoutes(app: FastifyInstance) {
	app.register(createStockEntry)
	app.register(fetchStockEntriesByProduct)
	app.register(fetchStockEntriesGlobal)
}
