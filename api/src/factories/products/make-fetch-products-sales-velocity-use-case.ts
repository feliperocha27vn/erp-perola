import { DrizzleProductRepository } from "../../repositories/drizzle/drizzle-product-repository.js"
import { FetchProductsSalesVelocityUseCase } from "../../use-cases/products/fetch-products-sales-velocity.js"

export function makeFetchProductsSalesVelocityUseCase() {
	const productRepository = new DrizzleProductRepository()
	return new FetchProductsSalesVelocityUseCase(productRepository)
}
