import { BrandNotFoundError } from "../../../errors/brand-not-found-error.js"
import { ProductAlreadyExistsError } from "../../../errors/product-already-exists-error.js"
import { makeCreateProductUseCase } from "../../../factories/products/make-create-product-use-case.js"
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"

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
	technical_subtitle: z.string().nullable(),
	technical_analysis: z.string().nullable(),
	technical_movement: z.string().nullable(),
	technical_case_and_crystal: z.string().nullable(),
	technical_specific_functionality: z.string().nullable(),
	technical_dial_and_luminosity: z.string().nullable(),
	technical_bracelet_construction: z.string().nullable(),
	technical_table: z.string().nullable(),
	stocks: z.array(stockSchema),
	created_at: z.date(),
	updated_at: z.date(),
})

export const createProduct: FastifyPluginAsyncZod = async (app) => {
	app.post(
		"/products",
		{
			schema: {
				operationId: "postProducts",
				description: "Cria um produto",
				tags: ["products"],
				body: z.object({
					sku: z.string().min(1).describe("SKU do produto"),
					ean: z.string().min(1).describe("EAN do produto"),
					brand_id: z.string().uuid(),
					url_image: z.string().url().optional(),
				}),
				response: {
					201: z.object({ product: productSchema }),
					404: z.object({ error: z.string() }),
					409: z.object({ error: z.string() }),
				},
			},
		},
		async (req, reply) => {
			try {
				const createProductUseCase = makeCreateProductUseCase()
				const result = await createProductUseCase.execute({
					sku: req.body.sku,
					ean: req.body.ean,
					brand_id: req.body.brand_id,
					url_image: req.body.url_image,
				})

				return reply.status(201).send(result)
			} catch (error) {
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
