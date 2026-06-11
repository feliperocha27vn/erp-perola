import type { PostFbaAnalyzeMutationResponse } from '@/api/types/fbaController/PostFbaAnalyze'

export type FbaAnalysisResponse = PostFbaAnalyzeMutationResponse
export type FbaSummary = FbaAnalysisResponse['summary']
export type FbaResultItem = FbaAnalysisResponse['items'][number]
export type FbaPendingItem = FbaAnalysisResponse['pending_items'][number]

export type RecommendationChartItem = {
  sku: string
  recommended: number
  sold90d: number
  stock: number
}

export type AnalysisSourceLabel = 'Gemini' | 'Fallback'

export type ComparisonChartItem = {
  label: string
  value: number
}
