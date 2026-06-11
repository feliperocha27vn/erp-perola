import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { makeFetchCurrentMonthSalesMetricsUseCase } from "../../../factories/sales/make-fetch-current-month-sales-metrics-use-case.js"

const monthlySalesPointSchema = z.object({
	date: z.string(),
	total_cents: z.number().int(),
})

export const fetchMonthlySales: FastifyPluginAsyncZod = async (app) => {
	app.get(
		"/dashboard/monthly-sales",
		{
			schema: {
				operationId: "getDashboardMonthlySales",
				description: "Retorna faturamento diario do mes atual com media diaria",
				tags: ["dashboard"],
				response: {
					200: z.object({
						items: z.array(monthlySalesPointSchema),
						daily_average_cents: z.number().int(),
					}),
				},
			},
		},
		async (_, reply) => {
			const fetchCurrentMonthSalesMetricsUseCase =
				makeFetchCurrentMonthSalesMetricsUseCase()

			const result = await fetchCurrentMonthSalesMetricsUseCase.execute()

			return reply.send(result)
		},
	)
}
