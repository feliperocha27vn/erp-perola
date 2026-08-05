export class ShipmentNotEditableError extends Error {
	constructor() {
		super("Este envio já foi despachado e não pode mais ser alterado ou excluído.")
	}
}
