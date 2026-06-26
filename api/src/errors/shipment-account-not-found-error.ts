export class ShipmentAccountNotFoundError extends Error {
	constructor() {
		super("Conta de envio não encontrada.")
	}
}
