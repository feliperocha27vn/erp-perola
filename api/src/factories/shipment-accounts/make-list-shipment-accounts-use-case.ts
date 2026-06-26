import { DrizzleShipmentAccountRepository } from "../../repositories/drizzle/drizzle-shipment-account-repository.js"
import { ListShipmentAccountsUseCase } from "../../use-cases/shipment-accounts/list-shipment-accounts.js"

export function makeListShipmentAccountsUseCase() {
	return new ListShipmentAccountsUseCase(new DrizzleShipmentAccountRepository())
}
