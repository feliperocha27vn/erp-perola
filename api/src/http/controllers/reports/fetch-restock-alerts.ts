import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { makeFetchRestockAlertsUseCase } from "../../../factories/reports/make-fetch-restock-alerts-use-case.js"

const restockAlertItemSchema = z.object({
	product_id: z.string(),
	sku: z.string(),
	brand_name: z.string().nullable(),
	physical_stock_qty: z.number(),
	units_15d: z.number(),
	units_30d: z.number(),
	coverage_percentage: z.number(),
	severity: z.enum(["critico", "atencao"]),
	reasons: z.array(z.enum(["perto_do_limite", "vendas_acelerando"])),
})

export const fetchRestockAlerts: FastifyPluginAsyncZod = async (app) => {
	app.get(
		"/reports/restock-alerts",
		{
			schema: {
				operationId: "getReportsRestockAlerts",
				tags: ["reports"],
				response: {
					200: z.object({ items: z.array(restockAlertItemSchema) }),
				},
			},
		},
		async (_req, reply) => {
			const useCase = makeFetchRestockAlertsUseCase()
			const result = await useCase.execute()
			return reply.status(200).send(result)
		},
	)
}
