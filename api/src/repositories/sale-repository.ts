export type SaleChannel = "Amazon" | "Mercado Livre" | "Shopee" | "Direto"

export interface Sale {
	id: string
	product_id: string
	stock_id: string
	store_id: string | null
	quantity: number
	sale_price: number
	total_price: number
	channel: SaleChannel
	sale_date: Date
	created_at: Date
	updated_at: Date
	product: {
		id: string
		sku: string
		ean: string
		brand_id: string | null
		url_image: string | null
		created_at: Date
		updated_at: Date
	}
	stock: {
		id: string
		product_id: string
		title: string
		qtde: number
		full: boolean
		created_at: Date
		updated_at: Date
	}
	store: {
		id: string
		name: string
		created_at: Date
		updated_at: Date
	} | null
}

export interface BrandSalesCount {
	brand_id: string
	brand_name: string
	count: number
}

export interface MonthlySalesPacePoint {
	day: number
	current_month_cents: number | null
	last_month_cents: number | null
}

export interface FetchMonthlySalesPaceMetricsReply {
	items: MonthlySalesPacePoint[]
	current_month_total_cents: number
	last_month_total_cents: number
}

export interface FetchLastMonthSalesMetricsReply {
	total_cents: number
}

export interface FetchCurrentMonthSalesMetricsReply {
	total_cents: number
}

export interface CreateSaleInput {
	product_id: string
	stock_id: string
	store_id?: string | null
	quantity: number
	sale_price: number
	total_price: number
	channel: SaleChannel
	sale_date: Date
}

export interface UpdateSaleInput {
	quantity?: number
	sale_price?: number
	total_price?: number
	channel?: SaleChannel
	sale_date?: Date
	store_id?: string | null
}

export interface FindManySalesFilters {
	startDate?: Date
	endDate?: Date
	brandId?: string
	storeId?: string
	limit: number
	offset: number
}

export interface FindManySalesReply {
	items: Sale[]
	totalCount: number
	brandCounts: BrandSalesCount[]
}

export interface SaleRepository {
	findMany(filters: FindManySalesFilters): Promise<FindManySalesReply>
	fetchMonthlySalesPaceMetrics(): Promise<FetchMonthlySalesPaceMetricsReply>
	fetchLastMonthSalesMetrics(): Promise<FetchLastMonthSalesMetricsReply>
	fetchCurrentMonthSalesMetrics(): Promise<FetchCurrentMonthSalesMetricsReply>
	getById(id: string): Promise<Sale | null>
	create(data: CreateSaleInput): Promise<Sale>
	update(id: string, data: UpdateSaleInput): Promise<Sale | null>
	delete(id: string): Promise<void>
	createInTransaction(data: CreateSaleInput): Promise<Sale>
	deleteInTransaction(id: string): Promise<void>
	updateInTransaction(id: string, data: UpdateSaleInput): Promise<Sale | null>
}
