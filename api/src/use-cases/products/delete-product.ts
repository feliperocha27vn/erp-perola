import { ProductNotFoundError } from "../../errors/product-not-found-error.js"
import type { ProductRepository } from "../../repositories/product-repository.js"

interface DeleteProductUseCaseRequest {
	productId: string
}

export class DeleteProductUseCase {
	constructor(private productRepository: ProductRepository) {}

	async execute({ productId }: DeleteProductUseCaseRequest): Promise<void> {
		const deleted = await this.productRepository.delete(productId)

		if (!deleted) {
			throw new ProductNotFoundError()
		}
	}
}
