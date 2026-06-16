import type {
	CreateProductInput,
	FetchProductsReply,
	FetchProductsRequest,
	Product,
	ProductBrand,
	ProductRepository,
	SalesDailyStore,
	SalesVelocityItem,
	UpdateProductInput,
} from "../product-repository.js"

export class InMemoryProductRepository implements ProductRepository {
	public products: Product[] = []
	public brands: ProductBrand[] = []

	async fetchProducts(
		request: FetchProductsRequest,
	): Promise<FetchProductsReply> {
		const pageSize = 20
		let items = this.products

		if (request.withoutImage) {
			items = items.filter((product) => !product.url_image)
		}

		if (request.search) {
			const search = request.search.toLowerCase()
			items = items.filter(
				(product) =>
					product.sku.toLowerCase().includes(search) ||
					product.ean.toLowerCase().includes(search),
			)
		}

		if (request.brandId) {
			items = items.filter((product) => product.brand_id === request.brandId)
		}

		const total = items.length
		const pageIndex = Math.max(0, request.pageIndex)
		const offset = pageIndex * pageSize
		const paginatedItems = items.slice(offset, offset + pageSize)

		return {
			items: paginatedItems,
			total,
			pageIndex,
		}
	}

	async fetchSalesVelocity(
		_request: FetchProductsRequest,
	): Promise<SalesVelocityItem[]> {
		return this.products.map((product) => ({
			product_id: product.id,
			units_15d: 0,
			units_30d: 0,
			units_60d: 0,
			units_90d: 0,
		}))
	}

	async fetchProductSalesDaily(_productId: string): Promise<SalesDailyStore[]> {
		return []
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

	async create(data: CreateProductInput): Promise<Product> {
		const brand = data.brand_id
			? (this.brands.find((b) => b.id === data.brand_id) ?? null)
			: null

		const product: Product = {
			id: crypto.randomUUID(),
			sku: data.sku,
			ean: data.ean,
			sale_price_cents: null,
			brand_id: data.brand_id ?? null,
			brand,
			url_image: data.url_image ?? null,
			technical_title: data.technical_details?.technical_title ?? null,
			technical_subtitle: data.technical_details?.technical_subtitle ?? null,
			technical_analysis: data.technical_details?.technical_analysis ?? null,
			technical_movement: data.technical_details?.technical_movement ?? null,
			technical_case_and_crystal:
				data.technical_details?.technical_case_and_crystal ?? null,
			technical_specific_functionality:
				data.technical_details?.technical_specific_functionality ?? null,
			technical_dial_and_luminosity:
				data.technical_details?.technical_dial_and_luminosity ?? null,
			technical_bracelet_construction:
				data.technical_details?.technical_bracelet_construction ?? null,
			technical_table: data.technical_details?.technical_table ?? null,
			stocks: [],
			created_at: new Date(),
			updated_at: new Date(),
		}

		this.products.push(product)
		return product
	}

	async update(id: string, data: UpdateProductInput): Promise<Product | null> {
		const product = await this.getProductById(id)

		if (!product) {
			return null
		}

		if (data.sku !== undefined) product.sku = data.sku
		if (data.ean !== undefined) product.ean = data.ean
		if (data.brand_id !== undefined) {
			product.brand_id = data.brand_id
			product.brand = this.brands.find((b) => b.id === data.brand_id) ?? null
		}
		if (data.sale_price_cents !== undefined) {
			product.sale_price_cents = data.sale_price_cents
		}
		if (data.url_image !== undefined) product.url_image = data.url_image
		if (data.technical_title !== undefined) {
			product.technical_title = data.technical_title
		}
		if (data.technical_subtitle !== undefined) {
			product.technical_subtitle = data.technical_subtitle
		}
		if (data.technical_analysis !== undefined) {
			product.technical_analysis = data.technical_analysis
		}
		if (data.technical_movement !== undefined) {
			product.technical_movement = data.technical_movement
		}
		if (data.technical_case_and_crystal !== undefined) {
			product.technical_case_and_crystal = data.technical_case_and_crystal
		}
		if (data.technical_specific_functionality !== undefined) {
			product.technical_specific_functionality =
				data.technical_specific_functionality
		}
		if (data.technical_dial_and_luminosity !== undefined) {
			product.technical_dial_and_luminosity = data.technical_dial_and_luminosity
		}
		if (data.technical_bracelet_construction !== undefined) {
			product.technical_bracelet_construction =
				data.technical_bracelet_construction
		}
		if (data.technical_table !== undefined) {
			product.technical_table = data.technical_table
		}

		product.updated_at = new Date()

		return product
	}

	async updateProductImage(
		id: string,
		url_image: string,
	): Promise<Product | null> {
		return this.update(id, { url_image })
	}
}
