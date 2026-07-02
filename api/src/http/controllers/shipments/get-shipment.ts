import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { ShipmentNotFoundError } from "../../../errors/shipment-not-found-error.js"
import { makeGetShipmentUseCase } from "../../../factories/shipments/make-get-shipment-use-case.js"

const itemSchema = z.object({
	id: z.string().uuid(),
	shipment_id: z.string().uuid(),
	product_id: z.string().uuid(),
	sku: z.string(),
	quantity: z.number(),
	source_stock_id: z.string().uuid(),
	source_stock_title: z.string(),
	destination_stock_id: z.string().uuid(),
	destination_stock_title: z.string(),
	created_at: z.date(),
})

const shipmentSchema = z.object({
	id: z.string().uuid(),
	account_id: z.string().uuid(),
	account_name: z.string(),
	date: z.date(),
	notes: z.string().nullable(),
	status: z.enum(["rascunho", "confirmado"]),
	items: z.array(itemSchema),
	created_at: z.date(),
	updated_at: z.date(),
})

export const getShipment: FastifyPluginAsyncZod = async (app) => {
	app.get(
		"/shipments/:id",
		{
			schema: {
				operationId: "getShipmentsById",
				tags: ["shipments"],
				params: z.object({ id: z.string().uuid() }),
				response: {
					200: z.object({ shipment: shipmentSchema }),
					404: z.object({ error: z.string() }),
				},
			},
		},
		async (req, reply) => {
			try {
				const useCase = makeGetShipmentUseCase()
				const result = await useCase.execute({ shipmentId: req.params.id })
				return reply.status(200).send(result)
			} catch (error) {
				if (error instanceof ShipmentNotFoundError) {
					return reply.status(404).send({ error: error.message })
				}
				throw error
			}
		},
	)
}
