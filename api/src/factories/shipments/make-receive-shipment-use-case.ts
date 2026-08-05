import { DrizzleShipmentRepository } from "../../repositories/drizzle/drizzle-shipment-repository.js"
import { DrizzleStockEntryRepository } from "../../repositories/drizzle/drizzle-stock-entry-repository.js"
import { DrizzleStockRepository } from "../../repositories/drizzle/drizzle-stock-repository.js"
import { ReceiveShipmentUseCase } from "../../use-cases/shipments/receive-shipment.js"

export function makeReceiveShipmentUseCase() {
	return new ReceiveShipmentUseCase(
		new DrizzleShipmentRepository(),
		new DrizzleStockRepository(),
		new DrizzleStockEntryRepository(),
	)
}
