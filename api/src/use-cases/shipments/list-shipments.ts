import type { ShipmentRepository } from "../../repositories/shipment-repository.js"

export class ListShipmentsUseCase {
	constructor(private shipmentRepo: ShipmentRepository) {}

	async execute() {
		const shipments = await this.shipmentRepo.list()
		return { shipments }
	}
}
