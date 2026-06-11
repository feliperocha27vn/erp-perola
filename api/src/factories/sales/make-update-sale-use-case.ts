import { DrizzleSaleRepository } from "../../repositories/drizzle/drizzle-sale-repository.js"
import { UpdateSaleUseCase } from "../../use-cases/sales/update-sale.js"

export function makeUpdateSaleUseCase() {
	const saleRepository = new DrizzleSaleRepository()
	const updateSaleUseCase = new UpdateSaleUseCase(saleRepository)

	return updateSaleUseCase
}
