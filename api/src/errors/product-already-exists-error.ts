export class ProductAlreadyExistsError extends Error {
	constructor() {
		super("Já existe produto com o mesmo SKU ou EAN")
		this.name = "ProductAlreadyExistsError"
	}
}
