import { and, asc, eq, isNull, sql } from "drizzle-orm"
import { db } from "../../db/connection.js"
import { products, stocks } from "../../db/schema.js"
import type {
	StockReportRepository,
	StockReportRow,
} from "../report-repository.js"

export class DrizzleReportRepository implements StockReportRepository {
	async fetchStockReport(brandId: string | null): Promise<StockReportRow[]> {
		const rows = await db
			.select({
				productId: products.id,
				sku: products.sku,
				stockId: stocks.id,
				stockTitle: stocks.title,
				stockQtde: stocks.qtde,
			})
			.from(products)
			.leftJoin(stocks, eq(stocks.product_id, products.id))
			.where(
				and(
					isNull(products.deleted_at),
					brandId === null ? isNull(products.brand_id) : eq(products.brand_id, brandId),
				),
			)
			.orderBy(asc(products.sku), asc(stocks.title))

		const productMap = new Map<string, StockReportRow>()

		for (const row of rows) {
			if (!productMap.has(row.productId)) {
				productMap.set(row.productId, {
					productId: row.productId,
					sku: row.sku,
					stocks: [],
					total: 0,
				})
			}

			const product = productMap.get(row.productId)!

			if (row.stockId !== null && row.stockTitle !== null && row.stockQtde !== null) {
				product.stocks.push({
					id: row.stockId,
					title: row.stockTitle,
					qtde: row.stockQtde,
				})
				product.total += row.stockQtde
			}
		}

		return Array.from(productMap.values())
	}
}
