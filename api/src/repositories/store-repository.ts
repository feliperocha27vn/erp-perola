export interface Store {
	id: string
	name: string
	created_at: Date
	updated_at: Date
}

export interface StoreRepository {
	findAll(): Promise<Store[]>
	getById(id: string): Promise<Store | null>
}
