import { DrizzleShipmentAccountRepository } from "../../repositories/drizzle/drizzle-shipment-account-repository.js"
import { UpdateShipmentAccountUseCase } from "../../use-cases/shipment-accounts/update-shipment-account.js"

export function makeUpdateShipmentAccountUseCase() {
	return new UpdateShipmentAccountUseCase(new DrizzleShipmentAccountRepository())
}
