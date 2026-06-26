export class InsufficientStockError extends Error {
	constructor(sku?: string, available?: number, requested?: number) {
		const detail =
			sku !== undefined
				? ` para o produto ${sku}: disponível ${available}, solicitado ${requested}`
				: ""
		super(`Estoque insuficiente${detail}.`)
	}
}
