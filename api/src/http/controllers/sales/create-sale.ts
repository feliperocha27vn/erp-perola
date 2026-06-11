import { InsufficientStockError } from "../../../errors/insufficient-stock-error.js"
import { ProductNotFoundError } from "../../../errors/product-not-found-error.js"
import { StockProductMismatchError } from "../../../errors/stock-product-mismatch-error.js"
import { makeCreateSaleUseCase } from "../../../factories/sales/make-create-sale-use-case.js"
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"

const saleChannelSchema = z.enum(["Amazon", "Mercado Livre", "Shopee", "Direto"])

const storeSchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	created_at: z.date(),
	updated_at: z.date(),
})

const productSchema = z.object({
	id: z.string().uuid(),
	sku: z.string(),
	ean: z.string(),
	brand_id: z.string().uuid().nullable(),
	url_image: z.string().nullable(),
	created_at: z.date(),
	updated_at: z.date(),
})

const stockSchema = z.object({
	id: z.string().uuid(),
	product_id: z.string().uuid(),
	title: z.string(),
	qtde: z.number().int(),
	full: z.boolean(),
	created_at: z.date(),
	updated_at: z.date(),
})

const saleSchema = z.object({
	id: z.string().uuid(),
	product_id: z.string().uuid(),
	stock_id: z.string().uuid(),
	store_id: z.string().uuid().nullable(),
	quantity: z.number().int(),
	sale_price: z.number().int(),
	total_price: z.number().int(),
	channel: saleChannelSchema,
	sale_date: z.date(),
	created_at: z.date(),
	updated_at: z.date(),
	product: productSchema,
	stock: stockSchema,
	store: storeSchema.nullable(),
})

function parseDateOnlyToNoon(dateOnly: string): Date {
	const [year, month, day] = dateOnly.split("-").map(Number)
	return new Date(year, month - 1, day, 12, 0, 0, 0)
}

export const createSale: FastifyPluginAsyncZod = async (app) => {
	app.post(
		"/sales",
		{
			schema: {
				operationId: "postSales",
				description: "Cria uma venda com baixa automática no estoque",
				tags: ["sales"],
				body: z.object({
					product_id: z.string().uuid(),
					stock_id: z.string().uuid(),
					store_id: z.string().uuid().nullable().optional(),
					quantity: z.number().int().positive(),
					sale_price: z.number().int().nonnegative(),
					channel: saleChannelSchema,
					sale_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
				}),
				response: {
					201: z.object({ sale: saleSchema }),
					400: z.object({ error: z.string() }),
					404: z.object({ error: z.string() }),
				},
			},
		},
		async (req, reply) => {
			try {
				const createSaleUseCase = makeCreateSaleUseCase()
				const result = await createSaleUseCase.execute({
					...req.body,
					store_id: req.body.store_id ?? null,
					sale_date: parseDateOnlyToNoon(req.body.sale_date),
				})

				return reply.status(201).send(result)
			} catch (error) {
				if (error instanceof ProductNotFoundError) {
					return reply.status(404).send({ error: error.message })
				}

				if (error instanceof InsufficientStockError) {
					return reply.status(400).send({ error: error.message })
				}

				if (error instanceof StockProductMismatchError) {
					return reply.status(400).send({ error: error.message })
				}

				throw error
			}
		},
	)
}
