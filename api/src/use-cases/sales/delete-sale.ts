import { SaleNotFoundError } from "../../errors/sale-not-found-error.js"
import type { SaleRepository } from "../../repositories/sale-repository.js"

interface DeleteSaleUseCaseRequest {
	id: string
}

export class DeleteSaleUseCase {
	constructor(private saleRepository: SaleRepository) {}

	async execute({ id }: DeleteSaleUseCaseRequest): Promise<void> {
		const sale = await this.saleRepository.getById(id)

		if (!sale) {
			throw new SaleNotFoundError()
		}

		await this.saleRepository.deleteInTransaction(id)
	}
}
