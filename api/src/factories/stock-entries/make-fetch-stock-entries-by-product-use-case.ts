import { DrizzleStockEntryRepository } from "../../repositories/drizzle/drizzle-stock-entry-repository.js"
import { FetchStockEntriesByProductUseCase } from "../../use-cases/stock-entries/fetch-stock-entries-by-product.js"

export function makeFetchStockEntriesByProductUseCase() {
	return new FetchStockEntriesByProductUseCase(
		new DrizzleStockEntryRepository(),
	)
}
