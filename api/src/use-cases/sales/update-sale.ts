import { SaleNotFoundError } from "../../errors/sale-not-found-error.js"
import type { SaleChannel, SaleRepository } from "../../repositories/sale-repository.js"

interface UpdateSaleUseCaseRequest {
	id: string
	quantity?: number
	sale_price?: number
	channel?: SaleChannel
	sale_date?: Date
	store_id?: string | null
}

interface UpdateSaleUseCaseResponse {
	sale: NonNullable<Awaited<ReturnType<SaleRepository["updateInTransaction"]>>>
}

export class UpdateSaleUseCase {
	constructor(private saleRepository: SaleRepository) {}

	async execute({ id, quantity, sale_price, channel, sale_date, store_id }: UpdateSaleUseCaseRequest): Promise<UpdateSaleUseCaseResponse> {
		const currentSale = await this.saleRepository.getById(id)

		if (!currentSale) {
			throw new SaleNotFoundError()
		}

		const nextQuantity = quantity ?? currentSale.quantity
		const nextSalePrice = sale_price ?? currentSale.sale_price

		const sale = await this.saleRepository.updateInTransaction(id, {
			quantity,
			sale_price,
			total_price: nextQuantity * nextSalePrice,
			channel,
			sale_date,
			store_id,
		})

		if (!sale) {
			throw new SaleNotFoundError()
		}

		return { sale }
	}
}
