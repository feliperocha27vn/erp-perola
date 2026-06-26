import { DrizzleStockEntryRepository } from "../../repositories/drizzle/drizzle-stock-entry-repository.js"
import { DrizzleStockRepository } from "../../repositories/drizzle/drizzle-stock-repository.js"
import { DrizzleShipmentRepository } from "../../repositories/drizzle/drizzle-shipment-repository.js"
import { ConfirmShipmentUseCase } from "../../use-cases/shipments/confirm-shipment.js"

export function makeConfirmShipmentUseCase() {
	return new ConfirmShipmentUseCase(
		new DrizzleShipmentRepository(),
		new DrizzleStockRepository(),
		new DrizzleStockEntryRepository(),
	)
}
