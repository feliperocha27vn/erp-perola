export class StockNotFoundError extends Error {
	constructor() {
		super("Estoque não encontrado")
		this.name = "StockNotFoundError"
	}
}
