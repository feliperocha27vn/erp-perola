import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm"
import { db } from "../../db/connection.js"
import { brands, products, sales, stocks, stores } from "../../db/schema.js"
import { InsufficientStockError } from "../../errors/insufficient-stock-error.js"
import { SaleNotFoundError } from "../../errors/sale-not-found-error.js"
import { StockProductMismatchError } from "../../errors/stock-product-mismatch-error.js"
import type {
	BrandSalesCount,
	CreateSaleInput,
	FetchCurrentMonthSalesMetricsReply,
	FetchLastMonthSalesMetricsReply,
	FindManySalesFilters,
	FindManySalesReply,
	Sale,
	SaleRepository,
	UpdateSaleInput,
} from "../sale-repository.js"

type SaleRow = typeof sales.$inferSelect
type ProductRow = typeof products.$inferSelect
type StockRow = typeof stocks.$inferSelect
type StoreRow = typeof stores.$inferSelect

function mapSale(
	saleRow: SaleRow,
	productRow: ProductRow,
	stockRow: StockRow,
	storeRow: Partial<StoreRow> | null,
): Sale {
	return {
		...saleRow,
		product: productRow,
		stock: stockRow,
		store:
			storeRow?.id != null
				? {
						id: storeRow.id,
						name: storeRow.name!,
						created_at: storeRow.created_at!,
						updated_at: storeRow.updated_at!,
					}
				: null,
	}
}

export class DrizzleSaleRepository implements SaleRepository {
	async fetchCurrentMonthSalesMetrics(): Promise<FetchCurrentMonthSalesMetricsReply> {
		const dayBucket = sql`date_trunc('day', ${sales.sale_date} AT TIME ZONE 'America/Sao_Paulo')`
		const monthStart = sql`date_trunc('month', now() AT TIME ZONE 'America/Sao_Paulo')`
		const nextMonthStart = sql`${monthStart} + interval '1 month'`

		const rows = await db
			.select({
				date: sql<string>`to_char(${dayBucket}, 'YYYY-MM-DD')`,
				total_cents: sql<number>`sum(${sales.total_price})::int`,
			})
			.from(sales)
			.where(
				sql`${sales.sale_date} AT TIME ZONE 'America/Sao_Paulo' >= ${monthStart} AND ${sales.sale_date} AT TIME ZONE 'America/Sao_Paulo' < ${nextMonthStart}`,
			)
			.groupBy(dayBucket)
			.orderBy(dayBucket)

		const yearMonthFormatter = new Intl.DateTimeFormat("en-CA", {
			timeZone: "America/Sao_Paulo",
			year: "numeric",
			month: "2-digit",
		})

		const now = new Date()
		const [yearPart, monthPart] = yearMonthFormatter.format(now).split("-")
		const year = Number(yearPart)
		const month = Number(monthPart)
		const totalDays = new Date(year, month, 0).getDate()

		const totalsByDay = new Map(rows.map((row) => [row.date, row.total_cents]))
		const items = Array.from({ length: totalDays }, (_, index) => {
			const day = String(index + 1).padStart(2, "0")
			const date = `${yearPart}-${monthPart}-${day}`

			return {
				date,
				total_cents: totalsByDay.get(date) ?? 0,
			}
		})

		const totalMonthCents = items.reduce(
			(sum, item) => sum + item.total_cents,
			0,
		)
		const daysWithSales = items.filter((item) => item.total_cents > 0).length
		const daily_average_cents =
			daysWithSales > 0 ? Math.round(totalMonthCents / daysWithSales) : 0

		return {
			items,
			daily_average_cents,
		}
	}

	async fetchLastMonthSalesMetrics(): Promise<FetchLastMonthSalesMetricsReply> {
		const lastMonthStart = sql`date_trunc('month', now() AT TIME ZONE 'America/Sao_Paulo') - interval '1 month'`
		const thisMonthStart = sql`date_trunc('month', now() AT TIME ZONE 'America/Sao_Paulo')`

		const [row] = await db
			.select({
				total_cents: sql<number>`coalesce(sum(${sales.total_price}), 0)::int`,
			})
			.from(sales)
			.where(
				sql`${sales.sale_date} AT TIME ZONE 'America/Sao_Paulo' >= ${lastMonthStart} AND ${sales.sale_date} AT TIME ZONE 'America/Sao_Paulo' < ${thisMonthStart}`,
			)

		return {
			total_cents: row?.total_cents ?? 0,
		}
	}

