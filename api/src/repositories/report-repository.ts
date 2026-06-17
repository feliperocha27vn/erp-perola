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
