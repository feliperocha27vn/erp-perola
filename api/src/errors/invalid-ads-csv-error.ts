export class InvalidAdsCsvError extends Error {
	constructor(message = "CSV inválido ou com colunas fora do padrão Amazon Ads") {
		super(message)
		this.name = "InvalidAdsCsvError"
	}
}
