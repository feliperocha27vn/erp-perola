import { DrizzleShipmentRepository } from "../../repositories/drizzle/drizzle-shipment-repository.js"
import { UpdateShipmentUseCase } from "../../use-cases/shipments/update-shipment.js"

export function makeUpdateShipmentUseCase() {
	return new UpdateShipmentUseCase(new DrizzleShipmentRepository())
}
