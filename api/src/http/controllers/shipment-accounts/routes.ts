import type { FastifyInstance } from "fastify"
import { createShipmentAccount } from "./create-shipment-account.js"
import { deleteShipmentAccount } from "./delete-shipment-account.js"
import { listShipmentAccounts } from "./list-shipment-accounts.js"
import { updateShipmentAccount } from "./update-shipment-account.js"

export async function shipmentAccountsRoutes(app: FastifyInstance) {
	app.register(listShipmentAccounts)
	app.register(createShipmentAccount)
	app.register(updateShipmentAccount)
	app.register(deleteShipmentAccount)
}
