export interface ProductBrand {
	id: string
	name: string
	created_at: Date
	updated_at: Date
}

export type Marketplace = "mercado_livre" | "amazon" | "shopee"

export interface ProductStock {
	id: string
	product_id: string
	title: string
	qtde: number
	full: boolean
	marketplace: Marketplace | null
	/** Conta dona do deposito. Nulo no fisico, que atende todas as contas. */
	store_id: string | null
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
	technical_description: string | null
	stocks: ProductStock[]
	deleted_at: Date | null
	created_at: Date
	updated_at: Date
}

export interface ProductTechnicalDetailsInput {
	technical_title?: string | null
	technical_description?: string | null
}

export interface FetchProductsRequest {
	pageIndex: number
	withoutImage?: boolean
	search?: string
	brandId?: string
	sortOrder?: 'asc' | 'desc'
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
	delete(id: string): Promise<boolean>
}
