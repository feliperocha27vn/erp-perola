import type { ProductRepository } from "../../repositories/product-repository.js"
import { calculateFbaBaseRecommendation } from "./fba-calculations.js"
import { parseFbaBusinessReportCsv } from "./fba-csv-parser.js"
import type {
	AnalyzeFbaCsvUseCaseRequest,
	AnalyzeFbaCsvUseCaseResponse,
	FbaAnalysisItemBase,
	FbaGeminiRecommendation,
	FbaPendingItem,
} from "./fba-types.js"
import { FbaGeminiClient } from "./fba-gemini-client.js"

const TARGET_DAYS = 60

function fallbackReason(item: FbaAnalysisItemBase): string {
	if (item.max_sendable_units <= 0) {
		return "Sem estoque fisico disponivel para envio ao FBA no momento."
	}

	return "Recomendacao calculada por fallback deterministico com base em vendas de 90 dias, conversao e estoque fisico."
}

function toSafeRecommendation(
	item: FbaAnalysisItemBase,
	recommendation: FbaGeminiRecommendation | undefined,
) {
	if (!recommendation) {
		return {
			recommended_send_quantity: item.conservative_send_cap,
			confidence: "low" as const,
			decision_tags: ["fallback_deterministic"],
			analysis_source: "fallback" as const,
			reason: fallbackReason(item),
		}
	}

	const recommendedRaw = Number.isFinite(recommendation.recommended_send_quantity)
		? Math.floor(recommendation.recommended_send_quantity)
		: item.conservative_send_cap

	const clamped = Math.max(0, Math.min(recommendedRaw, item.max_sendable_units))
	const reason = recommendation.reason.trim().length > 0 ? recommendation.reason.trim() : fallbackReason(item)

	return {
		recommended_send_quantity: clamped,
		confidence: recommendation.confidence,
		decision_tags: recommendation.decision_tags,
		analysis_source: "gemini" as const,
		reason,
	}
}

export class AnalyzeFbaCsvUseCase {
	constructor(
		private productRepository: ProductRepository,
		private geminiClient: Pick<FbaGeminiClient, "recommend"> = new FbaGeminiClient(),
		private logger: Pick<Console, "warn"> = console,
	) {}

	async execute({ csvContent }: AnalyzeFbaCsvUseCaseRequest): Promise<AnalyzeFbaCsvUseCaseResponse> {
		const parsed = parseFbaBusinessReportCsv(csvContent)
		const allSkus = [...new Set(parsed.rows.map((row) => row.sku))]
		const products = await this.productRepository.getBySkus(allSkus)
		const productsBySku = new Map(products.map((product) => [product.sku, product]))

		const pending_items: FbaPendingItem[] = [...parsed.pending_items]
		const baseItems: FbaAnalysisItemBase[] = []

		for (const row of parsed.rows) {
			const product = productsBySku.get(row.sku)
			if (!product) {
				pending_items.push({
					sku: row.sku,
					title: row.title,
					reason: "sku_not_found",
					detail: "SKU nao encontrado no sistema.",
				})
				continue
			}

			const physicalStock = product.stocks.find((stock) => stock.title === "Físico")
			if (!physicalStock) {
				pending_items.push({
					sku: row.sku,
					title: row.title,
					reason: "physical_stock_not_found",
					detail: "Produto sem estoque com titulo 'Físico'.",
				})
				continue
			}

			const calculated = calculateFbaBaseRecommendation({
				physical_stock: physicalStock.qtde,
				units_sold_90d: row.units_sold_90d,
				conversion_rate: row.conversion_rate,
				target_days: TARGET_DAYS,
			})

			baseItems.push({
				sku: row.sku,
				asin: row.asin,
				title: row.title,
				physical_stock: physicalStock.qtde,
				units_sold_90d: row.units_sold_90d,
				conversion_rate: row.conversion_rate,
				sessions_total: row.sessions_total,
				page_views_total: row.page_views_total,
				daily_units: calculated.daily_units,
				base_target_units: calculated.base_target_units,
				max_sendable_units: calculated.max_sendable_units,
				conservative_send_cap: calculated.conservative_send_cap,
				risk_flags: calculated.risk_flags,
			})
		}

		let recommendations: FbaGeminiRecommendation[] = []
		try {
			recommendations = await this.geminiClient.recommend(baseItems)
		} catch (error) {
			this.logger.warn("Gemini recommendation failed; using fallback.", error)
			recommendations = []
		}

		const recommendationsBySku = new Map(recommendations.map((item) => [item.sku, item]))
		const analysisSource = recommendations.length > 0 ? "gemini" : "fallback"

		const items = baseItems.map((item) => {
			const safe = toSafeRecommendation(item, recommendationsBySku.get(item.sku))

			return {
				sku: item.sku,
				asin: item.asin,
				title: item.title,
				physical_stock: item.physical_stock,
				units_sold_90d: item.units_sold_90d,
				conversion_rate: item.conversion_rate,
				recommended_send_quantity: safe.recommended_send_quantity,
				confidence: safe.confidence,
				decision_tags: safe.decision_tags,
				analysis_source: safe.analysis_source,
				reason: safe.reason,
			}
		})

		const total_recommended_units = items.reduce((acc, item) => acc + item.recommended_send_quantity, 0)
		const top =
			items.length > 0
				? [...items].sort((a, b) => b.recommended_send_quantity - a.recommended_send_quantity)[0]
				: null

		return {
			summary: {
				total_rows: parsed.rows.length + parsed.pending_items.length,
				analyzed_items: items.length,
				pending_items: pending_items.length,
				total_recommended_units,
				top_sku_by_recommendation: top?.sku ?? null,
				analysis_source: analysisSource,
			},
			items,
			pending_items,
		}
	}
}
