import { DrizzleStockEntryRepository } from "../../repositories/drizzle/drizzle-stock-entry-repository.js"
import { DrizzleStockRepository } from "../../repositories/drizzle/drizzle-stock-repository.js"
import { CreateStockExitUseCase } from "../../use-cases/stock-entries/create-stock-exit.js"

export function makeCreateStockExitUseCase() {
	return new CreateStockExitUseCase(
		new DrizzleStockRepository(),
		new DrizzleStockEntryRepository(),
	)
}
