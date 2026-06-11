import { DrizzleSaleRepository } from "../../repositories/drizzle/drizzle-sale-repository.js"
import { DeleteSaleUseCase } from "../../use-cases/sales/delete-sale.js"

export function makeDeleteSaleUseCase() {
	const saleRepository = new DrizzleSaleRepository()
	const deleteSaleUseCase = new DeleteSaleUseCase(saleRepository)

	return deleteSaleUseCase
}
