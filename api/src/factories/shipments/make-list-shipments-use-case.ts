import { DrizzleShipmentRepository } from "../../repositories/drizzle/drizzle-shipment-repository.js"
import { ListShipmentsUseCase } from "../../use-cases/shipments/list-shipments.js"

export function makeListShipmentsUseCase() {
	return new ListShipmentsUseCase(new DrizzleShipmentRepository())
}
