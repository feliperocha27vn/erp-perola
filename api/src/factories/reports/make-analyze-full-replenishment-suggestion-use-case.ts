import { env } from "../../env.js"
import { AiAnalystNotConfiguredError } from "../../errors/ai-analyst-not-configured-error.js"
import { GeminiReplenishmentAnalyst } from "../../gateways/gemini-replenishment-analyst.js"
import { DrizzleFullReplenishmentRepository } from "../../repositories/drizzle/drizzle-full-replenishment-repository.js"
import { DrizzleProductInsightRepository } from "../../repositories/drizzle/drizzle-product-insight-repository.js"
import { DrizzleProductRepository } from "../../repositories/drizzle/drizzle-product-repository.js"
import { AnalyzeFullReplenishmentSuggestionUseCase } from "../../use-cases/reports/analyze-full-replenishment-suggestion.js"
import { FetchFullReplenishmentAlertsUseCase } from "../../use-cases/reports/fetch-full-replenishment-alerts.js"

export function makeAnalyzeFullReplenishmentSuggestionUseCase() {
	if (!env.GEMINI_API_KEY) throw new AiAnalystNotConfiguredError()

	const replenishmentRepo = new DrizzleFullReplenishmentRepository()

	return new AnalyzeFullReplenishmentSuggestionUseCase(
		new FetchFullReplenishmentAlertsUseCase(replenishmentRepo),
		replenishmentRepo,
		new DrizzleProductRepository(),
		new DrizzleProductInsightRepository(),
		new GeminiReplenishmentAnalyst({
			apiKey: env.GEMINI_API_KEY,
			model: env.GEMINI_MODEL,
		}),
	)
}
