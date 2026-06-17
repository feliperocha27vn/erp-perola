import type { FastifyInstance } from "fastify"
import { createProduct } from "./create-product.js"
import { deleteProduct } from "./delete-product.js"
import { fetchAllProducts } from "./fetch-all-products.js"
import { fetchProductSalesDaily } from "./fetch-product-sales-daily.js"
import { fetchProductsSalesVelocity } from "./fetch-products-sales-velocity.js"
import { updateProduct } from "./update-product.js"
import { updateProductImage } from "./update-product-image.js"

export async function productsRoutes(app: FastifyInstance) {
	app.register(createProduct)
	app.register(deleteProduct)
	app.register(fetchAllProducts)
	app.register(fetchProductSalesDaily)
	app.register(fetchProductsSalesVelocity)
	app.register(updateProduct)
	app.register(updateProductImage)
}
