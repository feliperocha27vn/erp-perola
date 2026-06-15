import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { makeFetchProductSalesDailyUseCase } from "../../../factories/products/make-fetch-product-sales-daily-use-case.js"

const dayEntrySchema = z.object({
	date: z.string(),
	units: z.number().int(),
})

const periodSchema = z.object({
	period: z.union([z.literal(15), z.literal(30), z.literal(60), z.literal(90)]),
	total_units: z.number().int(),
	days: z.array(dayEntrySchema),
})

const storeSchema = z.object({
	store_id: z.string().uuid().nullable(),
	store_name: z.string(),
	periods: z.array(periodSchema),
})

export const fetchProductSalesDaily: FastifyPluginAsyncZod = async (app) => {
	app.get(
		"/products/:id/sales-daily",
		{
			schema: {
				operationId: "getProductSalesDaily",
				description:
					"Retorna vendas diárias por loja e período para um produto",
				tags: ["products"],
				params: z.object({
					id: z.string().uuid(),
				}),
				response: {
					200: z.object({
						stores: z.array(storeSchema),
					}),
				},
			},
		},
		async (req, reply) => {
			const useCase = makeFetchProductSalesDailyUseCase()
			const result = await useCase.execute(req.params.id)
			return reply.send(result)
		},
	)
}
