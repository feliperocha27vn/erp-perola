import { DrizzleProductRepository } from "../../repositories/drizzle/drizzle-product-repository.js"
import { UpdateProductImageUseCase } from "../../use-cases/products/update-product-image.js"

export function makeUpdateProductImageUseCase() {
	const productRepository = new DrizzleProductRepository()
	const updateProductImageUseCase = new UpdateProductImageUseCase(
		productRepository,
	)

	return updateProductImageUseCase
}
