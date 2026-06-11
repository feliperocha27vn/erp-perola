import { DrizzleStoreRepository } from "../../repositories/drizzle/drizzle-store-repository.js"
import { FetchAllStoresUseCase } from "../../use-cases/stores/fetch-all-stores.js"

export function makeFetchAllStoresUseCase() {
	const storeRepository = new DrizzleStoreRepository()
	return new FetchAllStoresUseCase(storeRepository)
}
