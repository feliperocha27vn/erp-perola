import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { makeFetchLast15DaysSalesMetricsUseCase } from "../../../factories/sales/make-fetch-last-15-days-sales-metrics-use-case.js"

const dailySalesPointSchema = z.object({
	date: z.string(),
	total_cents: z.number().int(),
})

export const fetchLast15DaysSales: FastifyPluginAsyncZod = async (app) => {
	app.get(
		"/dashboard/last-15-days-sales",
		{
			schema: {
				operationId: "getDashboardLast15DaysSales",
				description: "Retorna faturamento diario dos ultimos 15 dias com media diaria",
				tags: ["dashboard"],
				response: {
					200: z.object({
						items: z.array(dailySalesPointSchema),
						daily_average_cents: z.number().int(),
					}),
				},
			},
		},
		async (_, reply) => {
			const fetchLast15DaysSalesMetricsUseCase =
				makeFetchLast15DaysSalesMetricsUseCase()

			const result = await fetchLast15DaysSalesMetricsUseCase.execute()

			return reply.send(result)
		},
	)
}
