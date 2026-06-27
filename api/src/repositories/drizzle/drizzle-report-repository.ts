import { and, asc, eq, gte, isNull, lte } from "drizzle-orm"
import { db } from "../../db/connection.js"
import { products, sales, stocks, stores } from "../../db/schema.js"
import type {
	SalesReportRepository,
	SalesReportRow,
	StockReportRepository,
	StockReportRow,
} from "../report-repository.js"

export class DrizzleReportRepository
	implements StockReportRepository, SalesReportRepository {
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

	async fetchSalesReport(startDate: Date, endDate: Date): Promise<SalesReportRow[]> {
		const rows = await db
			.select({
				sale_date: sales.sale_date,
				sku: products.sku,
				store_name: stores.name,
				channel: sales.channel,
				stock_title: stocks.title,
				quantity: sales.quantity,
				sale_price: sales.sale_price,
				total_price: sales.total_price,
			})
			.from(sales)
			.innerJoin(products, eq(products.id, sales.product_id))
			.innerJoin(stocks, eq(stocks.id, sales.stock_id))
			.leftJoin(stores, eq(stores.id, sales.store_id))
			.where(and(gte(sales.sale_date, startDate), lte(sales.sale_date, endDate)))
			.orderBy(asc(sales.sale_date), asc(products.sku))

		return rows.map((row) => ({
			sale_date: row.sale_date,
			sku: row.sku,
			store_name: row.store_name ?? null,
			channel: row.channel,
			stock_title: row.stock_title,
			quantity: row.quantity,
			sale_price: row.sale_price,
			total_price: row.total_price,
		}))
	}
}
