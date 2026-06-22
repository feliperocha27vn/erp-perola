import { and, desc, eq, gte, isNull, lte, not } from "drizzle-orm"
import { db } from "../../db/connection.js"
import { brands, products, stockEntries, stocks } from "../../db/schema.js"
import type {
	CreateStockEntryInput,
	FetchGlobalParams,
	StockEntryRepository,
	StockEntryWithContext,
} from "../stock-entry-repository.js"

export class DrizzleStockEntryRepository implements StockEntryRepository {
	async create(data: CreateStockEntryInput) {
		const [entry] = await db
			.insert(stockEntries)
			.values({
				stock_id: data.stock_id,
				quantity: data.quantity,
				notes: data.notes ?? null,
			})
			.returning()

		return entry
	}

	async findByProductId(productId: string): Promise<StockEntryWithContext[]> {
		const rows = await db
			.select({
				id: stockEntries.id,
				stock_id: stockEntries.stock_id,
				quantity: stockEntries.quantity,
				notes: stockEntries.notes,
				created_at: stockEntries.created_at,
				stock_title: stocks.title,
				product_id: products.id,
				product_sku: products.sku,
				brand_id: products.brand_id,
				brand_name: brands.name,
			})
			.from(stockEntries)
			.innerJoin(stocks, eq(stockEntries.stock_id, stocks.id))
			.innerJoin(products, eq(stocks.product_id, products.id))
			.leftJoin(brands, eq(products.brand_id, brands.id))
			.where(eq(stocks.product_id, productId))
			.orderBy(desc(stockEntries.created_at))

		return rows
	}

	async findGlobal(params: FetchGlobalParams): Promise<StockEntryWithContext[]> {
		const conditions = [
			gte(stockEntries.created_at, params.startDate),
			lte(stockEntries.created_at, params.endDate),
		]

		if (params.noBrand) {
			conditions.push(isNull(products.brand_id))
		} else if (params.brandId) {
			conditions.push(eq(products.brand_id, params.brandId))
		}

		const rows = await db
			.select({
				id: stockEntries.id,
				stock_id: stockEntries.stock_id,
				quantity: stockEntries.quantity,
				notes: stockEntries.notes,
				created_at: stockEntries.created_at,
				stock_title: stocks.title,
				product_id: products.id,
				product_sku: products.sku,
				brand_id: products.brand_id,
				brand_name: brands.name,
			})
			.from(stockEntries)
			.innerJoin(stocks, eq(stockEntries.stock_id, stocks.id))
			.innerJoin(products, eq(stocks.product_id, products.id))
			.leftJoin(brands, eq(products.brand_id, brands.id))
			.where(and(...conditions))
			.orderBy(desc(stockEntries.created_at))

		return rows
	}
}
