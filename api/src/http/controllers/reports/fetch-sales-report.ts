import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import { z } from "zod"
import { makeFetchSalesReportUseCase } from "../../../factories/reports/make-fetch-sales-report-use-case.js"

const salesReportRowSchema = z.object({
	sale_date: z.date(),
	sku: z.string(),
	store_name: z.string().nullable(),
	channel: z.string(),
	stock_title: z.string(),
	quantity: z.number().int(),
	sale_price: z.number().int(),
	total_price: z.number().int(),
})

export const fetchSalesReport: FastifyPluginAsyncZod = async (app) => {
	app.get(
		"/reports/sales",
		{
			schema: {
				operationId: "getReportsSales",
				tags: ["reports"],
				description:
					"Retorna relatório de vendas por período, sem paginação, com SKU, loja, canal, depósito e valor.",
				querystring: z.object({
					startDate: z.string().datetime(),
					endDate: z.string().datetime(),
				}),
				response: {
					200: z.object({
						items: z.array(salesReportRowSchema),
					}),
				},
			},
		},
		async (req, reply) => {
			const useCase = makeFetchSalesReportUseCase()
			const result = await useCase.execute({
				startDate: new Date(req.query.startDate),
				endDate: new Date(req.query.endDate),
			})
			return reply.send(result)
		},
	)
}
