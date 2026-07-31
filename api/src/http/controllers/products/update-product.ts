import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { BrandNotFoundError } from "../../../errors/brand-not-found-error.js"
import { ProductAlreadyExistsError } from "../../../errors/product-already-exists-error.js"
import { ProductNotFoundError } from "../../../errors/product-not-found-error.js"
import { makeUpdateProductUseCase } from "../../../factories/products/make-update-product-use-case.js"

const stockSchema = z.object({
	id: z.string().uuid(),
	product_id: z.string().uuid(),
	title: z.string(),
	qtde: z.number().int(),
	full: z.boolean(),
	created_at: z.date(),
	updated_at: z.date(),
})

const brandSchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	created_at: z.date(),
	updated_at: z.date(),
})

const productSchema = z.object({
	id: z.string().uuid(),
	sku: z.string(),
	ean: z.string(),
	sale_price_cents: z.number().int().nullable(),
	brand_id: z.string().uuid().nullable(),
	brand: brandSchema.nullable(),
	url_image: z.string().nullable(),
	technical_title: z.string().nullable(),
	technical_description: z.string().nullable(),
	stocks: z.array(stockSchema),
	created_at: z.date(),
	updated_at: z.date(),
})

export const updateProduct: FastifyPluginAsyncZod = async (app) => {
	app.patch(
		"/products/:id",
		{
			schema: {
				operationId: "patchProductsId",
				description: "Atualiza dados de um produto",
				tags: ["products"],
				params: z.object({
					id: z.string().uuid(),
				}),
				body: z
					.object({
						sku: z.string().min(1).optional(),
						ean: z.string().min(1).optional(),
						sale_price_cents: z.number().int().min(1).nullable().optional(),
						brand_id: z.string().uuid().optional(),
						url_image: z.string().url().nullable().optional(),
						technical_title: z.string().nullable().optional(),
						technical_description: z.string().nullable().optional(),
					})
					.refine((body) => Object.keys(body).length > 0),
				response: {
					200: z.object({ product: productSchema }),
					404: z.object({ error: z.string() }),
					409: z.object({ error: z.string() }),
				},
			},
		},
		async (req, reply) => {
			try {
				const updateProductUseCase = makeUpdateProductUseCase()
				const result = await updateProductUseCase.execute({
					id: req.params.id,
					sku: req.body.sku,
					ean: req.body.ean,
					sale_price_cents: req.body.sale_price_cents,
					brand_id: req.body.brand_id,
					url_image: req.body.url_image,
					technical_title: req.body.technical_title,
					technical_description: req.body.technical_description,
				})

				return reply.send(result)
			} catch (error) {
				if (error instanceof ProductNotFoundError) {
					return reply.status(404).send({ error: error.message })
				}

				if (error instanceof BrandNotFoundError) {
					return reply.status(404).send({ error: error.message })
				}

				if (error instanceof ProductAlreadyExistsError) {
					return reply.status(409).send({ error: error.message })
				}

				throw error
			}
		},
	)
}
