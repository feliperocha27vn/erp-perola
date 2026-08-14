import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { AiAnalystNotConfiguredError } from "../../../errors/ai-analyst-not-configured-error.js"
import { GeminiAnalysisError } from "../../../errors/gemini-analysis-error.js"
import { makeAnalyzeFullReplenishmentSuggestionUseCase } from "../../../factories/reports/make-analyze-full-replenishment-suggestion-use-case.js"
import { ProductNotInReplenishmentAlertsError } from "../../../use-cases/reports/analyze-full-replenishment-suggestion.js"

const sourceSchema = z.object({
	stock_id: z.string(),
	stock_title: z.string(),
	quantity: z.number(),
})

export const analyzeFullReplenishmentSuggestion: FastifyPluginAsyncZod = async (app) => {
	app.post(
		"/reports/full-replenishment-alerts/analyze",
		{
			schema: {
				operationId: "postReportsFullReplenishmentAlertsAnalyze",
				description:
					"Leitura crítica de uma linha do Abastecimento do Full: identifica o produto, pesa o calendário comercial e propõe um fator sazonal. A quantidade da regra continua sendo o padrão.",
				tags: ["reports"],
				body: z.object({
					product_id: z.string().uuid(),
					stock_id: z.string().uuid(),
					/** Ignora o cache e paga uma chamada nova. */
					refresh: z.boolean().default(false),
				}),
				response: {
					200: z.object({
						verdict: z.enum(["antecipar", "manter", "segurar"]),
						/** Centésimos: 140 = 1,40x. */
						seasonal_factor: z.number(),
						identity: z.string(),
						rationale: z.string(),
						critique: z.string().nullable(),
						sources: z.array(z.object({ title: z.string(), url: z.string() })),
						/** false quando a busca na web não estava disponível. */
						grounded: z.boolean(),
						model: z.string(),
						analyzed_at: z.string(),
						suggested_quantity: z.number(),
						adjusted_quantity: z.number(),
						adjusted_sources: z.array(sourceSchema),
						adjustment_capped: z.boolean(),
						stale: z.boolean(),
						from_cache: z.boolean(),
					}),
					404: z.object({ error: z.string() }),
					501: z.object({ error: z.string() }),
					502: z.object({ error: z.string() }),
				},
			},
		},
		async (req, reply) => {
			try {
				const useCase = makeAnalyzeFullReplenishmentSuggestionUseCase()
				const result = await useCase.execute(req.body)

				return reply.status(200).send({
					verdict: result.insight.verdict,
					seasonal_factor: result.insight.seasonal_factor,
					identity: result.insight.identity,
					rationale: result.insight.rationale,
					critique: result.insight.critique,
					sources: result.insight.sources,
					grounded: result.insight.grounded,
					model: result.insight.model,
					analyzed_at: result.insight.updated_at.toISOString(),
					suggested_quantity: result.suggested_quantity,
					adjusted_quantity: result.adjusted_quantity,
					adjusted_sources: result.adjusted_sources,
					adjustment_capped: result.adjustment_capped,
					stale: result.stale,
					from_cache: result.from_cache,
				})
			} catch (error) {
				if (error instanceof AiAnalystNotConfiguredError) {
					return reply.status(501).send({ error: error.message })
				}
				if (error instanceof ProductNotInReplenishmentAlertsError) {
					return reply.status(404).send({ error: error.message })
				}
				// Falha do provedor externo nao e erro do ERP: a tela cai de volta na
				// quantidade da regra, que nunca dependeu da analise.
				if (error instanceof GeminiAnalysisError) {
					return reply.status(502).send({ error: error.message })
				}
				throw error
			}
		},
	)
}
