import { DrizzleShipmentRepository } from "../../repositories/drizzle/drizzle-shipment-repository.js"
import { DeleteShipmentUseCase } from "../../use-cases/shipments/delete-shipment.js"

export function makeDeleteShipmentUseCase() {
	return new DeleteShipmentUseCase(new DrizzleShipmentRepository())
}
