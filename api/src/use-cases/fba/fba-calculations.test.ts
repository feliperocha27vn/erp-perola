import { describe, expect, it } from "vitest"
import { calculateFbaBaseRecommendation } from "./fba-calculations.js"

describe("calculateFbaBaseRecommendation", () => {
	it("calculates target and caps by physical stock", () => {
		const result = calculateFbaBaseRecommendation({
			physical_stock: 12,
			units_sold_90d: 45,
			conversion_rate: 2.4,
			target_days: 60,
		})

		expect(result.daily_units).toBe(0.5)
		expect(result.base_target_units).toBe(30)
		expect(result.max_sendable_units).toBe(12)
		expect(result.conservative_send_cap).toBe(12)
	})

	it("flags low conversion, low sample and no stock", () => {
		const result = calculateFbaBaseRecommendation({
			physical_stock: 0,
			units_sold_90d: 2,
			conversion_rate: 0.1,
			target_days: 60,
		})

		expect(result.conservative_send_cap).toBe(0)
		expect(result.risk_flags).toContain("low_sales_sample")
		expect(result.risk_flags).toContain("low_conversion")
		expect(result.risk_flags).toContain("no_physical_stock")
	})
})