	async findMany(filters: FindManySalesFilters): Promise<FindManySalesReply> {
		// Constraints de período se aplicam tanto à listagem quanto à contagem por marca.
		const dateConstraints = [
			filters.startDate ? gte(sales.sale_date, filters.startDate) : undefined,
			filters.endDate ? lte(sales.sale_date, filters.endDate) : undefined,
		].filter(Boolean)

		// Filtros de marca e loja só restringem a listagem; brandCounts mostra a
		// distribuição completa do período.
		const listConstraints = [
			...dateConstraints,
			filters.brandId ? eq(products.brand_id, filters.brandId) : undefined,
			filters.storeId ? eq(sales.store_id, filters.storeId) : undefined,
		].filter(Boolean)

		const where =
			listConstraints.length > 0 ? and(...listConstraints) : undefined
		const dateWhere =
			dateConstraints.length > 0 ? and(...dateConstraints) : undefined

		const countBase = db
			.select({ count: sql<number>`count(*)` })
			.from(sales)
			.innerJoin(products, eq(products.id, sales.product_id))

		const countRows = where ? await countBase.where(where) : await countBase

		const totalCount = Number(countRows[0]?.count ?? 0)

		const dataBase = db
			.select({ sale: sales, product: products, stock: stocks, store: stores })
			.from(sales)
			.innerJoin(products, eq(products.id, sales.product_id))
			.innerJoin(stocks, eq(stocks.id, sales.stock_id))
			.leftJoin(stores, eq(stores.id, sales.store_id))

		const rows = await (where ? dataBase.where(where) : dataBase)
			.orderBy(asc(sales.sale_date), asc(sales.created_at))
			.limit(filters.limit)
			.offset(filters.offset)

		const brandCountBase = db
			.select({
				brand_id: brands.id,
				brand_name: brands.name,
				count: sql<number>`count(*)::int`,
			})
			.from(sales)
			.innerJoin(products, eq(products.id, sales.product_id))
			.innerJoin(brands, eq(brands.id, products.brand_id))

		const brandCountRows = await (dateWhere
			? brandCountBase.where(dateWhere)
			: brandCountBase
		)
			.groupBy(brands.id, brands.name)
			.orderBy(desc(sql`count(*)`), asc(brands.name))

		const brandCounts: BrandSalesCount[] = brandCountRows.map((row) => ({
			brand_id: row.brand_id,
			brand_name: row.brand_name,
			count: Number(row.count),
		}))

		return {
			items: rows.map((row) =>
				mapSale(row.sale, row.product, row.stock, row.store),
			),
			totalCount,
			brandCounts,
		}
	}

	async getById(id: string): Promise<Sale | null> {
		const [row] = await db
			.select({ sale: sales, product: products, stock: stocks, store: stores })
			.from(sales)
			.innerJoin(products, eq(products.id, sales.product_id))
			.innerJoin(stocks, eq(stocks.id, sales.stock_id))
			.leftJoin(stores, eq(stores.id, sales.store_id))
			.where(eq(sales.id, id))

		if (!row) {
			return null
		}

		return mapSale(row.sale, row.product, row.stock, row.store)
	}

	async create(data: CreateSaleInput): Promise<Sale> {
		const [saleRow] = await db
			.insert(sales)
			.values({
				product_id: data.product_id,
				stock_id: data.stock_id,
				store_id: data.store_id ?? null,
				quantity: data.quantity,
				sale_price: data.sale_price,
				total_price: data.total_price,
				channel: data.channel,
				sale_date: data.sale_date,
				updated_at: new Date(),
			})
			.returning()

		const sale = await this.getById(saleRow.id)

		if (!sale) {
			throw new SaleNotFoundError()
		}

		return sale
	}

