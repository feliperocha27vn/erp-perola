import type { ShipmentStatus } from "../repositories/shipment-repository.js"

const LABELS: Record<ShipmentStatus, string> = {
	rascunho: "rascunho",
	em_transito: "em trânsito",
	recebido: "recebido",
}

export class InvalidShipmentTransitionError extends Error {
	constructor(current: ShipmentStatus, expected: ShipmentStatus) {
		super(
			`Este envio está ${LABELS[current]} e só pode ser alterado quando estiver ${LABELS[expected]}.`,
		)
	}
}
