import { GoogleGenAI } from "@google/genai"
import z from "zod"
import { env } from "../../env.js"
import { GeminiAnalysisError } from "../../errors/gemini-analysis-error.js"
import type {
	FbaAnalysisItemBase,
	FbaGeminiRecommendation,
} from "./fba-types.js"

const geminiRecommendationSchema = z.object({
	sku: z.string(),
	recommended_send_quantity: z.number().int(),
	keep_in_physical_stock: z.number().int(),
	confidence: z.enum(["high", "medium", "low"]),
	decision_tags: z.array(z.string()),
	reason: z.string().min(1),
})

const geminiResponseSchema = z.object({
	items: z.array(geminiRecommendationSchema),
})

const GEMINI_MODEL = "gemini-2.5-flash"
const DEFAULT_MAX_ATTEMPTS = 3
const DEFAULT_RETRY_DELAY_MS = 750

function buildFbaPrompt(items: FbaAnalysisItemBase[]) {
	return [
		"<role>",
		"Voce e um analista senior de reposicao para Amazon FBA.",
		"</role>",
		"",
		"<constraints>",
		"- Objetivo principal: maximizar vendas sem recomendar envio acima do estoque fisico.",
		"- Priorize unidades vendidas em 90 dias e taxa de conversao.",
		"- Cobertura base de referencia: 60 dias.",
		"- Se a amostra for baixa, reduza confianca e agressividade.",
		"- O campo reason deve ter no maximo 2 frases curtas.",
		"- So recomende 0 quando houver motivo claro.",
		"</constraints>",
		"",
		"<heuristics>",
		"- Alta conversao + vendas consistentes + estoque suficiente => recomendar proximo ao baseline.",
		"- Baixa conversao => reduzir agressividade.",
		"- Estoque fisico baixo => preservar parte do estoque fora do FBA.",
		"- low_sales_sample => confidence baixa e abordagem cautelosa.",
		"</heuristics>",
		"",
		"<examples>",
		JSON.stringify(
			[
				{
					input: {
						sku: "SKU-A",
						physical_stock: 20,
						units_sold_90d: 18,
						conversion_rate: 3.1,
						base_target_units: 12,
						conservative_send_cap: 12,
					},
					output: {
						sku: "SKU-A",
						recommended_send_quantity: 10,
						keep_in_physical_stock: 10,
						confidence: "high",
						decision_tags: ["high_conversion", "steady_sales"],
						reason:
							"Bom giro e conversao forte nos ultimos 90 dias. O envio recomendado maximiza cobertura no FBA sem zerar o estoque fisico.",
					},
				},
				{
					input: {
						sku: "SKU-B",
						physical_stock: 4,
						units_sold_90d: 2,
						conversion_rate: 0.3,
						base_target_units: 2,
						conservative_send_cap: 2,
					},
					output: {
						sku: "SKU-B",
						recommended_send_quantity: 1,
						keep_in_physical_stock: 3,
						confidence: "low",
						decision_tags: [
							"low_sales_sample",
							"low_conversion",
							"preserve_stock",
						],
						reason:
							"A amostra de vendas e pequena e a conversao esta fraca. O envio fica reduzido para preservar estoque fisico.",
					},
				},
			],
			null,
			2,
		),
		"</examples>",
		"",
		"<items>",
		JSON.stringify(items),
		"</items>",
		"",
		"<task>",
		"Analise cada item e retorne somente JSON valido no schema solicitado.",
		"</task>",
	].join("\n")
}

type GeminiLikeClient = {
	models: {
		generateContent: (input: {
			model: string
			contents: string
			config: {
				responseMimeType: string
				responseJsonSchema: unknown
			}
		}) => Promise<{ text?: string }>
	}
}

type FbaGeminiClientOptions = {
	maxAttempts?: number
	retryDelayMs?: number
	sleep?: (ms: number) => Promise<void>
}

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

function shouldRetryGeminiError(error: unknown) {
	if (!(error instanceof Error)) {
		return false
	}

	const status = "status" in error ? error.status : undefined
	return status === 429 || status === 500 || status === 503 || status === 504
}

export class FbaGeminiClient {
	constructor(
		private ai: GeminiLikeClient = new GoogleGenAI({
			apiKey: env.GEMINI_API_KEY,
		}),
		private apiKey = env.GEMINI_API_KEY,
		private options: FbaGeminiClientOptions = {},
	) {}

	async recommend(
		items: FbaAnalysisItemBase[],
	): Promise<FbaGeminiRecommendation[]> {
		if (!this.apiKey) {
			throw new GeminiAnalysisError("GEMINI_API_KEY nao configurada.")
		}

		if (items.length === 0) {
			return []
		}

		const prompt = buildFbaPrompt(items)
		const maxAttempts = this.options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS
		const retryDelayMs = this.options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS
		const wait = this.options.sleep ?? sleep

		let response: { text?: string } | undefined
		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			try {
				response = await this.ai.models.generateContent({
					model: GEMINI_MODEL,
					contents: prompt,
					config: {
						responseMimeType: "application/json",
						responseJsonSchema: {
							type: "object",
							properties: {
								items: {
									type: "array",
									items: {
										type: "object",
										properties: {
											sku: { type: "string" },
											recommended_send_quantity: { type: "integer" },
											keep_in_physical_stock: { type: "integer" },
											confidence: {
												type: "string",
												enum: ["high", "medium", "low"],
											},
											decision_tags: {
												type: "array",
												items: { type: "string" },
											},
											reason: { type: "string" },
										},
										required: [
											"sku",
											"recommended_send_quantity",
											"keep_in_physical_stock",
											"confidence",
											"decision_tags",
											"reason",
										],
									},
								},
							},
							required: ["items"],
						},
					},
				})
				break
			} catch (error) {
				if (!shouldRetryGeminiError(error) || attempt === maxAttempts) {
					throw error
				}

				await wait(retryDelayMs)
			}
		}

		if (!response?.text) {
			throw new GeminiAnalysisError("Gemini retornou resposta vazia.")
		}

		let parsedJson: unknown
		try {
			parsedJson = JSON.parse(response.text)
		} catch {
			throw new GeminiAnalysisError("Gemini retornou JSON invalido.")
		}

		const parsed = geminiResponseSchema.safeParse(parsedJson)
		if (!parsed.success) {
			throw new GeminiAnalysisError("Gemini retornou estrutura inesperada.")
		}

		return parsed.data.items
	}
}
