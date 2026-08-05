import { DrizzleShipmentRepository } from "../../repositories/drizzle/drizzle-shipment-repository.js"
import { DrizzleStockEntryRepository } from "../../repositories/drizzle/drizzle-stock-entry-repository.js"
import { DrizzleStockRepository } from "../../repositories/drizzle/drizzle-stock-repository.js"
import { DispatchShipmentUseCase } from "../../use-cases/shipments/dispatch-shipment.js"

export function makeDispatchShipmentUseCase() {
	return new DispatchShipmentUseCase(
		new DrizzleShipmentRepository(),
		new DrizzleStockRepository(),
		new DrizzleStockEntryRepository(),
	)
}
