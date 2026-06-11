export class InsufficientStockError extends Error {
	constructor() {
		super("Estoque insuficiente para concluir a venda")
		this.name = "InsufficientStockError"
	}
}
