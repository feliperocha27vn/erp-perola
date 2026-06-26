import { asc, eq } from "drizzle-orm"
import { db } from "../../db/connection.js"
import { shipmentAccounts } from "../../db/schema.js"
import type { ShipmentAccountRepository } from "../shipment-account-repository.js"

export class DrizzleShipmentAccountRepository implements ShipmentAccountRepository {
	async list() {
		return db.select().from(shipmentAccounts).orderBy(asc(shipmentAccounts.name))
	}

	async getById(id: string) {
		const [row] = await db.select().from(shipmentAccounts).where(eq(shipmentAccounts.id, id))
		return row ?? null
	}

	async getByName(name: string) {
		const [row] = await db.select().from(shipmentAccounts).where(eq(shipmentAccounts.name, name))
		return row ?? null
	}

	async create(data: { name: string }) {
		const [row] = await db
			.insert(shipmentAccounts)
			.values({ name: data.name, updated_at: new Date() })
			.returning()
		return row
	}

	async update(id: string, data: { name: string }) {
		const [row] = await db
			.update(shipmentAccounts)
			.set({ name: data.name, updated_at: new Date() })
			.where(eq(shipmentAccounts.id, id))
			.returning()
		return row ?? null
	}

	async delete(id: string) {
		await db.delete(shipmentAccounts).where(eq(shipmentAccounts.id, id))
	}
}
