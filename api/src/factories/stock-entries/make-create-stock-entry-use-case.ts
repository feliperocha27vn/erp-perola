import { DrizzleStockEntryRepository } from "../../repositories/drizzle/drizzle-stock-entry-repository.js"
import { DrizzleStockRepository } from "../../repositories/drizzle/drizzle-stock-repository.js"
import { CreateStockEntryUseCase } from "../../use-cases/stock-entries/create-stock-entry.js"

export function makeCreateStockEntryUseCase() {
	return new CreateStockEntryUseCase(
		new DrizzleStockRepository(),
		new DrizzleStockEntryRepository(),
	)
}
