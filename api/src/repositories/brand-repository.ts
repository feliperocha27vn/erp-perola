export interface Brand {
	id: string
	name: string
	created_at: Date
	updated_at: Date
}

export interface CreateBrandInput {
	name: string
}

export interface UpdateBrandInput {
	name: string
}

export interface BrandRepository {
	findAll(): Promise<Brand[]>
	getById(id: string): Promise<Brand | null>
	getByName(name: string): Promise<Brand | null>
	create(data: CreateBrandInput): Promise<Brand>
	update(id: string, data: UpdateBrandInput): Promise<Brand | null>
	delete(id: string): Promise<void>
}
