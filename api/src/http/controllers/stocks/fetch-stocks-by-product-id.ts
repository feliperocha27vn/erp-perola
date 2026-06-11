import { ProductNotFoundError } from "../../../errors/product-not-found-error.js"
import { makeFetchStocksByProductIdUseCase } from "../../../factories/stocks/make-fetch-stocks-by-product-id-use-case.js"
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"

const stockSchema = z.object({
	id: z.string().uuid(),
	product_id: z.string().uuid(),
	title: z.string(),
	qtde: z.number().int(),
	full: z.boolean(),
	created_at: z.date(),
	updated_at: z.date(),
})

export const fetchStocksByProductId: FastifyPluginAsyncZod = async (app) => {
	app.get(
		"/products/:productId/stocks",
		{
			schema: {
				operationId: "getProductsProductIdStocks",
				description: "Lista os estoques de um produto",
				tags: ["stocks"],
				params: z.object({
					productId: z.string().uuid(),
				}),
				response: {
					200: z.object({ stocks: z.array(stockSchema) }),
					404: z.object({ error: z.string() }),
				},
			},
		},
		async (req, reply) => {
			try {
				const fetchStocksByProductIdUseCase = makeFetchStocksByProductIdUseCase()
				const result = await fetchStocksByProductIdUseCase.execute({
					productId: req.params.productId,
				})

				return reply.send(result)
			} catch (error) {
				if (error instanceof ProductNotFoundError) {
					return reply.status(404).send({ error: "Produto não encontrado" })
				}

				throw error
			}
		},
	)
}
