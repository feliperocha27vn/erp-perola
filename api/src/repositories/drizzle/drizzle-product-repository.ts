import { and, eq, ilike, inArray, isNull, or, sql, isNotNull } from "drizzle-orm"
import { db } from "../../db/connection.js"
import { brands, products, sales, stocks, stores } from "../../db/schema.js"
import type {
	CreateProductInput,
	FetchProductsReply,
	FetchProductsRequest,
	Product,
	ProductBrand,
	ProductRepository,
	ProductStock,
	ProductTechnicalDetailsInput,
	SalesDailyStore,
	SalesVelocityItem,
	UpdateProductInput,
} from "../product-repository.js"

type ProductRow = {
	id: string
	sku: string
	ean: string
	sale_price_cents: number | null
	brand_id: string | null
	url_image: string | null
	technical_title: string | null
	technical_subtitle: string | null
	technical_analysis: string | null
	technical_movement: string | null
	technical_case_and_crystal: string | null
	technical_specific_functionality: string | null
	technical_dial_and_luminosity: string | null
	technical_bracelet_construction: string | null
	technical_table: string | null
	deleted_at: Date | null
	created_at: Date
	updated_at: Date
}

function mapTechnicalDetailsInput(data?: ProductTechnicalDetailsInput) {
	return {
		technical_title: data?.technical_title ?? null,
		technical_subtitle: data?.technical_subtitle ?? null,
		technical_analysis: data?.technical_analysis ?? null,
		technical_movement: data?.technical_movement ?? null,
		technical_case_and_crystal: data?.technical_case_and_crystal ?? null,
		technical_specific_functionality:
			data?.technical_specific_functionality ?? null,
		technical_dial_and_luminosity: data?.technical_dial_and_luminosity ?? null,
		technical_bracelet_construction:
			data?.technical_bracelet_construction ?? null,
		technical_table: data?.technical_table ?? null,
	}
}

type BrandRow = {
	id: string
	name: string
	created_at: Date
	updated_at: Date
}

function mapBrandRow(row: BrandRow): ProductBrand {
	return {
		id: row.id,
		name: row.name,
		created_at: row.created_at,
		updated_at: row.updated_at,
	}
}

async function attachRelations(rows: ProductRow[]): Promise<Product[]> {
	if (rows.length === 0) {
		return []
	}

	const productIds = rows.map((row) => row.id)
	const brandIds = rows
		.map((row) => row.brand_id)
		.filter((brandId): brandId is string => brandId !== null)

	const [stockRows, brandRows] = await Promise.all([
		db.select().from(stocks).where(inArray(stocks.product_id, productIds)),
		brandIds.length > 0
			? db.select().from(brands).where(inArray(brands.id, brandIds))
			: Promise.resolve([] as BrandRow[]),
	])

	const stocksByProductId = stockRows.reduce<Map<string, ProductStock[]>>(
		(acc, stockRow) => {
			const current = acc.get(stockRow.product_id) ?? []
			current.push(stockRow)
			acc.set(stockRow.product_id, current)
			return acc
		},
		new Map(),
	)

	const brandsById = brandRows.reduce<Map<string, ProductBrand>>(
		(acc, brandRow) => {
			acc.set(brandRow.id, mapBrandRow(brandRow))
			return acc
		},
		new Map(),
	)

	return rows.map((row) => ({
		...row,
		brand: row.brand_id ? (brandsById.get(row.brand_id) ?? null) : null,
		stocks: stocksByProductId.get(row.id) ?? [],
	}))
}

