import { describe, expect, it } from "vitest"
import { InMemorySaleRepository } from "../../repositories/in-memory/in-memory-sale-repository.js"
import { FetchLast15DaysSalesMetricsUseCase } from "./fetch-last-15-days-sales-metrics.js"

describe("FetchLast15DaysSalesMetricsUseCase", () => {
	it("delegates to the repository and returns its result", async () => {
		const repo = new InMemorySaleRepository()
		repo.fetchLast15DaysSalesMetrics = async () => ({
			items: [{ date: "2026-07-22", total_cents: 5000 }],
			daily_average_cents: 5000,
		})

		const { items, daily_average_cents } = await new FetchLast15DaysSalesMetricsUseCase(
			repo,
		).execute()

		expect(items).toEqual([{ date: "2026-07-22", total_cents: 5000 }])
		expect(daily_average_cents).toBe(5000)
	})
})
