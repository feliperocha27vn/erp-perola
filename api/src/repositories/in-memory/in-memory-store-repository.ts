import type { Store, StoreRepository } from "../store-repository.js"

export class InMemoryStoreRepository implements StoreRepository {
	public stores: Store[] = []

	async findAll(): Promise<Store[]> {
		return this.stores
	}

	async getById(id: string): Promise<Store | null> {
		return this.stores.find((store) => store.id === id) ?? null
	}
}
