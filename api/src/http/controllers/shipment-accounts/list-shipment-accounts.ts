import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { makeListShipmentAccountsUseCase } from "../../../factories/shipment-accounts/make-list-shipment-accounts-use-case.js"

const accountSchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	created_at: z.date(),
	updated_at: z.date(),
})

export const listShipmentAccounts: FastifyPluginAsyncZod = async (app) => {
	app.get(
		"/shipment-accounts",
		{
			schema: {
				operationId: "getShipmentAccounts",
				tags: ["shipment-accounts"],
				response: {
					200: z.object({ accounts: z.array(accountSchema) }),
				},
			},
		},
		async (_req, reply) => {
			const useCase = makeListShipmentAccountsUseCase()
			const result = await useCase.execute()
			return reply.status(200).send(result)
		},
	)
}
