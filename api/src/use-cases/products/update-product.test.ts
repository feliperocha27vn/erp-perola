import { describe, expect, it } from "vitest"
import { ProductAlreadyExistsError } from "../../errors/product-already-exists-error.js"
import type {
	Brand,
	BrandRepository,
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
import { UpdateProductUseCase } from "./update-product.js"

class FakeBrandRepository implements BrandRepository {
	constructor(private brands: Brand[]) {}

	async findAll(): Promise<Brand[]> {
		return this.brands
	}

	async getById(id: string): Promise<Brand | null> {
		return this.brands.find((brand) => brand.id === id) ?? null
	}

	async getByName(name: string): Promise<Brand | null> {
		return this.brands.find((brand) => brand.name === name) ?? null
	}

	async create(data: { name: string }): Promise<Brand> {
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

	async update(id: string, data: { name: string }): Promise<Brand | null> {
		const brand = this.brands.find((item) => item.id === id)

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

class FakeProductRepository implements ProductRepository {
	constructor(private products: Product[]) {}

	async fetchProducts(
		_request: FetchProductsRequest,
	): Promise<FetchProductsReply> {
		return {
			items: this.products,
			total: this.products.length,
			pageIndex: 0,
		}
	}

	async getProductById(id: string): Promise<Product | null> {
		return this.products.find((product) => product.id === id) ?? null
	}

	async getBySkus(skus: string[]): Promise<Product[]> {
		return this.products.filter((product) => skus.includes(product.sku))
	}

	async getBySku(sku: string): Promise<Product | null> {
		return this.products.find((product) => product.sku === sku) ?? null
	}

	async getByEan(ean: string): Promise<Product | null> {
		return this.products.find((product) => product.ean === ean) ?? null
	}

	async countByBrandId(brandId: string): Promise<number> {
		return this.products.filter((product) => product.brand_id === brandId)
			.length
	}

	async create(_data: CreateProductInput): Promise<Product> {
		throw new Error("Not implemented")
	}

	async update(id: string, data: UpdateProductInput): Promise<Product | null> {
		const current = this.products.find((product) => product.id === id)

		if (!current) {
			return null
		}

		if (data.sku !== undefined) {
			current.sku = data.sku
		}

		if (data.ean !== undefined) {
			current.ean = data.ean
		}

		if (data.brand_id !== undefined) {
			current.brand_id = data.brand_id
		}

		if (data.sale_price_cents !== undefined) {
			current.sale_price_cents = data.sale_price_cents
		}

		current.updated_at = new Date()

		return current
	}

	async updateProductImage(
		_id: string,
		_url_image: string,
	): Promise<Product | null> {
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

function makeProduct(id: string, sku: string, ean: string): Product {
	return {
		id,
		sku,
		ean,
		sale_price_cents: null,
		brand_id: null,
		brand: null,
		url_image: null,
		technical_title: null,
		technical_subtitle: null,
		technical_analysis: null,
		technical_movement: null,
		technical_case_and_crystal: null,
		technical_specific_functionality: null,
		technical_dial_and_luminosity: null,
		technical_bracelet_construction: null,
		technical_table: null,
		stocks: [],
		deleted_at: null,
		created_at: new Date(),
		updated_at: new Date(),
	}
}

describe("UpdateProductUseCase", () => {
	it("updates sku and ean using normalized values", async () => {
		const repository = new FakeProductRepository([
			makeProduct("p-1", "SKU-OLD", "EAN-OLD"),
			makeProduct("p-2", "SKU-OTHER", "EAN-OTHER"),
		])
		const brands = new FakeBrandRepository([])

		const useCase = new UpdateProductUseCase(repository, brands)
		const result = await useCase.execute({
			id: "p-1",
			sku: "  sku-new  ",
			ean: "  ean-new  ",
		})

		expect(result.product.sku).toBe("SKU-NEW")
		expect(result.product.ean).toBe("EAN-NEW")
	})

	it("throws when sku is already used by another product", async () => {
		const repository = new FakeProductRepository([
			makeProduct("p-1", "SKU-OLD", "EAN-OLD"),
			makeProduct("p-2", "SKU-IN-USE", "EAN-OTHER"),
		])
		const brands = new FakeBrandRepository([])

		const useCase = new UpdateProductUseCase(repository, brands)

		await expect(
			useCase.execute({
				id: "p-1",
				sku: "sku-in-use",
			}),
		).rejects.toBeInstanceOf(ProductAlreadyExistsError)
	})

	it("throws when ean is already used by another product", async () => {
		const repository = new FakeProductRepository([
			makeProduct("p-1", "SKU-OLD", "EAN-OLD"),
			makeProduct("p-2", "SKU-OTHER", "EAN-IN-USE"),
		])
		const brands = new FakeBrandRepository([])

		const useCase = new UpdateProductUseCase(repository, brands)

		await expect(
			useCase.execute({
				id: "p-1",
				ean: "ean-in-use",
			}),
		).rejects.toBeInstanceOf(ProductAlreadyExistsError)
	})

	it("updates sale price cents when provided", async () => {
		const repository = new FakeProductRepository([
			makeProduct("p-1", "SKU-OLD", "EAN-OLD"),
		])
		const brands = new FakeBrandRepository([])

		const useCase = new UpdateProductUseCase(repository, brands)
		const result = await useCase.execute({
			id: "p-1",
			sale_price_cents: 12345,
		})

		expect(result.product.sale_price_cents).toBe(12345)
	})
})
