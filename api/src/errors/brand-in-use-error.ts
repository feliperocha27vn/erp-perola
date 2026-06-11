export class BrandInUseError extends Error {
	constructor() {
		super("Marca possui produtos vinculados")
		this.name = "BrandInUseError"
	}
}
