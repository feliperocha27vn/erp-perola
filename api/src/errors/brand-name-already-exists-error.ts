export class BrandNameAlreadyExistsError extends Error {
	constructor() {
		super("Já existe uma marca com esse nome")
		this.name = "BrandNameAlreadyExistsError"
	}
}
