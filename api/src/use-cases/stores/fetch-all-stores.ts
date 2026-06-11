import type { StoreRepository } from "../../repositories/store-repository.js"

export class FetchAllStoresUseCase {
	constructor(private storeRepository: StoreRepository) {}

	async execute() {
		const stores = await this.storeRepository.findAll()
		return { stores }
	}
}
