import { ShipmentAccountNotFoundError } from "../../errors/shipment-account-not-found-error.js"
import type { ShipmentAccountRepository } from "../../repositories/shipment-account-repository.js"

interface DeleteShipmentAccountUseCaseRequest {
	id: string
}

export class DeleteShipmentAccountUseCase {
	constructor(private repo: ShipmentAccountRepository) {}

	async execute({ id }: DeleteShipmentAccountUseCaseRequest) {
		const existing = await this.repo.getById(id)
		if (!existing) throw new ShipmentAccountNotFoundError()
		await this.repo.delete(id)
	}
}
