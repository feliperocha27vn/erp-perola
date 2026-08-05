import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { makeFetchSalesUseCase } from "../../../factories/sales/make-fetch-sales-use-case.js"

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
	marketplace: z.enum(["mercado_livre", "amazon", "shopee"]).nullable(),
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

export const fetchSales: FastifyPluginAsyncZod = async (app) => {
	app.get(
		"/sales",
		{
			schema: {
				operationId: "getSales",
				description: "Lista vendas com filtros por período",
				tags: ["sales"],
				querystring: z.object({
					startDate: z.string().datetime().optional(),
					endDate: z.string().datetime().optional(),
					brandId: z.string().uuid().optional(),
					storeId: z.string().uuid().optional(),
					page: z.coerce.number().int().min(1).default(1),
					limit: z.coerce.number().int().min(1).max(100).default(10),
				}),
				response: {
					200: z.object({
						items: z.array(saleSchema),
						totalCount: z.number().int(),
						totalPages: z.number().int(),
						currentPage: z.number().int(),
						brandCounts: z.array(
							z.object({
								brand_id: z.string().uuid(),
								brand_name: z.string(),
								count: z.number().int(),
							}),
						),
					}),
				},
			},
		},
		async (req, reply) => {
			const fetchSalesUseCase = makeFetchSalesUseCase()
			const result = await fetchSalesUseCase.execute({
				startDate: req.query.startDate
					? new Date(req.query.startDate)
					: undefined,
				endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
				brandId: req.query.brandId,
				storeId: req.query.storeId,
				page: req.query.page,
				limit: req.query.limit,
			})

			return reply.send(result)
		},
	)
}
