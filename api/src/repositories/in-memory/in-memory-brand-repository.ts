import type {
	Brand,
	BrandRepository,
	CreateBrandInput,
	UpdateBrandInput,
} from "../brand-repository.js"

export class InMemoryBrandRepository implements BrandRepository {
	public brands: Brand[] = []

	async findAll(): Promise<Brand[]> {
		return this.brands.filter((b) => b.deleted_at === null)
	}

	async getById(id: string): Promise<Brand | null> {
		return (
			this.brands.find((b) => b.id === id && b.deleted_at === null) ?? null
		)
	}

	async getByName(name: string): Promise<Brand | null> {
		return (
			this.brands.find((b) => b.name === name && b.deleted_at === null) ?? null
		)
	}

	async create(data: CreateBrandInput): Promise<Brand> {
		const brand: Brand = {
			id: crypto.randomUUID(),
			name: data.name,
			deleted_at: null,
			created_at: new Date(),
			updated_at: new Date(),
		}

		this.brands.push(brand)
		return brand
	}

	async update(id: string, data: UpdateBrandInput): Promise<Brand | null> {
		const brand = this.brands.find((b) => b.id === id && b.deleted_at === null)

		if (!brand) {
			return null
		}

		brand.name = data.name
		brand.updated_at = new Date()

		return brand
	}

	async delete(id: string): Promise<void> {
		const brand = this.brands.find((b) => b.id === id)
		if (brand) brand.deleted_at = new Date()
	}
}