export class DrizzleProductRepository implements ProductRepository {
	async fetchProducts({
		pageIndex,
		withoutImage,
		search,
		brandId,
	}: FetchProductsRequest): Promise<FetchProductsReply> {
		const limit = 20
		const offset = pageIndex * limit
		const normalizedSearch = search?.trim()

		const filters = [
			isNull(products.deleted_at),
			withoutImage ? isNull(products.url_image) : undefined,
			normalizedSearch
				? or(
						ilike(products.sku, `%${normalizedSearch}%`),
						ilike(products.ean, `%${normalizedSearch}%`),
					)
				: undefined,
			brandId ? eq(products.brand_id, brandId) : undefined,
		].filter(Boolean)

		const whereClause = and(...filters)

		const countQuery = db
			.select({ count: sql<number>`count(*)` })
			.from(products)
			.where(whereClause)

		const productsPageQuery = db
			.select()
			.from(products)
			.where(whereClause)
			.orderBy(products.created_at, products.id)
			.limit(limit)
			.offset(offset)

		const [productsPage, [{ count }]] = await Promise.all([
			productsPageQuery,
			countQuery,
		])

		if (productsPage.length === 0) {
			return {
				items: [],
				total: Number(count),
				pageIndex,
			}
		}

		const orderedItems = await attachRelations(productsPage)

		return {
			items: orderedItems,
			total: Number(count),
			pageIndex,
		}
	}

	async getProductById(id: string): Promise<Product | null> {
		const rows = await db
			.select()
			.from(products)
			.where(and(eq(products.id, id), isNull(products.deleted_at)))
		const [product] = await attachRelations(rows)
		return product ?? null
	}

	async getBySku(sku: string): Promise<Product | null> {
		const rows = await db.select().from(products).where(eq(products.sku, sku))
		const [product] = await attachRelations(rows)
		return product ?? null
	}

	async getBySkus(skus: string[]): Promise<Product[]> {
		if (skus.length === 0) {
			return []
		}

		const rows = await db
			.select()
			.from(products)
			.where(inArray(products.sku, skus))
		return attachRelations(rows)
	}

	async getByEan(ean: string): Promise<Product | null> {
		const rows = await db.select().from(products).where(eq(products.ean, ean))
		const [product] = await attachRelations(rows)
		return product ?? null
	}

	async countByBrandId(brandId: string): Promise<number> {
		const [result] = await db
			.select({ count: sql<number>`count(*)` })
			.from(products)
			.where(eq(products.brand_id, brandId))

		return Number(result?.count ?? 0)
	}

	async create(data: CreateProductInput): Promise<Product> {
		const [createdRow] = await db
			.insert(products)
			.values({
				sku: data.sku,
				ean: data.ean,
				brand_id: data.brand_id,
				url_image: data.url_image ?? null,
				...mapTechnicalDetailsInput(data.technical_details),
				updated_at: new Date(),
			})
			.returning()

		const product = await this.getProductById(createdRow.id)

		if (!product) {
			throw new Error("Product not found after create")
		}

		return product
	}

	async update(id: string, data: UpdateProductInput): Promise<Product | null> {
		const {
			technical_title,
			technical_subtitle,
			technical_analysis,
			technical_movement,
			technical_case_and_crystal,
			technical_specific_functionality,
			technical_dial_and_luminosity,
			technical_bracelet_construction,
			technical_table,
			...rest
		} = data

		const [updatedRow] = await db
			.update(products)
			.set({
				...rest,
				technical_title,
				technical_subtitle,
				technical_analysis,
				technical_movement,
				technical_case_and_crystal,
				technical_specific_functionality,
				technical_dial_and_luminosity,
				technical_bracelet_construction,
				technical_table,
				updated_at: new Date(),
			})
			.where(eq(products.id, id))
			.returning()

		if (!updatedRow) {
			return null
		}

		return this.getProductById(updatedRow.id)
	}

