import type {
	StockReportRepository,
	StockReportRow,
} from "../report-repository.js"

export class InMemoryReportRepository implements StockReportRepository {
	public rows: (StockReportRow & { brandId: string | null })[] = []

	async fetchStockReport(brandId: string | null): Promise<StockReportRow[]> {
		return this.rows
			.filter((row) => row.brandId === brandId)
			.map(({ productId, sku, stocks, total }) => ({
				productId,
				sku,
				stocks,
				total,
			}))
	}
}
