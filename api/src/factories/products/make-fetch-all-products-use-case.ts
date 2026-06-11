import { DrizzleProductRepository } from "../../repositories/drizzle/drizzle-product-repository.js"
import { FetchAllProductsUseCase } from "../../use-cases/products/fetch-all-products.js"

export function makeFetchAllProductsUseCase() {
	const productRepository = new DrizzleProductRepository()
	const fetchAllProductsUseCase = new FetchAllProductsUseCase(productRepository)

	return fetchAllProductsUseCase
}
