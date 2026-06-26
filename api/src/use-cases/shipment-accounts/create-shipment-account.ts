import { ShipmentAccountNameAlreadyExistsError } from "../../errors/shipment-account-name-already-exists-error.js"
import type { ShipmentAccountRepository } from "../../repositories/shipment-account-repository.js"

interface CreateShipmentAccountUseCaseRequest {
	name: string
}

export class CreateShipmentAccountUseCase {
	constructor(private repo: ShipmentAccountRepository) {}

	async execute({ name }: CreateShipmentAccountUseCaseRequest) {
		const existing = await this.repo.getByName(name)
		if (existing) throw new ShipmentAccountNameAlreadyExistsError()

		const account = await this.repo.create({ name })
		return { account }
	}
}
