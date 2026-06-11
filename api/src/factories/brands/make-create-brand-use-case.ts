import { DrizzleBrandRepository } from "../../repositories/drizzle/drizzle-brand-repository.js"
import { CreateBrandUseCase } from "../../use-cases/brands/create-brand.js"

export function makeCreateBrandUseCase() {
	const brandRepository = new DrizzleBrandRepository()
	const createBrandUseCase = new CreateBrandUseCase(brandRepository)

	return createBrandUseCase
}
