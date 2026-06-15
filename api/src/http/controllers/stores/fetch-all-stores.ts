import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { makeFetchAllStoresUseCase } from "../../../factories/stores/make-fetch-all-stores-use-case.js"

const storeSchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	created_at: z.date(),
	updated_at: z.date(),
})

export const fetchAllStores: FastifyPluginAsyncZod = async (app) => {
	app.get(
		"/stores",
		{
			schema: {
				operationId: "getStores",
				description: "Lista todas as lojas",
				tags: ["stores"],
				response: {
					200: z.object({ stores: z.array(storeSchema) }),
				},
			},
		},
		async (_, reply) => {
			const useCase = makeFetchAllStoresUseCase()
			const result = await useCase.execute()
			return reply.send(result)
		},
	)
}
