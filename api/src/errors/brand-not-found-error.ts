export class BrandNotFoundError extends Error {
	constructor() {
		super("Marca não encontrada")
		this.name = "BrandNotFoundError"
	}
}
