import { describe, expect, it, vi } from "vitest"
import { FbaGeminiClient } from "./fba-gemini-client.js"

describe("FbaGeminiClient", () => {
	it("uses gemini-2.5-flash with structured response", async () => {
		const generateContent = vi.fn().mockResolvedValue({
			text: JSON.stringify({
				items: [
					{
						sku: "SKU-123",
						recommended_send_quantity: 8,
						keep_in_physical_stock: 2,
						confidence: "high",
						decision_tags: ["high_conversion", "steady_sales"],
						reason:
							"Boa conversao e vendas consistentes com estoque suficiente.",
					},
				],
			}),
		})

		const client = new FbaGeminiClient(
			{
				models: { generateContent },
			} as never,
			"test-key",
		)

		const result = await client.recommend([
			{
				sku: "SKU-123",
				asin: "ASIN-123",
				title: "Produto Teste",
				physical_stock: 10,
				units_sold_90d: 12,
				conversion_rate: 2.4,
				sessions_total: 1000,
				page_views_total: 1200,
				daily_units: 0.13,
				base_target_units: 8,
				max_sendable_units: 10,
				conservative_send_cap: 8,
				risk_flags: [],
			},
		])

		expect(generateContent).toHaveBeenCalledTimes(1)
		const payload = generateContent.mock.calls[0][0]
		expect(payload.model).toBe("gemini-2.5-flash")
		expect(payload.config.responseMimeType).toBe("application/json")
		expect(payload.contents).toContain("<role>")
		expect(payload.contents).toContain("<constraints>")
		expect(payload.contents).toContain("<heuristics>")
		expect(payload.contents).toContain("<examples>")
		expect(payload.contents).toContain("<items>")
		expect(result[0].confidence).toBe("high")
	})

	it("retries transient Gemini failures before succeeding", async () => {
		const transientError = Object.assign(new Error("temporary unavailable"), {
			status: 503,
		})
		const sleep = vi.fn().mockResolvedValue(undefined)
		const generateContent = vi
			.fn()
			.mockRejectedValueOnce(transientError)
			.mockResolvedValueOnce({
				text: JSON.stringify({
					items: [
						{
							sku: "SKU-123",
							recommended_send_quantity: 8,
							keep_in_physical_stock: 2,
							confidence: "high",
							decision_tags: ["high_conversion"],
							reason: "Boa conversao e vendas consistentes.",
						},
					],
				}),
			})

		const client = new FbaGeminiClient(
			{ models: { generateContent } } as never,
			"test-key",
			{ maxAttempts: 2, retryDelayMs: 10, sleep },
		)

		const result = await client.recommend([
			{
				sku: "SKU-123",
				asin: "ASIN-123",
				title: "Produto Teste",
				physical_stock: 10,
				units_sold_90d: 12,
				conversion_rate: 2.4,
				sessions_total: 1000,
				page_views_total: 1200,
				daily_units: 0.13,
				base_target_units: 8,
				max_sendable_units: 10,
				conservative_send_cap: 8,
				risk_flags: [],
			},
		])

		expect(generateContent).toHaveBeenCalledTimes(2)
		expect(sleep).toHaveBeenCalledWith(10)
		expect(result[0].sku).toBe("SKU-123")
	})
})
