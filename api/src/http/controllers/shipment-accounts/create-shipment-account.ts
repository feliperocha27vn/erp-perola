import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { ShipmentAccountNameAlreadyExistsError } from "../../../errors/shipment-account-name-already-exists-error.js"
import { makeCreateShipmentAccountUseCase } from "../../../factories/shipment-accounts/make-create-shipment-account-use-case.js"

const accountSchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	created_at: z.date(),
	updated_at: z.date(),
})

export const createShipmentAccount: FastifyPluginAsyncZod = async (app) => {
	app.post(
		"/shipment-accounts",
		{
			schema: {
				operationId: "postShipmentAccounts",
				tags: ["shipment-accounts"],
				body: z.object({ name: z.string().min(1) }),
				response: {
					201: z.object({ account: accountSchema }),
					409: z.object({ error: z.string() }),
				},
			},
		},
		async (req, reply) => {
			try {
				const useCase = makeCreateShipmentAccountUseCase()
				const result = await useCase.execute({ name: req.body.name.trim() })
				return reply.status(201).send(result)
			} catch (error) {
				if (error instanceof ShipmentAccountNameAlreadyExistsError) {
					return reply.status(409).send({ error: error.message })
				}
				throw error
			}
		},
	)
}
