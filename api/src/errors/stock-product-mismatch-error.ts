export class StockProductMismatchError extends Error {
	constructor() {
		super("Estoque não pertence ao produto informado")
		this.name = "StockProductMismatchError"
	}
}
