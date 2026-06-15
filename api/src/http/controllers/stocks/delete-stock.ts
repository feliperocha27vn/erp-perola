import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { StockNotFoundError } from "../../../errors/stock-not-found-error.js"
import { makeDeleteStockUseCase } from "../../../factories/stocks/make-delete-stock-use-case.js"

export const deleteStock: FastifyPluginAsyncZod = async (app) => {
	app.delete(
		"/stocks/:stockId",
		{
			schema: {
				operationId: "deleteStocksStockId",
				description: "Exclui um estoque",
				tags: ["stocks"],
				params: z.object({
					stockId: z.string().uuid(),
				}),
				response: {
					204: z.null(),
					404: z.object({ error: z.string() }),
				},
			},
		},
		async (req, reply) => {
			try {
				const deleteStockUseCase = makeDeleteStockUseCase()
				await deleteStockUseCase.execute({ stockId: req.params.stockId })

				return reply.status(204).send(null)
			} catch (error) {
				if (error instanceof StockNotFoundError) {
					return reply.status(404).send({ error: "Estoque não encontrado" })
				}

				throw error
			}
		},
	)
}
