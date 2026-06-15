import { DrizzleProductRepository } from "../../repositories/drizzle/drizzle-product-repository.js"
import { DrizzleSaleRepository } from "../../repositories/drizzle/drizzle-sale-repository.js"
import { CreateSaleUseCase } from "../../use-cases/sales/create-sale.js"

export function makeCreateSaleUseCase() {
	const saleRepository = new DrizzleSaleRepository()
	const productRepository = new DrizzleProductRepository()
	const createSaleUseCase = new CreateSaleUseCase(
		saleRepository,
		productRepository,
	)

	return createSaleUseCase
}
