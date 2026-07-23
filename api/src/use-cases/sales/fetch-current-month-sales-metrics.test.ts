import { describe, expect, it } from "vitest"
import { InMemorySaleRepository } from "../../repositories/in-memory/in-memory-sale-repository.js"
import { FetchCurrentMonthSalesMetricsUseCase } from "./fetch-current-month-sales-metrics.js"

describe("FetchCurrentMonthSalesMetricsUseCase", () => {
	it("delegates to the repository and returns its result", async () => {
		const repo = new InMemorySaleRepository()
		repo.fetchCurrentMonthSalesMetrics = async () => ({
			total_cents: 12000,
		})

		const { total_cents } = await new FetchCurrentMonthSalesMetricsUseCase(
			repo,
		).execute()

		expect(total_cents).toBe(12000)
	})
})
