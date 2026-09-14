import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { AlertNotificationNotFoundError } from "../../../errors/alert-notification-not-found-error.js"
import { makeMarkAlertNotificationReadUseCase } from "../../../factories/notifications/make-mark-alert-notification-read-use-case.js"

export const markAlertNotificationRead: FastifyPluginAsyncZod = async (app) => {
	app.patch(
		"/notifications/:id/read",
		{
			schema: {
				operationId: "patchNotificationsByIdRead",
				description: "Marca uma notificação como lida. Uma já lida mantém a data original.",
				tags: ["notifications"],
				params: z.object({ id: z.string().uuid() }),
				response: {
					204: z.undefined(),
					404: z.object({ error: z.string() }),
				},
			},
		},
		async (req, reply) => {
			try {
				const useCase = makeMarkAlertNotificationReadUseCase()
				await useCase.execute({ id: req.params.id })
				return reply.status(204).send()
			} catch (error) {
				if (error instanceof AlertNotificationNotFoundError) {
					return reply.status(404).send({ error: error.message })
				}
				throw error
			}
		},
	)
}
