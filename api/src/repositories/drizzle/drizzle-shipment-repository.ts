import { desc, eq } from "drizzle-orm"
import { alias } from "drizzle-orm/pg-core"
import { db } from "../../db/connection.js"
import { products, shipmentAccounts, shipmentItems, shipments, stocks } from "../../db/schema.js"
import type {
	CreateShipmentInput,
	ShipmentRepository,
	ShipmentRow,
	ShipmentStatus,
	UpdateShipmentInput,
} from "../shipment-repository.js"

export class DrizzleShipmentRepository implements ShipmentRepository {
	async list() {
		const rows = await db
			.select({
				id: shipments.id,
				account_id: shipments.account_id,
				date: shipments.date,
				notes: shipments.notes,
				status: shipments.status,
				created_at: shipments.created_at,
				updated_at: shipments.updated_at,
				account_name: shipmentAccounts.name,
			})
			.from(shipments)
			.innerJoin(shipmentAccounts, eq(shipments.account_id, shipmentAccounts.id))
			.orderBy(desc(shipments.created_at))

		const allItems = await db.select({ shipment_id: shipmentItems.shipment_id }).from(shipmentItems)

		const countMap = new Map<string, number>()
		for (const item of allItems) {
			countMap.set(item.shipment_id, (countMap.get(item.shipment_id) ?? 0) + 1)
		}

		return rows.map((r) => ({ ...r, item_count: countMap.get(r.id) ?? 0 }))
	}

	async getById(id: string) {
		const [row] = await db
			.select({
				id: shipments.id,
				account_id: shipments.account_id,
				date: shipments.date,
				notes: shipments.notes,
				status: shipments.status,
				created_at: shipments.created_at,
				updated_at: shipments.updated_at,
				account_name: shipmentAccounts.name,
			})
			.from(shipments)
			.innerJoin(shipmentAccounts, eq(shipments.account_id, shipmentAccounts.id))
			.where(eq(shipments.id, id))

		if (!row) return null

		const srcStocks = alias(stocks, "src_stocks")
		const dstStocks = alias(stocks, "dst_stocks")

		const items = await db
			.select({
				id: shipmentItems.id,
				shipment_id: shipmentItems.shipment_id,
				product_id: shipmentItems.product_id,
				sku: products.sku,
				quantity: shipmentItems.quantity,
				source_stock_id: shipmentItems.source_stock_id,
				source_stock_title: srcStocks.title,
				destination_stock_id: shipmentItems.destination_stock_id,
				destination_stock_title: dstStocks.title,
				created_at: shipmentItems.created_at,
			})
			.from(shipmentItems)
			.innerJoin(products, eq(products.id, shipmentItems.product_id))
			.innerJoin(srcStocks, eq(srcStocks.id, shipmentItems.source_stock_id))
			.innerJoin(dstStocks, eq(dstStocks.id, shipmentItems.destination_stock_id))
			.where(eq(shipmentItems.shipment_id, id))

		return { ...row, items }
	}

	async create(data: CreateShipmentInput) {
		const [shipment] = await db
			.insert(shipments)
			.values({
				account_id: data.account_id,
				date: data.date,
				notes: data.notes,
				updated_at: new Date(),
			})
			.returning()

		const items =
			data.items.length > 0
				? await db
						.insert(shipmentItems)
						.values(
							data.items.map((item) => ({
								shipment_id: shipment.id,
								product_id: item.product_id,
								quantity: item.quantity,
								source_stock_id: item.source_stock_id,
								destination_stock_id: item.destination_stock_id,
							})),
						)
						.returning()
				: []

		const [account] = await db
			.select({ name: shipmentAccounts.name })
			.from(shipmentAccounts)
			.where(eq(shipmentAccounts.id, data.account_id))

		return { ...shipment, account_name: account.name, items }
	}

	async update(id: string, data: UpdateShipmentInput) {
		const [shipment] = await db
			.update(shipments)
			.set({
				...(data.account_id !== undefined && { account_id: data.account_id }),
				...(data.date !== undefined && { date: data.date }),
				...(data.notes !== undefined && { notes: data.notes }),
				updated_at: new Date(),
			})
			.where(eq(shipments.id, id))
			.returning()

		if (!shipment) return null

		if (data.items !== undefined) {
			await db.delete(shipmentItems).where(eq(shipmentItems.shipment_id, id))
			if (data.items.length > 0) {
				await db.insert(shipmentItems).values(
					data.items.map((item) => ({
						shipment_id: id,
						product_id: item.product_id,
						quantity: item.quantity,
						source_stock_id: item.source_stock_id,
						destination_stock_id: item.destination_stock_id,
					})),
				)
			}
		}

		return this.getById(id)
	}

	async updateStatus(id: string, status: ShipmentStatus): Promise<ShipmentRow | null> {
		const [row] = await db
			.update(shipments)
			.set({ status, updated_at: new Date() })
			.where(eq(shipments.id, id))
			.returning()
		return row ?? null
	}

	async delete(id: string) {
		await db.delete(shipments).where(eq(shipments.id, id))
	}
}
