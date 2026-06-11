import { DrizzleBrandRepository } from "../../repositories/drizzle/drizzle-brand-repository.js"
import { UpdateBrandUseCase } from "../../use-cases/brands/update-brand.js"

export function makeUpdateBrandUseCase() {
	const brandRepository = new DrizzleBrandRepository()
	const updateBrandUseCase = new UpdateBrandUseCase(brandRepository)

	return updateBrandUseCase
}
