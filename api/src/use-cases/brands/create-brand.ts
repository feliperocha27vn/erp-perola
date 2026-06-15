import { BrandNameAlreadyExistsError } from "../../errors/brand-name-already-exists-error.js"
import type { BrandRepository } from "../../repositories/brand-repository.js"

interface CreateBrandUseCaseRequest {
	name: string
}

interface CreateBrandUseCaseResponse {
	brand: {
		id: string
		name: string
		created_at: Date
		updated_at: Date
	}
}

export class CreateBrandUseCase {
	constructor(private brandRepository: BrandRepository) {}

	async execute({
		name,
	}: CreateBrandUseCaseRequest): Promise<CreateBrandUseCaseResponse> {
		const existingBrand = await this.brandRepository.getByName(name)

		if (existingBrand) {
			throw new BrandNameAlreadyExistsError()
		}

		const brand = await this.brandRepository.create({ name })

		return { brand }
	}
}
