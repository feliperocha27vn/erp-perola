import type { FastifyInstance } from "fastify"
import { createBrand } from "./create-brand.js"
import { deleteBrand } from "./delete-brand.js"
import { fetchAllBrands } from "./fetch-all-brands.js"
import { updateBrand } from "./update-brand.js"

export async function brandsRoutes(app: FastifyInstance) {
	app.register(createBrand)
	app.register(fetchAllBrands)
	app.register(updateBrand)
	app.register(deleteBrand)
}
