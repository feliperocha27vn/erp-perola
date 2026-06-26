import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { InsufficientStockError } from "../../../errors/insufficient-stock-error.js"
import { ShipmentAlreadyConfirmedError } from "../../../errors/shipment-already-confirmed-error.js"
import { ShipmentNotFoundError } from "../../../errors/shipment-not-found-error.js"
import { makeConfirmShipmentUseCase } from "../../../factories/shipments/make-confirm-shipment-use-case.js"

export const confirmShipment: FastifyPluginAsyncZod = async (app) => {
	app.post(
		"/shipments/:id/confirm",
		{
			schema: {
				operationId: "postShipmentsByIdConfirm",
				tags: ["shipments"],
				params: z.object({ id: z.string().uuid() }),
				response: {
					204: z.undefined(),
					404: z.object({ error: z.string() }),
					409: z.object({ error: z.string() }),
					422: z.object({ error: z.string() }),
				},
			},
		},
		async (req, reply) => {
			try {
				const useCase = makeConfirmShipmentUseCase()
				await useCase.execute({ shipmentId: req.params.id })
				return reply.status(204).send()
			} catch (error) {
				if (error instanceof ShipmentNotFoundError) {
					return reply.status(404).send({ error: error.message })
				}
				if (error instanceof ShipmentAlreadyConfirmedError) {
					return reply.status(409).send({ error: error.message })
				}
				if (error instanceof InsufficientStockError) {
					return reply.status(422).send({ error: error.message })
				}
				throw error
			}
		},
	)
}
