export class SaleNotFoundError extends Error {
	constructor() {
		super("Venda não encontrada")
		this.name = "SaleNotFoundError"
	}
}
