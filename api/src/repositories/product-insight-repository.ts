export interface ProductInsight {
	product_id: string
	verdict: "antecipar" | "manter" | "segurar"
	/** Centesimos: 140 = 1,40x. */
	seasonal_factor: number
	identity: string
	rationale: string
	critique: string | null
	sources: { title: string; url: string }[]
	/** false quando o parecer saiu sem busca na web. */
	grounded: boolean
	/** Numeros da linha quando a analise foi feita, para a tela saber se envelheceu. */
	context_snapshot: {
		demand_rate_per_day: number
		days_of_autonomy: number | null
		needed_quantity: number
	}
	model: string
	updated_at: Date
}

export interface ProductInsightRepository {
	findByProductId(productId: string): Promise<ProductInsight | null>
	/** Uma analise por produto: reanalisar sobrescreve a anterior. */
	upsert(insight: Omit<ProductInsight, "updated_at">): Promise<ProductInsight>
}
