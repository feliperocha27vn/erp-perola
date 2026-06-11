import { BrandInUseError } from "../../../errors/brand-in-use-error.js"
import { BrandNotFoundError } from "../../../errors/brand-not-found-error.js"
import { makeDeleteBrandUseCase } from "../../../factories/brands/make-delete-brand-use-case.js"
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"

export const deleteBrand: FastifyPluginAsyncZod = async (app) => {
	app.delete(
		"/brands/:id",
		{
			schema: {
				operationId: "deleteBrandsId",
				description: "Exclui uma marca",
				tags: ["brands"],
				params: z.object({
					id: z.string().uuid(),
				}),
				response: {
					204: z.null(),
					404: z.object({ error: z.string() }),
					409: z.object({ error: z.string() }),
				},
			},
		},
		async (req, reply) => {
			try {
				const deleteBrandUseCase = makeDeleteBrandUseCase()
				await deleteBrandUseCase.execute({ id: req.params.id })

				return reply.status(204).send(null)
			} catch (error) {
				if (error instanceof BrandNotFoundError) {
					return reply.status(404).send({ error: error.message })
				}

				if (error instanceof BrandInUseError) {
					return reply.status(409).send({ error: error.message })
				}

				throw error
			}
		},
	)
}
