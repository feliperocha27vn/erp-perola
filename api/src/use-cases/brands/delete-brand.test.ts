import { describe, expect, it } from "vitest"
import { BrandInUseError } from "../../errors/brand-in-use-error.js"
import { BrandNotFoundError } from "../../errors/brand-not-found-error.js"
import type {
	Brand,
	BrandRepository,
	CreateBrandInput,
	UpdateBrandInput,
} from "../../repositories/brand-repository.js"
import type {
	CreateProductInput,
	FetchProductsReply,
	FetchProductsRequest,
	Product,
	ProductRepository,
	SalesDailyStore,
	SalesVelocityItem,
	UpdateProductInput,
} from "../../repositories/product-repository.js"
import { DeleteBrandUseCase } from "./delete-brand.js"

class FakeBrandRepository implements BrandRepository {
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
		const brand = this.brands.find((b) => b.id === id)
		if (!brand) return null
		brand.name = data.name
		brand.updated_at = new Date()
		return brand
	}

	async delete(id: string): Promise<void> {
		const brand = this.brands.find((b) => b.id === id)
		if (brand) brand.deleted_at = new Date()
	}
}

class FakeProductRepository implements ProductRepository {
	constructor(private products: Product[]) {}

	async fetchProducts(_: FetchProductsRequest): Promise<FetchProductsReply> {
		return { items: this.products, total: this.products.length, pageIndex: 0 }
	}
	async getProductById(id: string): Promise<Product | null> {
		return this.products.find((p) => p.id === id) ?? null
	}
	async getBySkus(skus: string[]): Promise<Product[]> {
		return this.products.filter((p) => skus.includes(p.sku))
	}
	async getBySku(sku: string): Promise<Product | null> {
		return this.products.find((p) => p.sku === sku) ?? null
	}
	async getByEan(ean: string): Promise<Product | null> {
		return this.products.find((p) => p.ean === ean) ?? null
	}
	async countByBrandId(brandId: string): Promise<number> {
		return this.products.filter((p) => p.brand_id === brandId).length
	}
	async create(_: CreateProductInput): Promise<Product> {
		throw new Error("Not implemented")
	}
	async update(_id: string, _data: UpdateProductInput): Promise<Product | null> {
		return null
	}
	async updateProductImage(_: string, __: string): Promise<Product | null> {
		return null
	}
	async fetchSalesVelocity(): Promise<SalesVelocityItem[]> {
		return []
	}
	async fetchProductSalesDaily(): Promise<SalesDailyStore[]> {
		return []
	}
	async delete(_id: string): Promise<boolean> {
		return false
	}
}

function makeBrand(id: string, name: string): Brand {
	return {
		id,
		name,
		deleted_at: null,
		created_at: new Date(),
		updated_at: new Date(),
	}
}

function makeProduct(brandId: string): Product {
	return {
		id: crypto.randomUUID(),
		sku: `SKU-${crypto.randomUUID()}`,
		ean: `EAN-${crypto.randomUUID()}`,
		brand_id: brandId,
		brand: null,
		url_image: null,
		sale_price_cents: null,
		technical_title: null,
		technical_description: null,
		stocks: [],
		deleted_at: null,
		created_at: new Date(),
		updated_at: new Date(),
	}
}

describe("DeleteBrandUseCase", () => {
	it("soft deletes a brand by setting deleted_at", async () => {
		const brandRepo = new FakeBrandRepository()
		brandRepo.brands.push(makeBrand("b-1", "ORIENT"))
		const productRepo = new FakeProductRepository([])

		const useCase = new DeleteBrandUseCase(brandRepo, productRepo)
		await useCase.execute({ id: "b-1" })

		const raw = brandRepo.brands.find((b) => b.id === "b-1")
		expect(raw?.deleted_at).toBeInstanceOf(Date)
		expect(await brandRepo.getById("b-1")).toBeNull()
	})

	it("throws BrandNotFoundError for nonexistent brand", async () => {
		const brandRepo = new FakeBrandRepository()
		const productRepo = new FakeProductRepository([])

		const useCase = new DeleteBrandUseCase(brandRepo, productRepo)
		await expect(useCase.execute({ id: "nope" })).rejects.toBeInstanceOf(
			BrandNotFoundError,
		)
	})

	it("throws BrandInUseError when brand has active products", async () => {
		const brandRepo = new FakeBrandRepository()
		brandRepo.brands.push(makeBrand("b-1", "ORIENT"))
		const productRepo = new FakeProductRepository([makeProduct("b-1")])

		const useCase = new DeleteBrandUseCase(brandRepo, productRepo)
		await expect(useCase.execute({ id: "b-1" })).rejects.toBeInstanceOf(
			BrandInUseError,
		)
	})

	it("does not affect other brands", async () => {
		const brandRepo = new FakeBrandRepository()
		brandRepo.brands.push(makeBrand("b-1", "ORIENT"))
		brandRepo.brands.push(makeBrand("b-2", "MONDAINE"))
		const productRepo = new FakeProductRepository([])

		const useCase = new DeleteBrandUseCase(brandRepo, productRepo)
		await useCase.execute({ id: "b-1" })

		expect(await brandRepo.getById("b-2")).not.toBeNull()
	})
})
