import type { FastifyInstance } from "fastify"
import { confirmShipment } from "./confirm-shipment.js"
import { createShipment } from "./create-shipment.js"
import { deleteShipment } from "./delete-shipment.js"
import { getShipment } from "./get-shipment.js"
import { listShipments } from "./list-shipments.js"
import { updateShipment } from "./update-shipment.js"

export async function shipmentsRoutes(app: FastifyInstance) {
	app.register(listShipments)
	app.register(getShipment)
	app.register(createShipment)
	app.register(updateShipment)
	app.register(deleteShipment)
	app.register(confirmShipment)
}
