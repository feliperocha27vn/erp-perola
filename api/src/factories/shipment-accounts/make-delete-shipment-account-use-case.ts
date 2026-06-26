import { DrizzleShipmentAccountRepository } from "../../repositories/drizzle/drizzle-shipment-account-repository.js"
import { DeleteShipmentAccountUseCase } from "../../use-cases/shipment-accounts/delete-shipment-account.js"

export function makeDeleteShipmentAccountUseCase() {
	return new DeleteShipmentAccountUseCase(new DrizzleShipmentAccountRepository())
}
