import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { makeFetchCurrentMonthSalesMetricsUseCase } from "../../../factories/sales/make-fetch-current-month-sales-metrics-use-case.js"

export const fetchCurrentMonthSales: FastifyPluginAsyncZod = async (app) => {
	app.get(
		"/dashboard/current-month-sales",
		{
			schema: {
				operationId: "getDashboardCurrentMonthSales",
				description: "Retorna o total de vendas do mes atual em centavos",
				tags: ["dashboard"],
				response: {
					200: z.object({
						total_cents: z.number().int(),
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
