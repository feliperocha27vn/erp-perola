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
	store_id: z.string().nullable(),
	store_name: z.string().nullable(),
	marketplace: marketplaceSchema,
	available_qty: z.number(),
	in_transit_qty: z.number(),
	units_window: z.number(),
	demand_rate_per_day: z.number(),
	demand_source: z.enum(["deposito", "conta"]),
	demand_trend: z.enum(["acelerando", "estavel", "desacelerando"]),
	account_units_long: z.number(),
	account_units_short: z.number(),
	days_of_autonomy: z.number().nullable(),
	rate_is_estimated: z.boolean(),
	reorder_point_days: z.number(),
	severity: z.enum(["critico", "atencao"]),
	needed_quantity: z.number(),
	suggested_quantity: z.number(),
	sources: z.array(
		z.object({
			stock_id: z.string(),
			stock_title: z.string(),
			quantity: z.number(),
		}),
	),
	physical_total_qty: z.number(),
	physical_reserved_qty: z.number(),
	physical_committed_qty: z.number(),
	physical_available_qty: z.number(),
	shortfall_reason: z
		.enum([
			"sem_estoque_fisico",
			"estoque_insuficiente",
			"reserva_venda_direta",
			"rascunho_pendente",
			"dividido_entre_cds",
		])
		.nullable(),
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

const missingItemSchema = z.object({
	product_id: z.string(),
	sku: z.string(),
	brand_name: z.string().nullable(),
	store_id: z.string(),
	store_name: z.string(),
	marketplace: marketplaceSchema,
	account_units_long: z.number(),
	account_units_short: z.number(),
	demand_rate_per_day: z.number(),
	demand_trend: z.enum(["acelerando", "estavel", "desacelerando"]),
	target_quantity: z.number(),
	physical_available_qty: z.number(),
	suggested_stock_title: z.string(),
})

export const fetchFullReplenishmentAlerts: FastifyPluginAsyncZod = async (app) => {
	app.get(
		"/reports/full-replenishment-alerts",
		{
			schema: {
				operationId: "getReportsFullReplenishmentAlerts",
				description:
					"Alerta de Abastecimento do Full: dias de autonomia por depósito full, quantidade sugerida, estoque parado e SKUs que a conta vende fora do full",
				tags: ["reports"],
				response: {
					200: z.object({
						alerts: z.array(alertItemSchema),
						idle: z.array(idleItemSchema),
						missing: z.array(missingItemSchema),
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
