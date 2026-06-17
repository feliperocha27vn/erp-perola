import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { ProductNotFoundError } from "../../../errors/product-not-found-error.js"
import { makeDeleteProductUseCase } from "../../../factories/products/make-delete-product-use-case.js"

export const deleteProduct: FastifyPluginAsyncZod = async (app) => {
	app.delete(
		"/products/:id",
		{
			schema: {
				operationId: "deleteProduct",
				tags: ["products"],
				params: z.object({
					id: z.string().uuid(),
				}),
				response: {
					204: z.object({}),
					404: z.object({ error: z.string() }),
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params

			try {
				const useCase = makeDeleteProductUseCase()
				await useCase.execute({ productId: id })

				return reply.status(204).send({})
			} catch (error) {
				if (error instanceof ProductNotFoundError) {
					return reply.status(404).send({ error: error.message })
				}
				throw error
			}
		},
	)
}
