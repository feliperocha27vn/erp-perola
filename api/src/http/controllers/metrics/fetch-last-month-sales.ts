import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { makeFetchLastMonthSalesMetricsUseCase } from "../../../factories/sales/make-fetch-last-month-sales-metrics-use-case.js"

export const fetchLastMonthSales: FastifyPluginAsyncZod = async (app) => {
	app.get(
		"/dashboard/last-month-sales",
		{
			schema: {
				operationId: "getDashboardLastMonthSales",
				description: "Retorna o total de vendas do mes passado em centavos",
				tags: ["dashboard"],
				response: {
					200: z.object({
						total_cents: z.number().int(),
					}),
				},
			},
		},
		async (_, reply) => {
			const fetchLastMonthSalesMetricsUseCase =
				makeFetchLastMonthSalesMetricsUseCase()

			const result = await fetchLastMonthSalesMetricsUseCase.execute()

			return reply.send(result)
		},
	)
}
