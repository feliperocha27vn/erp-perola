import { BrandInUseError } from "../../errors/brand-in-use-error.js"
import { BrandNotFoundError } from "../../errors/brand-not-found-error.js"
import type { BrandRepository } from "../../repositories/brand-repository.js"
import type { ProductRepository } from "../../repositories/product-repository.js"

interface DeleteBrandUseCaseRequest {
	id: string
}

export class DeleteBrandUseCase {
	constructor(
		private brandRepository: BrandRepository,
		private productRepository: ProductRepository,
	) {}

	async execute({ id }: DeleteBrandUseCaseRequest): Promise<void> {
		const brand = await this.brandRepository.getById(id)

		if (!brand) {
			throw new BrandNotFoundError()
		}

		const productsCount = await this.productRepository.countByBrandId(id)

		if (productsCount > 0) {
			throw new BrandInUseError()
		}

		await this.brandRepository.delete(id)
	}
}
