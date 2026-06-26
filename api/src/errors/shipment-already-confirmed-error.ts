export class ShipmentAlreadyConfirmedError extends Error {
	constructor() {
		super("Este envio já foi confirmado e não pode ser alterado.")
	}
}
