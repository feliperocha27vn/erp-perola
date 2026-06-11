import { asc, eq } from "drizzle-orm"
import { db } from "../../db/connection.js"
import { stores } from "../../db/schema.js"
import type { StoreRepository } from "../store-repository.js"

export class DrizzleStoreRepository implements StoreRepository {
	async findAll() {
		return db.select().from(stores).orderBy(asc(stores.name))
	}

	async getById(id: string) {
		const [store] = await db.select().from(stores).where(eq(stores.id, id))
		return store ?? null
	}
}
