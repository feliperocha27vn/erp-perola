export class InvalidFbaCsvError extends Error {
	constructor(message: string) {
		super(message)
		this.name = "InvalidFbaCsvError"
	}
}
