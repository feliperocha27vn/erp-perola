export class ShipmentNotFoundError extends Error {
	constructor() {
		super("Envio não encontrado.")
	}
}
