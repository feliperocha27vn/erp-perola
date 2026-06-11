import type { FastifyInstance } from "fastify"
import { fetchAllStores } from "./fetch-all-stores.js"

export async function storesRoutes(app: FastifyInstance) {
	app.register(fetchAllStores)
}
