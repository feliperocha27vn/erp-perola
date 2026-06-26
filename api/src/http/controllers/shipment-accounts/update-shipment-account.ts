import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { ShipmentAccountNameAlreadyExistsError } from "../../../errors/shipment-account-name-already-exists-error.js"
import { ShipmentAccountNotFoundError } from "../../../errors/shipment-account-not-found-error.js"
import { makeUpdateShipmentAccountUseCase } from "../../../factories/shipment-accounts/make-update-shipment-account-use-case.js"

const accountSchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	created_at: z.date(),
	updated_at: z.date(),
})

export const updateShipmentAccount: FastifyPluginAsyncZod = async (app) => {
	app.put(
		"/shipment-accounts/:id",
		{
			schema: {
				operationId: "putShipmentAccountsById",
				tags: ["shipment-accounts"],
				params: z.object({ id: z.string().uuid() }),
				body: z.object({ name: z.string().min(1) }),
				response: {
					200: z.object({ account: accountSchema }),
					404: z.object({ error: z.string() }),
					409: z.object({ error: z.string() }),
				},
			},
		},
		async (req, reply) => {
			try {
				const useCase = makeUpdateShipmentAccountUseCase()
				const result = await useCase.execute({ id: req.params.id, name: req.body.name.trim() })
				return reply.status(200).send(result)
			} catch (error) {
				if (error instanceof ShipmentAccountNotFoundError) {
					return reply.status(404).send({ error: error.message })
				}
				if (error instanceof ShipmentAccountNameAlreadyExistsError) {
					return reply.status(409).send({ error: error.message })
				}
				throw error
			}
		},
	)
}
