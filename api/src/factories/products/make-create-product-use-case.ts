import { DrizzleBrandRepository } from "../../repositories/drizzle/drizzle-brand-repository.js"
import { DrizzleProductRepository } from "../../repositories/drizzle/drizzle-product-repository.js"
import { CreateProductUseCase } from "../../use-cases/products/create-product.js"

export function makeCreateProductUseCase() {
	const productRepository = new DrizzleProductRepository()
	const brandRepository = new DrizzleBrandRepository()
	const createProductUseCase = new CreateProductUseCase(productRepository, brandRepository)

	return createProductUseCase
}
