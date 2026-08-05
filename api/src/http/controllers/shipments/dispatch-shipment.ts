import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { InsufficientStockError } from "../../../errors/insufficient-stock-error.js"
import { InvalidShipmentTransitionError } from "../../../errors/invalid-shipment-transition-error.js"
import { ShipmentNotFoundError } from "../../../errors/shipment-not-found-error.js"
import { makeDispatchShipmentUseCase } from "../../../factories/shipments/make-dispatch-shipment-use-case.js"

export const dispatchShipment: FastifyPluginAsyncZod = async (app) => {
	app.post(
		"/shipments/:id/dispatch",
		{
			schema: {
				operationId: "postShipmentsByIdDispatch",
				description: "Despacha o envio: debita o estoque de origem e marca como em trânsito",
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
				const useCase = makeDispatchShipmentUseCase()
				await useCase.execute({ shipmentId: req.params.id })
				return reply.status(204).send()
			} catch (error) {
				if (error instanceof ShipmentNotFoundError) {
					return reply.status(404).send({ error: error.message })
				}
				if (error instanceof InvalidShipmentTransitionError) {
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
