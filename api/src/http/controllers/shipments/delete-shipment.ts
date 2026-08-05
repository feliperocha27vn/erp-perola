import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { ShipmentNotEditableError } from "../../../errors/shipment-not-editable-error.js"
import { ShipmentNotFoundError } from "../../../errors/shipment-not-found-error.js"
import { makeDeleteShipmentUseCase } from "../../../factories/shipments/make-delete-shipment-use-case.js"

export const deleteShipment: FastifyPluginAsyncZod = async (app) => {
	app.delete(
		"/shipments/:id",
		{
			schema: {
				operationId: "deleteShipmentsById",
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
				const useCase = makeDeleteShipmentUseCase()
				await useCase.execute({ shipmentId: req.params.id })
				return reply.status(204).send()
			} catch (error) {
				if (error instanceof ShipmentNotFoundError) {
					return reply.status(404).send({ error: error.message })
				}
				if (error instanceof ShipmentNotEditableError) {
					return reply.status(409).send({ error: error.message })
				}
				throw error
			}
		},
	)
}
