import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { ShipmentAccountNotFoundError } from "../../../errors/shipment-account-not-found-error.js"
import { makeDeleteShipmentAccountUseCase } from "../../../factories/shipment-accounts/make-delete-shipment-account-use-case.js"

export const deleteShipmentAccount: FastifyPluginAsyncZod = async (app) => {
	app.delete(
		"/shipment-accounts/:id",
		{
			schema: {
				operationId: "deleteShipmentAccountsById",
				tags: ["shipment-accounts"],
				params: z.object({ id: z.string().uuid() }),
				response: {
					204: z.undefined(),
					404: z.object({ error: z.string() }),
				},
			},
		},
		async (req, reply) => {
			try {
				const useCase = makeDeleteShipmentAccountUseCase()
				await useCase.execute({ id: req.params.id })
				return reply.status(204).send()
			} catch (error) {
				if (error instanceof ShipmentAccountNotFoundError) {
					return reply.status(404).send({ error: error.message })
				}
				throw error
			}
		},
	)
}
