import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import { z } from "zod"
import { makeFetchStockEntriesGlobalUseCase } from "../../../factories/stock-entries/make-fetch-stock-entries-global-use-case.js"

const stockEntryWithContextSchema = z.object({
	id: z.string().uuid(),
	stock_id: z.string().uuid(),
	quantity: z.number().int(),
	notes: z.string().nullable(),
	created_at: z.date(),
	stock_title: z.string(),
	product_id: z.string().uuid(),
	product_sku: z.string(),
	brand_id: z.string().uuid().nullable(),
	brand_name: z.string().nullable(),
})

export const fetchStockEntriesGlobal: FastifyPluginAsyncZod = async (app) => {
	app.get(
		"/stock-entries",
		{
			schema: {
				operationId: "getStockEntries",
				description:
					"Retorna histórico global de entradas de estoque. Use brandId para uma marca específica, noBrand=true para produtos sem marca, ou omita para todas as marcas.",
				tags: ["stock-entries"],
				querystring: z.object({
					brandId: z.string().uuid().optional(),
					noBrand: z
						.string()
						.transform((v) => v === "true")
						.optional(),
					startDate: z.string().optional(),
					endDate: z.string().optional(),
				}),
				response: {
					200: z.object({ entries: z.array(stockEntryWithContextSchema) }),
				},
			},
		},
		async (req, reply) => {
			const { brandId, noBrand, startDate, endDate } = req.query

			const now = new Date()
			const defaultStart = new Date(now)
			defaultStart.setDate(defaultStart.getDate() - 30)

			const useCase = makeFetchStockEntriesGlobalUseCase()
			const result = await useCase.execute({
				brandId: brandId ?? null,
				noBrand: noBrand ?? false,
				startDate: startDate ? new Date(startDate) : defaultStart,
				endDate: endDate ? new Date(endDate) : now,
			})
			return reply.send(result)
		},
	)
}
