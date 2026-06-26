import { ShipmentAccountNotFoundError } from "../../errors/shipment-account-not-found-error.js"
import type { ShipmentAccountRepository } from "../../repositories/shipment-account-repository.js"
import type { ShipmentItemInput, ShipmentRepository } from "../../repositories/shipment-repository.js"

interface CreateShipmentUseCaseRequest {
	account_id: string
	date: Date
	notes: string | null
	items: ShipmentItemInput[]
}

export class CreateShipmentUseCase {
	constructor(
		private accountRepo: ShipmentAccountRepository,
		private shipmentRepo: ShipmentRepository,
	) {}

	async execute(data: CreateShipmentUseCaseRequest) {
		const account = await this.accountRepo.getById(data.account_id)
		if (!account) throw new ShipmentAccountNotFoundError()

		const shipment = await this.shipmentRepo.create(data)
		return { shipment }
	}
}
