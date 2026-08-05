import { ShipmentNotEditableError } from "../../errors/shipment-not-editable-error.js"
import { ShipmentNotFoundError } from "../../errors/shipment-not-found-error.js"
import type { ShipmentItemInput, ShipmentRepository } from "../../repositories/shipment-repository.js"

interface UpdateShipmentUseCaseRequest {
	shipmentId: string
	account_id?: string
	date?: Date
	notes?: string | null
	items?: ShipmentItemInput[]
}

export class UpdateShipmentUseCase {
	constructor(private shipmentRepo: ShipmentRepository) {}

	async execute({ shipmentId, ...data }: UpdateShipmentUseCaseRequest) {
		const existing = await this.shipmentRepo.getById(shipmentId)
		if (!existing) throw new ShipmentNotFoundError()
		if (existing.status !== "rascunho") throw new ShipmentNotEditableError()

		const shipment = await this.shipmentRepo.update(shipmentId, data)
		return { shipment: shipment! }
	}
}
