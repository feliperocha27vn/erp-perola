import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { makeListShipmentsUseCase } from "../../../factories/shipments/make-list-shipments-use-case.js"

const shipmentSchema = z.object({
	id: z.string().uuid(),
	account_id: z.string().uuid(),
	account_name: z.string(),
	date: z.date(),
	notes: z.string().nullable(),
	status: z.enum(["rascunho", "confirmado"]),
	item_count: z.number(),
	created_at: z.date(),
	updated_at: z.date(),
})

export const listShipments: FastifyPluginAsyncZod = async (app) => {
	app.get(
		"/shipments",
		{
			schema: {
				operationId: "getShipments",
				tags: ["shipments"],
				response: {
					200: z.object({ shipments: z.array(shipmentSchema) }),
				},
			},
		},
		async (_req, reply) => {
			const useCase = makeListShipmentsUseCase()
			const result = await useCase.execute()
			return reply.status(200).send(result)
		},
	)
}
