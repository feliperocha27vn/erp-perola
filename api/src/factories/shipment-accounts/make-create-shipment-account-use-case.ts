import { DrizzleShipmentAccountRepository } from "../../repositories/drizzle/drizzle-shipment-account-repository.js"
import { CreateShipmentAccountUseCase } from "../../use-cases/shipment-accounts/create-shipment-account.js"

export function makeCreateShipmentAccountUseCase() {
	return new CreateShipmentAccountUseCase(new DrizzleShipmentAccountRepository())
}
