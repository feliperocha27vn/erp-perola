import { DrizzleProductRepository } from "../../repositories/drizzle/drizzle-product-repository.js"
import { FetchProductSalesDailyUseCase } from "../../use-cases/products/fetch-product-sales-daily.js"

export function makeFetchProductSalesDailyUseCase() {
	const productRepository = new DrizzleProductRepository()
	return new FetchProductSalesDailyUseCase(productRepository)
}
