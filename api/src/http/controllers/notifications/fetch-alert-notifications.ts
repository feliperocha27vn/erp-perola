import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { makeFetchAlertNotificationsUseCase } from "../../../factories/notifications/make-fetch-alert-notifications-use-case.js"

const notificationSchema = z.object({
	id: z.string(),
	kind: z.enum(["reposicao", "abastecimento_full", "fora_do_full"]),
	transition: z.enum(["entrou", "piorou"]),
	/** Nulo em `fora_do_full`, que não tem gravidade. */
	severity: z.enum(["critico", "atencao"]).nullable(),
	product_id: z.string(),
	sku: z.string(),
	stock_id: z.string().nullable(),
	stock_title: z.string().nullable(),
	store_id: z.string().nullable(),
	store_name: z.string().nullable(),
	marketplace: z.enum(["mercado_livre", "amazon", "shopee"]).nullable(),
	physical_stock_qty: z.number().nullable(),
	units_30d: z.number().nullable(),
	days_of_autonomy: z.number().nullable(),
	lead_time_days: z.number().nullable(),
	account_units: z.number().nullable(),
	created_at: z.string(),
	read_at: z.string().nullable(),
	resolved_at: z.string().nullable(),
})

export const fetchAlertNotifications: FastifyPluginAsyncZod = async (app) => {
	app.get(
		"/notifications",
		{
			schema: {
				operationId: "getNotifications",
				description:
					"Notificações de alerta do sininho. Compara os alertas de agora com o último estado conhecido antes de listar, então uma transição causada pelo lançamento que acabou de acontecer já volta nesta resposta.",
				tags: ["notifications"],
				response: {
					200: z.object({
						unread_count: z.number(),
						notifications: z.array(notificationSchema),
					}),
				},
			},
		},
		async (_req, reply) => {
			const useCase = makeFetchAlertNotificationsUseCase()
			const { unread_count, notifications } = await useCase.execute()

			return reply.status(200).send({
				unread_count,
				notifications: notifications.map((notification) => ({
					...notification,
					created_at: notification.created_at.toISOString(),
					read_at: notification.read_at?.toISOString() ?? null,
					resolved_at: notification.resolved_at?.toISOString() ?? null,
				})),
			})
		},
	)
}
