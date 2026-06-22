import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import { z } from "zod"
import { makeFetchStockEntriesByProductUseCase } from "../../../factories/stock-entries/make-fetch-stock-entries-by-product-use-case.js"

const stockEntryWithContextSchema = z.object({
	id: z.string().uuid(),
	stock_id: z.string().uuid(),
	quantity: z.number().int(),
	notes: z.string().nullable(),
	created_at: z.date(),
	stock_title: z.string(),
	product_id: z.string().uuid(),
	product_sku: z.string(),
	brand_id: z.string().uuid().nullable(),
	brand_name: z.string().nullable(),
})

export const fetchStockEntriesByProduct: FastifyPluginAsyncZod = async (app) => {
	app.get(
		"/products/:productId/stock-entries",
		{
			schema: {
				operationId: "getProductsProductIdStockEntries",
				description: "Retorna histórico de entradas de estoque de um produto",
				tags: ["stock-entries"],
				params: z.object({
					productId: z.string().uuid(),
				}),
				response: {
					200: z.object({ entries: z.array(stockEntryWithContextSchema) }),
				},
			},
		},
		async (req, reply) => {
			const useCase = makeFetchStockEntriesByProductUseCase()
			const result = await useCase.execute({ productId: req.params.productId })
			return reply.send(result)
		},
	)
}
