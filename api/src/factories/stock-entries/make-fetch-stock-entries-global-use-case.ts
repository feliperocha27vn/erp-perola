import { DrizzleStockEntryRepository } from "../../repositories/drizzle/drizzle-stock-entry-repository.js"
import { FetchStockEntriesGlobalUseCase } from "../../use-cases/stock-entries/fetch-stock-entries-global.js"

export function makeFetchStockEntriesGlobalUseCase() {
	return new FetchStockEntriesGlobalUseCase(
		new DrizzleStockEntryRepository(),
	)
}
