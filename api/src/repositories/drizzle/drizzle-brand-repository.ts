import { and, asc, eq, isNull } from "drizzle-orm"
import { db } from "../../db/connection.js"
import { brands } from "../../db/schema.js"
import type {
	BrandRepository,
	CreateBrandInput,
	UpdateBrandInput,
} from "../brand-repository.js"

export class DrizzleBrandRepository implements BrandRepository {
	async findAll() {
		return db
			.select()
			.from(brands)
			.where(isNull(brands.deleted_at))
			.orderBy(asc(brands.name))
	}

	async getById(id: string) {
		const [brand] = await db
			.select()
			.from(brands)
			.where(and(eq(brands.id, id), isNull(brands.deleted_at)))
		return brand ?? null
	}

	async getByName(name: string) {
		const [brand] = await db
			.select()
			.from(brands)
			.where(and(eq(brands.name, name), isNull(brands.deleted_at)))
		return brand ?? null
	}

	async create(data: CreateBrandInput) {
		const [brand] = await db
			.insert(brands)
			.values({
				name: data.name,
				updated_at: new Date(),
			})
			.returning()

		return brand
	}

	async update(id: string, data: UpdateBrandInput) {
		const [brand] = await db
			.update(brands)
			.set({
				name: data.name,
				updated_at: new Date(),
			})
			.where(and(eq(brands.id, id), isNull(brands.deleted_at)))
			.returning()

		return brand ?? null
	}

	async delete(id: string): Promise<void> {
		await db
			.update(brands)
			.set({ deleted_at: new Date(), updated_at: new Date() })
			.where(and(eq(brands.id, id), isNull(brands.deleted_at)))
	}
}
