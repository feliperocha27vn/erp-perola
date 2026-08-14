import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { ProductNotFoundError } from "../../../errors/product-not-found-error.js"
import { makeUpdateProductImageUseCase } from "../../../factories/products/make-update-product-image-use-case.js"

const stockSchema = z.object({
	id: z.string().uuid(),
	product_id: z.string().uuid(),
	title: z.string(),
	qtde: z.number().int(),
	full: z.boolean(),
	marketplace: z.enum(["mercado_livre", "amazon", "shopee"]).nullable(),
	store_id: z.string().uuid().nullable(),
	created_at: z.date(),
	updated_at: z.date(),
})

const brandSchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	created_at: z.date(),
	updated_at: z.date(),
})

export const updateProductImage: FastifyPluginAsyncZod = async (app) => {
	app.patch(
		"/products/:id/image",
		{
			schema: {
				operationId: "patchProductsIdImage",
				description: "Atualiza a URL da imagem de um produto",
				tags: ["products"],
				params: z.object({
					id: z.string().uuid(),
				}),
				body: z.object({
					url_image: z.string().url().describe("URL da imagem do produto"),
				}),
				response: {
					200: z.object({
						product: z.object({
							id: z.string().uuid(),
							sku: z.string(),
							ean: z.string(),
							sale_price_cents: z.number().int().nullable(),
							brand_id: z.string().uuid().nullable(),
							brand: brandSchema.nullable(),
							url_image: z.string().nullable(),
							stocks: z.array(stockSchema),
							created_at: z.date(),
							updated_at: z.date(),
						}),
					}),
					404: z.object({
						error: z.string(),
					}),
				},
			},
		},
		async (req, reply) => {
			const { id } = req.params
			const { url_image } = req.body

			try {
				const updateProductImageUseCase = makeUpdateProductImageUseCase()

				const result = await updateProductImageUseCase.execute({
					id,
					url_image,
				})

				return reply.send(result)
			} catch (error) {
				if (error instanceof ProductNotFoundError) {
					return reply.status(404).send({
						error: "Produto não encontrado",
					})
				}

				throw error
			}
		},
	)
}
