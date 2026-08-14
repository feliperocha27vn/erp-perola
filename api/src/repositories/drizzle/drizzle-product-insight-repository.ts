import { eq } from "drizzle-orm"
import { db } from "../../db/connection.js"
import { productInsights } from "../../db/schema.js"
import type {
	ProductInsight,
	ProductInsightRepository,
} from "../product-insight-repository.js"

export class DrizzleProductInsightRepository implements ProductInsightRepository {
	async findByProductId(productId: string): Promise<ProductInsight | null> {
		const [row] = await db
			.select()
			.from(productInsights)
			.where(eq(productInsights.product_id, productId))
			.limit(1)

		return row ? toInsight(row) : null
	}

	async upsert(insight: Omit<ProductInsight, "updated_at">): Promise<ProductInsight> {
		const values = {
			product_id: insight.product_id,
			verdict: insight.verdict,
			seasonal_factor: insight.seasonal_factor,
			identity: insight.identity,
			rationale: insight.rationale,
			critique: insight.critique,
			sources: insight.sources,
			grounded: insight.grounded,
			context_snapshot: insight.context_snapshot,
			model: insight.model,
		}

		const [row] = await db
			.insert(productInsights)
			.values(values)
			.onConflictDoUpdate({
				target: productInsights.product_id,
				set: { ...values, updated_at: new Date() },
			})
			.returning()

		return toInsight(row)
	}
}

function toInsight(row: typeof productInsights.$inferSelect): ProductInsight {
	return {
		product_id: row.product_id,
		verdict: row.verdict,
		seasonal_factor: row.seasonal_factor,
		identity: row.identity,
		rationale: row.rationale,
		critique: row.critique,
		sources: row.sources,
		grounded: row.grounded,
		context_snapshot: row.context_snapshot,
		model: row.model,
		updated_at: row.updated_at,
	}
}
