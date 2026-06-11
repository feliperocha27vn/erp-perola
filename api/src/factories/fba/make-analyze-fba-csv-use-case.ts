import { DrizzleProductRepository } from "../../repositories/drizzle/drizzle-product-repository.js"
import { AnalyzeFbaCsvUseCase } from "../../use-cases/fba/analyze-fba-csv.js"
import { FbaGeminiClient } from "../../use-cases/fba/fba-gemini-client.js"

export function makeAnalyzeFbaCsvUseCase() {
	const productRepository = new DrizzleProductRepository()
	const geminiClient = new FbaGeminiClient()

	const analyzeFbaCsvUseCase = new AnalyzeFbaCsvUseCase(productRepository, geminiClient)

	return analyzeFbaCsvUseCase
}
