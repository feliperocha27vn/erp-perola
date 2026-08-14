import { asc, eq } from "drizzle-orm"
import { db } from "../../db/connection.js"
import { stocks } from "../../db/schema.js"
import type {
	CreateStockInput,
	StockRepository,
	UpdateStockInput,
} from "../stock-repository.js"

export class DrizzleStockRepository implements StockRepository {
	async findByProductId(productId: string) {
		return db
			.select()
			.from(stocks)
			.where(eq(stocks.product_id, productId))
			.orderBy(asc(stocks.created_at))
	}

	async getById(stockId: string) {
		const [stock] = await db.select().from(stocks).where(eq(stocks.id, stockId))
		return stock ?? null
	}

	async create(data: CreateStockInput) {
		const [stock] = await db
			.insert(stocks)
			.values({
				product_id: data.product_id,
				title: data.title,
				qtde: data.qtde,
				full: data.full,
				marketplace: data.marketplace ?? null,
				store_id: data.store_id ?? null,
				updated_at: new Date(),
			})
			.returning()

		return stock
	}

	async update(stockId: string, data: UpdateStockInput) {
		const [stock] = await db
			.update(stocks)
			.set({ ...data, updated_at: new Date() })
			.where(eq(stocks.id, stockId))
			.returning()

		return stock ?? null
	}

	async delete(stockId: string) {
		await db.delete(stocks).where(eq(stocks.id, stockId))
	}
}
