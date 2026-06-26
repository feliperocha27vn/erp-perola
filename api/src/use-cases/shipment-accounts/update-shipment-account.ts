import { ShipmentAccountNameAlreadyExistsError } from "../../errors/shipment-account-name-already-exists-error.js"
import { ShipmentAccountNotFoundError } from "../../errors/shipment-account-not-found-error.js"
import type { ShipmentAccountRepository } from "../../repositories/shipment-account-repository.js"

interface UpdateShipmentAccountUseCaseRequest {
	id: string
	name: string
}

export class UpdateShipmentAccountUseCase {
	constructor(private repo: ShipmentAccountRepository) {}

	async execute({ id, name }: UpdateShipmentAccountUseCaseRequest) {
		const existing = await this.repo.getById(id)
		if (!existing) throw new ShipmentAccountNotFoundError()

		if (name !== existing.name) {
			const byName = await this.repo.getByName(name)
			if (byName) throw new ShipmentAccountNameAlreadyExistsError()
		}

		const account = await this.repo.update(id, { name })
		return { account: account! }
	}
}
