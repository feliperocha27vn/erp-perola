import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { ShipmentNotEditableError } from "../../../errors/shipment-not-editable-error.js"
import { ShipmentNotFoundError } from "../../../errors/shipment-not-found-error.js"
import { makeUpdateShipmentUseCase } from "../../../factories/shipments/make-update-shipment-use-case.js"

const itemSchema = z.object({
	id: z.string().uuid(),
	shipment_id: z.string().uuid(),
	product_id: z.string().uuid(),
	quantity: z.number(),
	source_stock_id: z.string().uuid(),
	destination_stock_id: z.string().uuid(),
	created_at: z.date(),
})

const shipmentSchema = z.object({
	id: z.string().uuid(),
	account_id: z.string().uuid(),
	account_name: z.string(),
	date: z.date(),
	notes: z.string().nullable(),
	status: z.enum(["rascunho", "em_transito", "recebido"]),
	items: z.array(itemSchema),
	created_at: z.date(),
	updated_at: z.date(),
})

const itemInputSchema = z.object({
	product_id: z.string().uuid(),
	quantity: z.number().int().positive(),
	source_stock_id: z.string().uuid(),
	destination_stock_id: z.string().uuid(),
})

export const updateShipment: FastifyPluginAsyncZod = async (app) => {
	app.put(
		"/shipments/:id",
		{
			schema: {
				operationId: "putShipmentsById",
				tags: ["shipments"],
				params: z.object({ id: z.string().uuid() }),
				body: z.object({
					account_id: z.string().uuid().optional(),
					date: z.string().datetime().optional(),
					notes: z.string().nullable().optional(),
					items: z.array(itemInputSchema).optional(),
				}),
				response: {
					200: z.object({ shipment: shipmentSchema }),
					404: z.object({ error: z.string() }),
					409: z.object({ error: z.string() }),
				},
			},
		},
		async (req, reply) => {
			try {
				const useCase = makeUpdateShipmentUseCase()
				const result = await useCase.execute({
					shipmentId: req.params.id,
					account_id: req.body.account_id,
					date: req.body.date ? new Date(req.body.date) : undefined,
					notes: req.body.notes,
					items: req.body.items,
				})
				return reply.status(200).send(result)
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
