export interface ProductBrand {
	id: string
	name: string
	created_at: Date
	updated_at: Date
}

export interface ProductStock {
	id: string
	product_id: string
	title: string
	qtde: number
	full: boolean
	created_at: Date
	updated_at: Date
}

export interface Product {
	id: string
	sku: string
	ean: string
	sale_price_cents: number | null
	brand_id: string | null
	brand: ProductBrand | null
	url_image: string | null
	technical_title: string | null
	technical_subtitle: string | null
	technical_analysis: string | null
	technical_movement: string | null
	technical_case_and_crystal: string | null
	technical_specific_functionality: string | null
	technical_dial_and_luminosity: string | null
	technical_bracelet_construction: string | null
	technical_table: string | null
	stocks: ProductStock[]
	created_at: Date
	updated_at: Date
}

export interface ProductTechnicalDetailsInput {
	technical_title?: string | null
	technical_subtitle?: string | null
	technical_analysis?: string | null
	technical_movement?: string | null
	technical_case_and_crystal?: string | null
	technical_specific_functionality?: string | null
	technical_dial_and_luminosity?: string | null
	technical_bracelet_construction?: string | null
	technical_table?: string | null
}

export interface FetchProductsRequest {
	pageIndex: number
	withoutImage?: boolean
	search?: string
	brandId?: string
}

export interface SalesVelocityItem {
	product_id: string
	units_15d: number
	units_30d: number
	units_60d: number
	units_90d: number
}

export interface SalesDailyEntry {
	date: string
	units: number
}

export interface SalesDailyPeriod {
	period: 15 | 30 | 60 | 90
	total_units: number
	days: SalesDailyEntry[]
}

export interface SalesDailyStore {
	store_id: string | null
	store_name: string
	periods: SalesDailyPeriod[]
}

export interface FetchProductsReply {
	items: Product[]
	total: number
	pageIndex: number
}

export interface CreateProductInput {
	sku: string
	ean: string
	brand_id: string
	url_image?: string | null
	technical_details?: ProductTechnicalDetailsInput
}

export interface UpdateProductInput extends ProductTechnicalDetailsInput {
	sku?: string
	ean?: string
	sale_price_cents?: number | null
	brand_id?: string
	url_image?: string | null
}

export interface ProductRepository {
	fetchProducts(request: FetchProductsRequest): Promise<FetchProductsReply>
	fetchSalesVelocity(
		request: FetchProductsRequest,
	): Promise<SalesVelocityItem[]>
	fetchProductSalesDaily(productId: string): Promise<SalesDailyStore[]>
	getProductById(id: string): Promise<Product | null>
	getBySkus(skus: string[]): Promise<Product[]>
	getBySku(sku: string): Promise<Product | null>
	getByEan(ean: string): Promise<Product | null>
	countByBrandId(brandId: string): Promise<number>
	create(data: CreateProductInput): Promise<Product>
	update(id: string, data: UpdateProductInput): Promise<Product | null>
	updateProductImage(id: string, url_image: string): Promise<Product | null>
}
