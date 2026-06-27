export interface StockEntry {
	id: string
	title: string
	qtde: number
}

export interface StockReportRow {
	productId: string
	sku: string
	stocks: StockEntry[]
	total: number
}

export interface StockReportRepository {
	fetchStockReport(brandId: string | null): Promise<StockReportRow[]>
}

export interface SalesReportRow {
	sale_date: Date
	sku: string
	store_name: string | null
	channel: string
	stock_title: string
	quantity: number
	sale_price: number
	total_price: number
}

export interface SalesReportRepository {
	fetchSalesReport(startDate: Date, endDate: Date): Promise<SalesReportRow[]>
}
