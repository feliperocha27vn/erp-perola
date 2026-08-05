import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { InvalidShipmentTransitionError } from "../../../errors/invalid-shipment-transition-error.js"
import { ShipmentNotFoundError } from "../../../errors/shipment-not-found-error.js"
import { makeReceiveShipmentUseCase } from "../../../factories/shipments/make-receive-shipment-use-case.js"

export const receiveShipment: FastifyPluginAsyncZod = async (app) => {
	app.post(
		"/shipments/:id/receive",
		{
			schema: {
				operationId: "postShipmentsByIdReceive",
				description:
					"Confirma a entrada no centro de distribuição: credita o estoque full de destino",
				tags: ["shipments"],
				params: z.object({ id: z.string().uuid() }),
				response: {
					204: z.undefined(),
					404: z.object({ error: z.string() }),
					409: z.object({ error: z.string() }),
				},
			},
		},
		async (req, reply) => {
			try {
				const useCase = makeReceiveShipmentUseCase()
				await useCase.execute({ shipmentId: req.params.id })
				return reply.status(204).send()
			} catch (error) {
				if (error instanceof ShipmentNotFoundError) {
					return reply.status(404).send({ error: error.message })
				}
				if (error instanceof InvalidShipmentTransitionError) {
					return reply.status(409).send({ error: error.message })
				}
				throw error
			}
		},
	)
}
