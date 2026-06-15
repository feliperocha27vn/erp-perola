import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { BrandNameAlreadyExistsError } from "../../../errors/brand-name-already-exists-error.js"
import { makeCreateBrandUseCase } from "../../../factories/brands/make-create-brand-use-case.js"

const brandSchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	created_at: z.date(),
	updated_at: z.date(),
})

export const createBrand: FastifyPluginAsyncZod = async (app) => {
	app.post(
		"/brands",
		{
			schema: {
				operationId: "postBrands",
				description: "Cria uma marca",
				tags: ["brands"],
				body: z.object({
					name: z.string().min(1),
				}),
				response: {
					201: z.object({ brand: brandSchema }),
					409: z.object({ error: z.string() }),
				},
			},
		},
		async (req, reply) => {
			try {
				const createBrandUseCase = makeCreateBrandUseCase()
				const result = await createBrandUseCase.execute({
					name: req.body.name.trim(),
				})

				return reply.status(201).send(result)
			} catch (error) {
				if (error instanceof BrandNameAlreadyExistsError) {
					return reply.status(409).send({ error: error.message })
				}

				throw error
			}
		},
	)
}
