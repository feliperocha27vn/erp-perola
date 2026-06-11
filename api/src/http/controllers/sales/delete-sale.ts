import { SaleNotFoundError } from "../../../errors/sale-not-found-error.js"
import { makeDeleteSaleUseCase } from "../../../factories/sales/make-delete-sale-use-case.js"
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"

export const deleteSale: FastifyPluginAsyncZod = async (app) => {
	app.delete(
		"/sales/:id",
		{
			schema: {
				operationId: "deleteSalesId",
				description: "Exclui uma venda e devolve estoque",
				tags: ["sales"],
				params: z.object({
					id: z.string().uuid(),
				}),
				response: {
					204: z.null(),
					404: z.object({ error: z.string() }),
				},
			},
		},
		async (req, reply) => {
			try {
				const deleteSaleUseCase = makeDeleteSaleUseCase()
				await deleteSaleUseCase.execute({ id: req.params.id })

				return reply.status(204).send(null)
			} catch (error) {
				if (error instanceof SaleNotFoundError) {
					return reply.status(404).send({ error: error.message })
				}

				throw error
			}
		},
	)
}
