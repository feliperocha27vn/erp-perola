import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { makeFetchLastMonthSalesMetricsUseCase } from "../../../factories/sales/make-fetch-last-month-sales-metrics-use-case.js"

export const fetchLastMonthSales: FastifyPluginAsyncZod = async (app) => {
	app.get(
		"/metrics/last-month-sales",
		{
			schema: {
				operationId: "getMetricsLastMonthSales",
				description: "Retorna o total de vendas do mes passado em centavos",
				tags: ["metrics"],
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
