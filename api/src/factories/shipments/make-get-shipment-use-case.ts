import { DrizzleShipmentRepository } from "../../repositories/drizzle/drizzle-shipment-repository.js"
import { GetShipmentUseCase } from "../../use-cases/shipments/get-shipment.js"

export function makeGetShipmentUseCase() {
	return new GetShipmentUseCase(new DrizzleShipmentRepository())
}
