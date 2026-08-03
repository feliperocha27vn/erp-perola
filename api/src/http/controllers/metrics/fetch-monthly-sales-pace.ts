import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { makeFetchMonthlySalesPaceMetricsUseCase } from "../../../factories/sales/make-fetch-monthly-sales-pace-metrics-use-case.js"

const monthlySalesPacePointSchema = z.object({
	day: z.number().int(),
	current_month_cents: z.number().int().nullable(),
	last_month_cents: z.number().int().nullable(),
})

export const fetchMonthlySalesPace: FastifyPluginAsyncZod = async (app) => {
	app.get(
		"/dashboard/monthly-sales-pace",
		{
			schema: {
				operationId: "getDashboardMonthlySalesPace",
				description:
					"Retorna faturamento acumulado por dia do mes, comparando o mes atual com o mes passado",
				tags: ["dashboard"],
				response: {
					200: z.object({
						items: z.array(monthlySalesPacePointSchema),
						current_month_total_cents: z.number().int(),
						last_month_total_cents: z.number().int(),
					}),
				},
			},
		},
		async (_, reply) => {
			const fetchMonthlySalesPaceMetricsUseCase =
				makeFetchMonthlySalesPaceMetricsUseCase()

			const result = await fetchMonthlySalesPaceMetricsUseCase.execute()

			return reply.send(result)
		},
	)
}
