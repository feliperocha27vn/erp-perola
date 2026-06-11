import { BrandNameAlreadyExistsError } from "../../errors/brand-name-already-exists-error.js"
import { BrandNotFoundError } from "../../errors/brand-not-found-error.js"
import type { BrandRepository } from "../../repositories/brand-repository.js"

interface UpdateBrandUseCaseRequest {
	id: string
	name: string
}

interface UpdateBrandUseCaseResponse {
	brand: {
		id: string
		name: string
		created_at: Date
		updated_at: Date
	}
}

export class UpdateBrandUseCase {
	constructor(private brandRepository: BrandRepository) {}

	async execute({ id, name }: UpdateBrandUseCaseRequest): Promise<UpdateBrandUseCaseResponse> {
		const currentBrand = await this.brandRepository.getById(id)

		if (!currentBrand) {
			throw new BrandNotFoundError()
		}

		if (currentBrand.name !== name) {
			const existingBrand = await this.brandRepository.getByName(name)

			if (existingBrand && existingBrand.id !== id) {
				throw new BrandNameAlreadyExistsError()
			}
		}

		const brand = await this.brandRepository.update(id, { name })

		if (!brand) {
			throw new BrandNotFoundError()
		}

		return { brand }
	}
}
