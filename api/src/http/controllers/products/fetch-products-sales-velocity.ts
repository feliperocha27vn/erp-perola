import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { makeFetchProductsSalesVelocityUseCase } from "../../../factories/products/make-fetch-products-sales-velocity-use-case.js"

export const fetchProductsSalesVelocity: FastifyPluginAsyncZod = async (app) => {
	app.get(
		"/products/sales-velocity",
		{
			schema: {
				operationId: "getProductsSalesVelocity",
				description: "Retorna unidades vendidas por produto nos últimos 15, 30, 60 e 90 dias",
				tags: ["products"],
				querystring: z.object({
					pageIndex: z
						.string()
						.default("0")
						.transform(Number)
						.pipe(z.number().int().min(0)),
					search: z.string().optional(),
					withoutImage: z
						.enum(["true", "false"])
						.optional(),
				}),
				response: {
					200: z.object({
						items: z.array(
							z.object({
								product_id: z.string().uuid(),
								units_15d: z.number().int(),
								units_30d: z.number().int(),
								units_60d: z.number().int(),
								units_90d: z.number().int(),
							}),
						),
					}),
				},
			},
		},
		async (req, reply) => {
			const useCase = makeFetchProductsSalesVelocityUseCase()
			const result = await useCase.execute({
				pageIndex: req.query.pageIndex,
				search: req.query.search,
				withoutImage: req.query.withoutImage === "true",
			})
			return reply.send(result)
		},
	)
}
