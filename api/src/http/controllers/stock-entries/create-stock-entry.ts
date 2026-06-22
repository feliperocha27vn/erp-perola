import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import { z } from "zod"
import { StockNotFoundError } from "../../../errors/stock-not-found-error.js"
import { makeCreateStockEntryUseCase } from "../../../factories/stock-entries/make-create-stock-entry-use-case.js"

export const createStockEntry: FastifyPluginAsyncZod = async (app) => {
	app.post(
		"/stocks/:stockId/entries",
		{
			schema: {
				operationId: "postStocksStockIdEntries",
				description: "Registra uma entrada de estoque e incrementa a quantidade atual",
				tags: ["stock-entries"],
				params: z.object({
					stockId: z.string().uuid(),
				}),
				body: z.object({
					quantity: z.number().int().min(1),
					notes: z.string().nullable().optional(),
				}),
				response: {
					201: z.object({
						entry: z.object({
							id: z.string().uuid(),
							stock_id: z.string().uuid(),
							quantity: z.number().int(),
							notes: z.string().nullable(),
							created_at: z.date(),
						}),
					}),
					404: z.object({ error: z.string() }),
				},
			},
		},
		async (req, reply) => {
			try {
				const useCase = makeCreateStockEntryUseCase()
				const result = await useCase.execute({
					stockId: req.params.stockId,
					quantity: req.body.quantity,
					notes: req.body.notes ?? null,
				})
				return reply.status(201).send(result)
			} catch (error) {
				if (error instanceof StockNotFoundError) {
					return reply.status(404).send({ error: error.message })
				}
				throw error
			}
		},
	)
}
