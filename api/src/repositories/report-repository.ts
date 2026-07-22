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

export interface AbcReportRawRow {
	store_name: string | null
	sku: string
	total_revenue: number
	qty_sales: number
	qty_units: number
}

export interface StockTotalRow {
	sku: string
	stock_qty: number
}

export interface Units90dRow {
	store_name: string | null
	sku: string
	units_90d: number
}

export interface AbcReportRepository {
	fetchAbcReport(startDate: Date, endDate: Date): Promise<AbcReportRawRow[]>
	fetchStockTotals(): Promise<StockTotalRow[]>
	fetchUnits90dByStore(): Promise<Units90dRow[]>
}

export interface RestockAlertProductRow {
	product_id: string
	sku: string
	brand_name: string | null
	physical_stock_qty: number
}

export interface RestockAlertSalesRow {
	product_id: string
	units_15d: number
	units_30d: number
}

export interface RestockAlertRepository {
	fetchRestockAlertProducts(): Promise<RestockAlertProductRow[]>
	fetchRestockAlertSalesPace(): Promise<RestockAlertSalesRow[]>
}
