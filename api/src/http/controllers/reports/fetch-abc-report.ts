import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { makeFetchAbcReportUseCase } from "../../../factories/reports/make-fetch-abc-report-use-case.js"

const abcItemSchema = z.object({
	rank: z.number(),
	sku: z.string(),
	total_revenue: z.number(),
	qty_sales: z.number(),
	qty_units: z.number(),
	percentage: z.number(),
	cumulative_percentage: z.number(),
	class: z.enum(["A", "B", "C"]),
})

const abcStoreSchema = z.object({
	store_name: z.string(),
	total_revenue: z.number(),
	items: z.array(abcItemSchema),
})

export const fetchAbcReport: FastifyPluginAsyncZod = async (app) => {
	app.get(
		"/reports/abc",
		{
			schema: {
				operationId: "getReportsAbc",
				tags: ["reports"],
				querystring: z.object({
					startDate: z.string().datetime(),
					endDate: z.string().datetime(),
				}),
				response: {
					200: z.object({ stores: z.array(abcStoreSchema) }),
				},
			},
		},
		async (req, reply) => {
			const useCase = makeFetchAbcReportUseCase()
			const result = await useCase.execute({
				startDate: new Date(req.query.startDate),
				endDate: new Date(req.query.endDate),
			})
			return reply.status(200).send(result)
		},
	)
}
