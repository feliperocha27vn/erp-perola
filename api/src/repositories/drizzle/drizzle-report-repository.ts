import { and, asc, desc, eq, gte, isNull, lte, sql } from "drizzle-orm"
import { db } from "../../db/connection.js"
import { brands, products, sales, stocks, stores } from "../../db/schema.js"
import type {
	AbcReportRawRow,
	AbcReportRepository,
	RestockAlertProductRow,
	RestockAlertRepository,
	RestockAlertSalesRow,
	SalesReportRepository,
	SalesReportRow,
	StockReportRepository,
	StockReportRow,
	StockTotalRow,
	Units90dRow,
} from "../report-repository.js"

export class DrizzleReportRepository
	implements StockReportRepository, SalesReportRepository, AbcReportRepository, RestockAlertRepository {
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

	async fetchAbcReport(startDate: Date, endDate: Date): Promise<AbcReportRawRow[]> {
		const rows = await db
			.select({
				store_name: stores.name,
				sku: products.sku,
				total_revenue: sql<number>`sum(${sales.total_price})`.mapWith(Number),
				qty_sales: sql<number>`count(*)`.mapWith(Number),
				qty_units: sql<number>`sum(${sales.quantity})`.mapWith(Number),
			})
			.from(sales)
			.innerJoin(products, eq(products.id, sales.product_id))
			.leftJoin(stores, eq(stores.id, sales.store_id))
			.where(and(gte(sales.sale_date, startDate), lte(sales.sale_date, endDate)))
			.groupBy(stores.name, products.sku)
			.orderBy(asc(stores.name), desc(sql`sum(${sales.total_price})`))

		return rows.map((row) => ({
			store_name: row.store_name ?? null,
			sku: row.sku,
			total_revenue: row.total_revenue,
			qty_sales: row.qty_sales,
			qty_units: row.qty_units,
		}))
	}

	async fetchStockTotals(): Promise<StockTotalRow[]> {
		const rows = await db
			.select({
				sku: products.sku,
				stock_qty: sql<number>`coalesce(sum(${stocks.qtde}), 0)`.mapWith(Number),
			})
			.from(products)
			.leftJoin(stocks, eq(stocks.product_id, products.id))
			.groupBy(products.sku)

		return rows
	}

	async fetchUnits90dByStore(): Promise<Units90dRow[]> {
		const rows = await db
			.select({
				store_name: stores.name,
				sku: products.sku,
				units_90d: sql<number>`coalesce(sum(${sales.quantity}), 0)`.mapWith(Number),
			})
			.from(sales)
			.innerJoin(products, eq(products.id, sales.product_id))
			.leftJoin(stores, eq(stores.id, sales.store_id))
			.where(sql`${sales.sale_date} >= now() - interval '90 days'`)
			.groupBy(stores.name, products.sku)

		return rows.map((row) => ({
			store_name: row.store_name ?? null,
			sku: row.sku,
			units_90d: row.units_90d,
		}))
	}

	async fetchRestockAlertProducts(): Promise<RestockAlertProductRow[]> {
		const rows = await db
			.select({
				product_id: products.id,
				sku: products.sku,
				brand_name: brands.name,
				physical_stock_qty: sql<number>`coalesce(sum(${stocks.qtde}), 0)::int`,
			})
			.from(products)
			.leftJoin(brands, eq(brands.id, products.brand_id))
			.leftJoin(stocks, and(eq(stocks.product_id, products.id), eq(stocks.full, false)))
			.where(isNull(products.deleted_at))
			.groupBy(products.id, brands.name)

		return rows.map((row) => ({
			product_id: row.product_id,
			sku: row.sku,
			brand_name: row.brand_name ?? null,
			physical_stock_qty: Number(row.physical_stock_qty),
		}))
	}

	async fetchRestockAlertSalesPace(): Promise<RestockAlertSalesRow[]> {
		const rows = await db
			.select({
				product_id: products.id,
				units_15d: sql<number>`coalesce(sum(case when ${sales.sale_date} >= now() - interval '15 days' then ${sales.quantity} else 0 end), 0)::int`,
				units_30d: sql<number>`coalesce(sum(case when ${sales.sale_date} >= now() - interval '30 days' then ${sales.quantity} else 0 end), 0)::int`,
			})
			.from(products)
			.leftJoin(sales, eq(sales.product_id, products.id))
			.where(isNull(products.deleted_at))
			.groupBy(products.id)

		return rows.map((row) => ({
			product_id: row.product_id,
			units_15d: Number(row.units_15d),
			units_30d: Number(row.units_30d),
		}))
	}
}
