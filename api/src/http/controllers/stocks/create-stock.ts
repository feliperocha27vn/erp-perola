import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { ProductNotFoundError } from "../../../errors/product-not-found-error.js"
import { makeCreateStockUseCase } from "../../../factories/stocks/make-create-stock-use-case.js"

const stockSchema = z.object({
	id: z.string().uuid(),
	product_id: z.string().uuid(),
	title: z.string(),
	qtde: z.number().int(),
	full: z.boolean(),
	marketplace: z.enum(["mercado_livre", "amazon", "shopee"]).nullable(),
	store_id: z.string().uuid().nullable(),
	created_at: z.date(),
	updated_at: z.date(),
})

export const createStock: FastifyPluginAsyncZod = async (app) => {
	app.post(
		"/products/:productId/stocks",
		{
			schema: {
				operationId: "postProductsProductIdStocks",
				description: "Cria um estoque para um produto",
				tags: ["stocks"],
				params: z.object({
					productId: z.string().uuid(),
				}),
				body: z.object({
					title: z.string().min(1),
					qtde: z.number().int().min(0),
					full: z.boolean(),
					marketplace: z
						.enum(["mercado_livre", "amazon", "shopee"])
						.nullable()
						.optional(),
					store_id: z.string().uuid().nullable().optional(),
				}),
				response: {
					201: z.object({ stock: stockSchema }),
					404: z.object({ error: z.string() }),
				},
			},
		},
		async (req, reply) => {
			try {
				const createStockUseCase = makeCreateStockUseCase()
				const result = await createStockUseCase.execute({
					productId: req.params.productId,
					title: req.body.title,
					qtde: req.body.qtde,
					full: req.body.full,
					marketplace: req.body.marketplace,
					storeId: req.body.store_id,
				})

				return reply.status(201).send(result)
			} catch (error) {
				if (error instanceof ProductNotFoundError) {
					return reply.status(404).send({ error: error.message })
				}

				throw error
			}
		},
	)
}
