export interface CreateStockEntryInput {
	stock_id: string
	quantity: number
	notes: string | null
}

export interface StockEntryRow {
	id: string
	stock_id: string
	quantity: number
	notes: string | null
	created_at: Date
}

export interface StockEntryWithContext {
	id: string
	stock_id: string
	quantity: number
	notes: string | null
	created_at: Date
	stock_title: string
	product_id: string
	product_sku: string
	brand_id: string | null
	brand_name: string | null
}

export interface FetchGlobalParams {
	brandId: string | null
	noBrand: boolean
	startDate: Date
	endDate: Date
}

export interface StockEntryRepository {
	create(data: CreateStockEntryInput): Promise<StockEntryRow>
	findByProductId(productId: string): Promise<StockEntryWithContext[]>
	findGlobal(params: FetchGlobalParams): Promise<StockEntryWithContext[]>
}