	async fetchSalesVelocity({
		pageIndex,
		withoutImage,
		search,
	}: FetchProductsRequest): Promise<SalesVelocityItem[]> {
		const limit = 20
		const offset = pageIndex * limit
		const normalizedSearch = search?.trim()

		const filters = [
			isNull(products.deleted_at),
			withoutImage ? isNull(products.url_image) : undefined,
			normalizedSearch
				? or(
						ilike(products.sku, `%${normalizedSearch}%`),
						ilike(products.ean, `%${normalizedSearch}%`),
					)
				: undefined,
		].filter(Boolean)

		const whereClause = and(...filters)

		const pageQuery = db
			.select({ id: products.id })
			.from(products)
			.where(whereClause)
			.orderBy(products.created_at, products.id)
			.limit(limit)
			.offset(offset)

		const pageProducts = await pageQuery

		if (pageProducts.length === 0) return []

		const productIds = pageProducts.map((p) => p.id)

		const rows = await db
			.select({
				product_id: products.id,
				units_15d: sql<number>`coalesce(sum(case when ${sales.sale_date} >= now() - interval '15 days' then ${sales.quantity} else 0 end), 0)::int`,
				units_30d: sql<number>`coalesce(sum(case when ${sales.sale_date} >= now() - interval '30 days' then ${sales.quantity} else 0 end), 0)::int`,
				units_60d: sql<number>`coalesce(sum(case when ${sales.sale_date} >= now() - interval '60 days' then ${sales.quantity} else 0 end), 0)::int`,
				units_90d: sql<number>`coalesce(sum(case when ${sales.sale_date} >= now() - interval '90 days' then ${sales.quantity} else 0 end), 0)::int`,
			})
			.from(products)
			.leftJoin(sales, eq(sales.product_id, products.id))
			.where(inArray(products.id, productIds))
			.groupBy(products.id)

		return rows.map((row) => ({
			product_id: row.product_id,
			units_15d: Number(row.units_15d),
			units_30d: Number(row.units_30d),
			units_60d: Number(row.units_60d),
			units_90d: Number(row.units_90d),
		}))
	}

	async fetchProductSalesDaily(productId: string): Promise<SalesDailyStore[]> {
		const allStores = await db
			.select({ id: stores.id, name: stores.name })
			.from(stores)
			.orderBy(stores.name)

		const rows = await db
			.select({
				store_id: sales.store_id,
				sale_day: sql<string>`date_trunc('day', ${sales.sale_date})::date::text`,
				units: sql<number>`sum(${sales.quantity})::int`,
			})
			.from(sales)
			.where(
				and(
					eq(sales.product_id, productId),
					sql`${sales.sale_date} >= now() - interval '90 days'`,
				),
			)
			.groupBy(sales.store_id, sql`date_trunc('day', ${sales.sale_date})::date`)
			.orderBy(sql`date_trunc('day', ${sales.sale_date})::date`)

		const PERIODS = [15, 30, 60, 90] as const

		const buildPeriods = (dayMap: Map<string, number>) => {
			const now = new Date()
			return PERIODS.map((period) => {
				const cutoff = new Date(now.getTime() - period * 24 * 60 * 60 * 1000)
				const cutoffStr = cutoff.toISOString().slice(0, 10)
				const days: { date: string; units: number }[] = []
				let total_units = 0
				for (const [date, units] of dayMap) {
					if (date >= cutoffStr) {
						days.push({ date, units: Number(units) })
						total_units += Number(units)
					}
				}
				days.sort((a, b) => a.date.localeCompare(b.date))
				return { period, total_units, days }
			})
		}

		const todasMap = new Map<string, number>()
		for (const row of rows) {
			todasMap.set(
				row.sale_day,
				(todasMap.get(row.sale_day) ?? 0) + Number(row.units),
			)
		}

		const storeMaps = new Map<string, Map<string, number>>()
		for (const row of rows) {
			if (!row.store_id) continue
			if (!storeMaps.has(row.store_id)) storeMaps.set(row.store_id, new Map())
			const m = storeMaps.get(row.store_id)!
			m.set(row.sale_day, (m.get(row.sale_day) ?? 0) + Number(row.units))
		}

		return [
			{ store_id: null, store_name: "Todas", periods: buildPeriods(todasMap) },
			...allStores.map((store) => ({
				store_id: store.id,
				store_name: store.name,
				periods: buildPeriods(storeMaps.get(store.id) ?? new Map()),
			})),
		]
	}

	async updateProductImage(
		id: string,
		url_image: string,
	): Promise<Product | null> {
		const [updatedRow] = await db
			.update(products)
			.set({ url_image, updated_at: new Date() })
			.where(and(eq(products.id, id), isNull(products.deleted_at)))
			.returning()

		if (!updatedRow) {
			return null
		}

		return this.getProductById(updatedRow.id)
	}

	async delete(id: string): Promise<boolean> {
		const [updated] = await db
			.update(products)
			.set({ deleted_at: new Date(), updated_at: new Date() })
			.where(and(eq(products.id, id), isNull(products.deleted_at)))
			.returning({ id: products.id })

		return !!updated
	}
}
