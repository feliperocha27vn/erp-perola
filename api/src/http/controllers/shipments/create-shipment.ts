import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { ShipmentAccountNotFoundError } from "../../../errors/shipment-account-not-found-error.js"
import { makeCreateShipmentUseCase } from "../../../factories/shipments/make-create-shipment-use-case.js"

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
	status: z.enum(["rascunho", "confirmado"]),
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

export const createShipment: FastifyPluginAsyncZod = async (app) => {
	app.post(
		"/shipments",
		{
			schema: {
				operationId: "postShipments",
				tags: ["shipments"],
				body: z.object({
					account_id: z.string().uuid(),
					date: z.string().datetime(),
					notes: z.string().nullable().default(null),
					items: z.array(itemInputSchema),
				}),
				response: {
					201: z.object({ shipment: shipmentSchema }),
					404: z.object({ error: z.string() }),
				},
			},
		},
		async (req, reply) => {
			try {
				const useCase = makeCreateShipmentUseCase()
				const result = await useCase.execute({
					account_id: req.body.account_id,
					date: new Date(req.body.date),
					notes: req.body.notes,
					items: req.body.items,
				})
				return reply.status(201).send(result)
			} catch (error) {
				if (error instanceof ShipmentAccountNotFoundError) {
					return reply.status(404).send({ error: error.message })
				}
				throw error
			}
		},
	)
}
