export interface FbaCsvRow {
	asin: string
	sku: string
	title: string
	sessions_total: number
	page_views_total: number
	units_sold_90d: number
	conversion_rate: number
	revenue_cents_90d: number
}

export interface FbaPendingItem {
	sku: string
	title: string
	reason: string
	detail: string
}

export interface FbaCalculationInput {
	physical_stock: number
	units_sold_90d: number
	conversion_rate: number
	target_days: number
}

export interface FbaCalculationOutput {
	daily_units: number
	base_target_units: number
	max_sendable_units: number
	conservative_send_cap: number
	risk_flags: string[]
}

export interface FbaAnalysisItemBase {
	sku: string
	asin: string
	title: string
	physical_stock: number
	units_sold_90d: number
	conversion_rate: number
	sessions_total: number
	page_views_total: number
	daily_units: number
	base_target_units: number
	max_sendable_units: number
	conservative_send_cap: number
	risk_flags: string[]
}

export interface FbaGeminiRecommendation {
	sku: string
	recommended_send_quantity: number
	keep_in_physical_stock: number
	confidence: "high" | "medium" | "low"
	decision_tags: string[]
	reason: string
}

export interface AnalyzeFbaCsvUseCaseRequest {
	csvContent: string
}

export interface AnalyzeFbaCsvItemResponse {
	sku: string
	asin: string
	title: string
	physical_stock: number
	units_sold_90d: number
	conversion_rate: number
	recommended_send_quantity: number
	confidence: "high" | "medium" | "low"
	decision_tags: string[]
	analysis_source: "gemini" | "fallback"
	reason: string
}

export interface AnalyzeFbaCsvUseCaseResponse {
	summary: {
		total_rows: number
		analyzed_items: number
		pending_items: number
		total_recommended_units: number
		top_sku_by_recommendation: string | null
		analysis_source: "gemini" | "fallback"
	}
	items: AnalyzeFbaCsvItemResponse[]
	pending_items: FbaPendingItem[]
}
