import { DrizzleShipmentAccountRepository } from "../../repositories/drizzle/drizzle-shipment-account-repository.js"
import { DrizzleShipmentRepository } from "../../repositories/drizzle/drizzle-shipment-repository.js"
import { CreateShipmentUseCase } from "../../use-cases/shipments/create-shipment.js"

export function makeCreateShipmentUseCase() {
	return new CreateShipmentUseCase(
		new DrizzleShipmentAccountRepository(),
		new DrizzleShipmentRepository(),
	)
}
