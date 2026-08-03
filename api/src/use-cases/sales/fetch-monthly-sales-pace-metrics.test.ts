import { describe, expect, it } from "vitest"
import { InMemorySaleRepository } from "../../repositories/in-memory/in-memory-sale-repository.js"
import { FetchMonthlySalesPaceMetricsUseCase } from "./fetch-monthly-sales-pace-metrics.js"

describe("FetchMonthlySalesPaceMetricsUseCase", () => {
	it("delegates to the repository and returns its result", async () => {
		const repo = new InMemorySaleRepository()
		repo.fetchMonthlySalesPaceMetrics = async () => ({
			items: [
				{ day: 1, current_month_cents: 5000, last_month_cents: 4000 },
				{ day: 2, current_month_cents: null, last_month_cents: 9000 },
			],
			current_month_total_cents: 5000,
			last_month_total_cents: 9000,
		})

		const result = await new FetchMonthlySalesPaceMetricsUseCase(
			repo,
		).execute()

		expect(result.items).toEqual([
			{ day: 1, current_month_cents: 5000, last_month_cents: 4000 },
			{ day: 2, current_month_cents: null, last_month_cents: 9000 },
		])
		expect(result.current_month_total_cents).toBe(5000)
		expect(result.last_month_total_cents).toBe(9000)
	})
})
