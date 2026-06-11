import type { FbaCalculationInput, FbaCalculationOutput } from "./fba-types.js"

export function calculateFbaBaseRecommendation({
	physical_stock,
	units_sold_90d,
	conversion_rate,
	target_days,
}: FbaCalculationInput): FbaCalculationOutput {
	const daily_units = units_sold_90d / 90
	const base_target_units = Math.ceil(daily_units * target_days)
	const max_sendable_units = Math.max(0, physical_stock)
	const conservative_send_cap = Math.min(base_target_units, max_sendable_units)

	const risk_flags: string[] = []

	if (units_sold_90d < 3) {
		risk_flags.push("low_sales_sample")
	}

	if (conversion_rate < 0.2) {
		risk_flags.push("low_conversion")
	}

	if (physical_stock <= 0) {
		risk_flags.push("no_physical_stock")
	}

	return {
		daily_units,
		base_target_units,
		max_sendable_units,
		conservative_send_cap,
		risk_flags,
	}
}
