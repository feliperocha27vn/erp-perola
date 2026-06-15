import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { StockNotFoundError } from "../../../errors/stock-not-found-error.js"
import { makeUpdateStockUseCase } from "../../../factories/stocks/make-update-stock-use-case.js"

const stockSchema = z.object({
	id: z.string().uuid(),
	product_id: z.string().uuid(),
	title: z.string(),
	qtde: z.number().int(),
	full: z.boolean(),
	created_at: z.date(),
	updated_at: z.date(),
})

export const updateStock: FastifyPluginAsyncZod = async (app) => {
	app.patch(
		"/stocks/:stockId",
		{
			schema: {
				operationId: "patchStocksStockId",
				description: "Atualiza um estoque",
				tags: ["stocks"],
				params: z.object({
					stockId: z.string().uuid(),
				}),
				body: z
					.object({
						title: z.string().min(1).optional(),
						qtde: z.number().int().min(0).optional(),
						full: z.boolean().optional(),
					})
					.refine((body) => Object.keys(body).length > 0),
				response: {
					200: z.object({ stock: stockSchema }),
					404: z.object({ error: z.string() }),
				},
			},
		},
		async (req, reply) => {
			try {
				const updateStockUseCase = makeUpdateStockUseCase()
				const result = await updateStockUseCase.execute({
					stockId: req.params.stockId,
					title: req.body.title,
					qtde: req.body.qtde,
					full: req.body.full,
				})

				return reply.send(result)
			} catch (error) {
				if (error instanceof StockNotFoundError) {
					return reply.status(404).send({ error: error.message })
				}

				throw error
			}
		},
	)
}
