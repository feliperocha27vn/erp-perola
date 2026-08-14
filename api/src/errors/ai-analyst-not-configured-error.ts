export class AiAnalystNotConfiguredError extends Error {
	constructor() {
		super("A análise por IA não está configurada nesta instalação.")
	}
}
