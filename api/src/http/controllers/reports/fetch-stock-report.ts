import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import { z } from "zod"
import { makeFetchStockReportUseCase } from "../../../factories/reports/make-fetch-stock-report-use-case.js"

const stockEntrySchema = z.object({
	id: z.string().uuid(),
	title: z.string(),
	qtde: z.number().int(),
})

const stockReportRowSchema = z.object({
	productId: z.string().uuid(),
	sku: z.string(),
	stocks: z.array(stockEntrySchema),
	total: z.number().int(),
})

export const fetchStockReport: FastifyPluginAsyncZod = async (app) => {
	app.get(
		"/reports/stock-by-brand",
		{
			schema: {
				operationId: "getReportsStockByBrand",
				tags: ["reports"],
				description:
					"Retorna distribuição de estoque por produto de uma marca. Use brandId para uma marca específica ou noBrand=true para produtos sem marca.",
				querystring: z
					.object({
						brandId: z.string().uuid().optional(),
						noBrand: z
							.string()
							.transform((v) => v === "true")
							.optional(),
					})
					.refine((q) => q.brandId !== undefined || q.noBrand === true, {
						message: "Informe brandId ou noBrand=true",
					}),
				response: {
					200: z.object({
						products: z.array(stockReportRowSchema),
					}),
				},
			},
		},
		async (req, reply) => {
			const brandId = req.query.noBrand ? null : (req.query.brandId ?? null)
			const useCase = makeFetchStockReportUseCase()
			const result = await useCase.execute({ brandId })
			return reply.send(result)
		},
	)
}
