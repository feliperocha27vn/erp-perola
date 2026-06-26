import type { ShipmentAccountRepository } from "../../repositories/shipment-account-repository.js"

export class ListShipmentAccountsUseCase {
	constructor(private repo: ShipmentAccountRepository) {}

	async execute() {
		const accounts = await this.repo.list()
		return { accounts }
	}
}
