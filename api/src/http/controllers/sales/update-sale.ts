import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { InsufficientStockError } from "../../../errors/insufficient-stock-error.js"
import { SaleNotFoundError } from "../../../errors/sale-not-found-error.js"
import { makeUpdateSaleUseCase } from "../../../factories/sales/make-update-sale-use-case.js"

const saleChannelSchema = z.enum([
	"Amazon",
	"Mercado Livre",
	"Shopee",
	"Direto",
])

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

export const updateSale: FastifyPluginAsyncZod = async (app) => {
	app.patch(
		"/sales/:id",
		{
			schema: {
				operationId: "patchSalesId",
				description: "Atualiza uma venda e ajusta estoque",
				tags: ["sales"],
				params: z.object({
					id: z.string().uuid(),
				}),
				body: z
					.object({
						quantity: z.number().int().positive().optional(),
						sale_price: z.number().int().nonnegative().optional(),
						channel: saleChannelSchema.optional(),
						sale_date: z
							.string()
							.regex(/^\d{4}-\d{2}-\d{2}$/)
							.optional(),
						store_id: z.string().uuid().nullable().optional(),
					})
					.refine((body) => Object.keys(body).length > 0),
				response: {
					200: z.object({ sale: saleSchema }),
					400: z.object({ error: z.string() }),
					404: z.object({ error: z.string() }),
				},
			},
		},
		async (req, reply) => {
			try {
				const updateSaleUseCase = makeUpdateSaleUseCase()
				const result = await updateSaleUseCase.execute({
					id: req.params.id,
					quantity: req.body.quantity,
					sale_price: req.body.sale_price,
					channel: req.body.channel,
					sale_date: req.body.sale_date
						? parseDateOnlyToNoon(req.body.sale_date)
						: undefined,
					store_id: req.body.store_id,
				})

				return reply.send(result)
			} catch (error) {
				if (error instanceof SaleNotFoundError) {
					return reply.status(404).send({ error: error.message })
				}

				if (error instanceof InsufficientStockError) {
					return reply.status(400).send({ error: error.message })
				}

				throw error
			}
		},
	)
}
