import type {
	FetchProductsRequest,
	ProductRepository,
} from "../../repositories/product-repository.js"

export class FetchProductsSalesVelocityUseCase {
	constructor(private productRepository: ProductRepository) {}

	async execute(request: FetchProductsRequest) {
		const items = await this.productRepository.fetchSalesVelocity(request)
		return { items }
	}
}
