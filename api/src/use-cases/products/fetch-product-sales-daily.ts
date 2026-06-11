import type { ProductRepository } from "../../repositories/product-repository.js"

export class FetchProductSalesDailyUseCase {
	constructor(private productRepository: ProductRepository) {}

	async execute(productId: string) {
		const stores = await this.productRepository.fetchProductSalesDaily(productId)
		return { stores }
	}
}
