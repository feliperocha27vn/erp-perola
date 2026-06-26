import { ShipmentAlreadyConfirmedError } from "../../errors/shipment-already-confirmed-error.js"
import { ShipmentNotFoundError } from "../../errors/shipment-not-found-error.js"
import type { ShipmentRepository } from "../../repositories/shipment-repository.js"

interface DeleteShipmentUseCaseRequest {
	shipmentId: string
}

export class DeleteShipmentUseCase {
	constructor(private shipmentRepo: ShipmentRepository) {}

	async execute({ shipmentId }: DeleteShipmentUseCaseRequest) {
		const existing = await this.shipmentRepo.getById(shipmentId)
		if (!existing) throw new ShipmentNotFoundError()
		if (existing.status === "confirmado") throw new ShipmentAlreadyConfirmedError()
		await this.shipmentRepo.delete(shipmentId)
	}
}
