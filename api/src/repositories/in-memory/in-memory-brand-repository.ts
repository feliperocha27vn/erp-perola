import type {
	Brand,
	BrandRepository,
	CreateBrandInput,
	UpdateBrandInput,
} from "../brand-repository.js"

export class InMemoryBrandRepository implements BrandRepository {
	public brands: Brand[] = []

	async findAll(): Promise<Brand[]> {
		return this.brands
	}

	async getById(id: string): Promise<Brand | null> {
		return this.brands.find((brand) => brand.id === id) ?? null
	}

	async getByName(name: string): Promise<Brand | null> {
		return this.brands.find((brand) => brand.name === name) ?? null
	}

	async create(data: CreateBrandInput): Promise<Brand> {
		const brand: Brand = {
			id: crypto.randomUUID(),
			name: data.name,
			created_at: new Date(),
			updated_at: new Date(),
		}

		this.brands.push(brand)
		return brand
	}

	async update(id: string, data: UpdateBrandInput): Promise<Brand | null> {
		const brand = await this.getById(id)

		if (!brand) {
			return null
		}

		brand.name = data.name
		brand.updated_at = new Date()

		return brand
	}

	async delete(id: string): Promise<void> {
		this.brands = this.brands.filter((brand) => brand.id !== id)
	}
}
