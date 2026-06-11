import type { BrandRepository } from "../../repositories/brand-repository.js"

interface FetchAllBrandsUseCaseResponse {
	brands: {
		id: string
		name: string
		created_at: Date
		updated_at: Date
	}[]
}

export class FetchAllBrandsUseCase {
	constructor(private brandRepository: BrandRepository) {}

	async execute(): Promise<FetchAllBrandsUseCaseResponse> {
		const brands = await this.brandRepository.findAll()
		return { brands }
	}
}
