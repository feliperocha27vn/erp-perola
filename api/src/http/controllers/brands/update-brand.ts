import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { BrandNameAlreadyExistsError } from "../../../errors/brand-name-already-exists-error.js"
import { BrandNotFoundError } from "../../../errors/brand-not-found-error.js"
import { makeUpdateBrandUseCase } from "../../../factories/brands/make-update-brand-use-case.js"

const brandSchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	created_at: z.date(),
	updated_at: z.date(),
})

export const updateBrand: FastifyPluginAsyncZod = async (app) => {
	app.patch(
		"/brands/:id",
		{
			schema: {
				operationId: "patchBrandsId",
				description: "Atualiza uma marca",
				tags: ["brands"],
				params: z.object({
					id: z.string().uuid(),
				}),
				body: z.object({
					name: z.string().min(1),
				}),
				response: {
					200: z.object({ brand: brandSchema }),
					404: z.object({ error: z.string() }),
					409: z.object({ error: z.string() }),
				},
			},
		},
		async (req, reply) => {
			try {
				const updateBrandUseCase = makeUpdateBrandUseCase()
				const result = await updateBrandUseCase.execute({
					id: req.params.id,
					name: req.body.name.trim(),
				})

				return reply.send(result)
			} catch (error) {
				if (error instanceof BrandNotFoundError) {
					return reply.status(404).send({ error: error.message })
				}

				if (error instanceof BrandNameAlreadyExistsError) {
					return reply.status(409).send({ error: error.message })
				}

				throw error
			}
		},
	)
}
