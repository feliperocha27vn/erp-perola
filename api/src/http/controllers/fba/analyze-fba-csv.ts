import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { InvalidFbaCsvError } from "../../../errors/invalid-fba-csv-error.js"
import { makeAnalyzeFbaCsvUseCase } from "../../../factories/fba/make-analyze-fba-csv-use-case.js"

const itemSchema = z.object({
	sku: z.string(),
	asin: z.string(),
	title: z.string(),
	physical_stock: z.number().int(),
	units_sold_90d: z.number().int(),
	conversion_rate: z.number(),
	recommended_send_quantity: z.number().int(),
	confidence: z.enum(["high", "medium", "low"]),
	decision_tags: z.array(z.string()),
	analysis_source: z.enum(["gemini", "fallback"]),
	reason: z.string(),
})

const pendingItemSchema = z.object({
	sku: z.string(),
	title: z.string(),
	reason: z.string(),
	detail: z.string(),
})

export const analyzeFbaCsv: FastifyPluginAsyncZod = async (app) => {
	app.post(
		"/fba/analyze",
		{
			schema: {
				operationId: "postFbaAnalyze",
				description:
					"Analisa um CSV de 90 dias para recomendacao de envio ao Amazon FBA",
				tags: ["fba"],
				body: z.object({
					csv_content: z.string().min(1),
				}),
				response: {
					200: z.object({
						summary: z.object({
							total_rows: z.number().int(),
							analyzed_items: z.number().int(),
							pending_items: z.number().int(),
							total_recommended_units: z.number().int(),
							top_sku_by_recommendation: z.string().nullable(),
							analysis_source: z.enum(["gemini", "fallback"]),
						}),
						items: z.array(itemSchema),
						pending_items: z.array(pendingItemSchema),
					}),
					400: z.object({ error: z.string() }),
				},
			},
		},
		async (req, reply) => {
			try {
				const analyzeFbaCsvUseCase = makeAnalyzeFbaCsvUseCase()
				const result = await analyzeFbaCsvUseCase.execute({
					csvContent: req.body.csv_content,
				})

				return reply.send(result)
			} catch (error) {
				if (error instanceof InvalidFbaCsvError) {
					return reply.status(400).send({ error: error.message })
				}

				throw error
			}
		},
	)
}
