import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { makeFetchAllProductsUseCase } from "../../../factories/products/make-fetch-all-products-use-case.js"

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

export const fetchAllProducts: FastifyPluginAsyncZod = async (app) => {
	app.get(
		"/products",
		{
			schema: {
				operationId: "getProducts",
				description: "Lista todos os produtos com paginação",
				tags: ["products"],
				querystring: z.object({
					pageIndex: z
						.string()
						.default("0")
						.transform(Number)
						.pipe(z.number().int().min(0))
						.describe("Índice da página (zero-based)"),
					search: z.string().optional().describe("Pesquisa por SKU ou EAN"),
					withoutImage: z
						.enum(["true", "false"])
						.optional()
						.describe("Filtrar apenas produtos sem imagem"),
					brandId: z
						.string()
						.uuid()
						.optional()
						.describe("Filtrar por ID da marca"),
					sortOrder: z
						.enum(["asc", "desc"])
						.optional()
						.describe("Ordenação por data de criação: asc (mais antigos) ou desc (mais recentes)"),
				}),
				response: {
					200: z.object({
						items: z.array(
							z.object({
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
							}),
						),
						total: z.number(),
						pageIndex: z.number(),
					}),
				},
			},
		},
		async (req, reply) => {
			const fetchAllProductsUseCase = makeFetchAllProductsUseCase()

			const result = await fetchAllProductsUseCase.execute({
				pageIndex: req.query.pageIndex,
				search: req.query.search,
				withoutImage: req.query.withoutImage === "true",
				brandId: req.query.brandId,
				sortOrder: req.query.sortOrder,
			})

			return reply.send(result)
		},
	)
}
