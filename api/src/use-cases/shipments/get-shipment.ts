import { ShipmentNotFoundError } from "../../errors/shipment-not-found-error.js"
import type { ShipmentRepository } from "../../repositories/shipment-repository.js"

interface GetShipmentUseCaseRequest {
	shipmentId: string
}

export class GetShipmentUseCase {
	constructor(private shipmentRepo: ShipmentRepository) {}

	async execute({ shipmentId }: GetShipmentUseCaseRequest) {
		const shipment = await this.shipmentRepo.getById(shipmentId)
		if (!shipment) throw new ShipmentNotFoundError()
		return { shipment }
	}
}
