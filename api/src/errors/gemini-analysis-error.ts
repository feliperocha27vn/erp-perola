export class GeminiAnalysisError extends Error {
	constructor(message: string) {
		super(message)
		this.name = "GeminiAnalysisError"
	}
}
