export class ShipmentAccountNameAlreadyExistsError extends Error {
	constructor() {
		super("Já existe uma conta com este nome.")
	}
}
