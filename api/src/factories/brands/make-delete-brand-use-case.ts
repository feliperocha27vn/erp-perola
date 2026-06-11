import { DrizzleProductRepository } from "../../repositories/drizzle/drizzle-product-repository.js"
import { DrizzleBrandRepository } from "../../repositories/drizzle/drizzle-brand-repository.js"
import { DeleteBrandUseCase } from "../../use-cases/brands/delete-brand.js"

export function makeDeleteBrandUseCase() {
	const brandRepository = new DrizzleBrandRepository()
	const productRepository = new DrizzleProductRepository()
	const deleteBrandUseCase = new DeleteBrandUseCase(brandRepository, productRepository)

	return deleteBrandUseCase
}
