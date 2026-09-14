import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { makeMarkAllAlertNotificationsReadUseCase } from "../../../factories/notifications/make-mark-all-alert-notifications-read-use-case.js"

export const markAllAlertNotificationsRead: FastifyPluginAsyncZod = async (app) => {
	app.post(
		"/notifications/read-all",
		{
			schema: {
				operationId: "postNotificationsReadAll",
				description: "Marca como lidas todas as notificações ainda não lidas.",
				tags: ["notifications"],
				response: {
					200: z.object({ updated: z.number() }),
				},
			},
		},
		async (_req, reply) => {
			const useCase = makeMarkAllAlertNotificationsReadUseCase()
			const result = await useCase.execute()
			return reply.status(200).send(result)
		},
	)
}
