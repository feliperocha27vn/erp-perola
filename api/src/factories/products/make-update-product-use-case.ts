import { DrizzleBrandRepository } from "../../repositories/drizzle/drizzle-brand-repository.js"
import { DrizzleProductRepository } from "../../repositories/drizzle/drizzle-product-repository.js"
import { UpdateProductUseCase } from "../../use-cases/products/update-product.js"

export function makeUpdateProductUseCase() {
	const productRepository = new DrizzleProductRepository()
	const brandRepository = new DrizzleBrandRepository()
	const updateProductUseCase = new UpdateProductUseCase(
		productRepository,
		brandRepository,
	)

	return updateProductUseCase
}
