import { DrizzleBrandRepository } from "../../repositories/drizzle/drizzle-brand-repository.js"
import { FetchAllBrandsUseCase } from "../../use-cases/brands/fetch-all-brands.js"

export function makeFetchAllBrandsUseCase() {
	const brandRepository = new DrizzleBrandRepository()
	const fetchAllBrandsUseCase = new FetchAllBrandsUseCase(brandRepository)

	return fetchAllBrandsUseCase
}