	async update(id: string, data: UpdateSaleInput): Promise<Sale | null> {
		const [saleRow] = await db
			.update(sales)
			.set({ ...data, updated_at: new Date() })
			.where(eq(sales.id, id))
			.returning()

		if (!saleRow) {
			return null
		}

		return this.getById(saleRow.id)
	}

	async delete(id: string): Promise<void> {
		await db.delete(sales).where(eq(sales.id, id))
	}

	async createInTransaction(data: CreateSaleInput): Promise<Sale> {
		const saleId = await db.transaction(async (tx) => {
			const [stockRow] = await tx
				.select()
				.from(stocks)
				.where(eq(stocks.id, data.stock_id))

			if (!stockRow) {
				throw new StockProductMismatchError()
			}

			if (stockRow.product_id !== data.product_id) {
				throw new StockProductMismatchError()
			}

			if (stockRow.qtde < data.quantity) {
				throw new InsufficientStockError()
			}

			await tx
				.update(stocks)
				.set({
					qtde: stockRow.qtde - data.quantity,
					updated_at: new Date(),
				})
				.where(eq(stocks.id, data.stock_id))

			const [saleRow] = await tx
				.insert(sales)
				.values({
					product_id: data.product_id,
					stock_id: data.stock_id,
					store_id: data.store_id ?? null,
					quantity: data.quantity,
					sale_price: data.sale_price,
					total_price: data.total_price,
					channel: data.channel,
					sale_date: data.sale_date,
					updated_at: new Date(),
				})
				.returning({ id: sales.id })

			return saleRow.id
		})

		const sale = await this.getById(saleId)

		if (!sale) {
			throw new SaleNotFoundError()
		}

		return sale
	}

	async deleteInTransaction(id: string): Promise<void> {
		await db.transaction(async (tx) => {
			const [saleRow] = await tx.select().from(sales).where(eq(sales.id, id))

			if (!saleRow) {
				throw new SaleNotFoundError()
			}

			const [stockRow] = await tx
				.select()
				.from(stocks)
				.where(eq(stocks.id, saleRow.stock_id))

			if (!stockRow) {
				throw new StockProductMismatchError()
			}

			await tx
				.update(stocks)
				.set({
					qtde: stockRow.qtde + saleRow.quantity,
					updated_at: new Date(),
				})
				.where(eq(stocks.id, saleRow.stock_id))

			await tx.delete(sales).where(eq(sales.id, id))
		})
	}

	async updateInTransaction(
		id: string,
		data: UpdateSaleInput,
	): Promise<Sale | null> {
		await db.transaction(async (tx) => {
			const [currentSale] = await tx
				.select()
				.from(sales)
				.where(eq(sales.id, id))

			if (!currentSale) {
				throw new SaleNotFoundError()
			}

			const [stockRow] = await tx
				.select()
				.from(stocks)
				.where(eq(stocks.id, currentSale.stock_id))

			if (!stockRow) {
				throw new StockProductMismatchError()
			}

			const nextQuantity = data.quantity ?? currentSale.quantity
			const delta = nextQuantity - currentSale.quantity

			if (delta > 0 && stockRow.qtde < delta) {
				throw new InsufficientStockError()
			}

			if (delta !== 0) {
				await tx
					.update(stocks)
					.set({
						qtde: stockRow.qtde - delta,
						updated_at: new Date(),
					})
					.where(eq(stocks.id, currentSale.stock_id))
			}

			await tx
				.update(sales)
				.set({
					quantity: nextQuantity,
					sale_price: data.sale_price ?? currentSale.sale_price,
					total_price:
						data.total_price ??
						nextQuantity * (data.sale_price ?? currentSale.sale_price),
					channel: data.channel ?? currentSale.channel,
					sale_date: data.sale_date ?? currentSale.sale_date,
					store_id:
						data.store_id !== undefined ? data.store_id : currentSale.store_id,
					updated_at: new Date(),
				})
				.where(eq(sales.id, id))
		})

		return this.getById(id)
	}
}
