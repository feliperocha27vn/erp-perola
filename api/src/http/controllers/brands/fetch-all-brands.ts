import { makeFetchAllBrandsUseCase } from "../../../factories/brands/make-fetch-all-brands-use-case.js"
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"

const brandSchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	created_at: z.date(),
	updated_at: z.date(),
})

export const fetchAllBrands: FastifyPluginAsyncZod = async (app) => {
	app.get(
		"/brands",
		{
			schema: {
				operationId: "getBrands",
				description: "Lista todas as marcas",
				tags: ["brands"],
				response: {
					200: z.object({ brands: z.array(brandSchema) }),
				},
			},
		},
		async (_, reply) => {
			const fetchAllBrandsUseCase = makeFetchAllBrandsUseCase()
			const result = await fetchAllBrandsUseCase.execute()
			return reply.send(result)
		},
	)
}
