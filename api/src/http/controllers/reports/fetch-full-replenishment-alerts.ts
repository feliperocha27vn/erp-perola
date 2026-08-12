import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { makeFetchFullReplenishmentAlertsUseCase } from "../../../factories/reports/make-fetch-full-replenishment-alerts-use-case.js"

const marketplaceSchema = z.enum(["mercado_livre", "amazon", "shopee"])

const alertItemSchema = z.object({
	product_id: z.string(),
	sku: z.string(),
	brand_name: z.string().nullable(),
	stock_id: z.string(),
	stock_title: z.string(),
	marketplace: marketplaceSchema,
	available_qty: z.number(),
	in_transit_qty: z.number(),
	units_window: z.number(),
	demand_rate_per_day: z.number(),
	days_of_autonomy: z.number().nullable(),
	rate_is_estimated: z.boolean(),
	reorder_point_days: z.number(),
	severity: z.enum(["critico", "atencao"]),
	suggested_quantity: z.number(),
	limited_by_physical_stock: z.boolean(),
	physical_stock_id: z.string().nullable(),
	physical_stock_title: z.string().nullable(),
	physical_available_qty: z.number(),
})

const idleItemSchema = z.object({
	product_id: z.string(),
	sku: z.string(),
	brand_name: z.string().nullable(),
	stock_id: z.string(),
	stock_title: z.string(),
	marketplace: marketplaceSchema,
	qtde: z.number(),
	units_window: z.number(),
	days_of_autonomy: z.number().nullable(),
	max_days: z.number(),
	reason: z.enum(["sem_venda", "excesso", "conta_secundaria"]),
	winner_stock_title: z.string().nullable(),
})

export const fetchFullReplenishmentAlerts: FastifyPluginAsyncZod = async (app) => {
	app.get(
		"/reports/full-replenishment-alerts",
		{
			schema: {
				operationId: "getReportsFullReplenishmentAlerts",
				description:
					"Alerta de Abastecimento do Full: dias de autonomia por depósito full, quantidade sugerida e estoque parado",
				tags: ["reports"],
				response: {
					200: z.object({
						alerts: z.array(alertItemSchema),
						idle: z.array(idleItemSchema),
					}),
				},
			},
		},
		async (_req, reply) => {
			const useCase = makeFetchFullReplenishmentAlertsUseCase()
			const result = await useCase.execute()
			return reply.status(200).send(result)
		},
	)
}
