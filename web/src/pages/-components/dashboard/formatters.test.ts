import { describe, expect, it } from 'vitest'
import {
  computePaceComparison,
  formatMoney,
  hasMonthlyPaceData,
  mapMonthlyPaceData,
} from './formatters'

describe('dashboard formatters', () => {
  it('formats money in pt-BR', () => {
    expect(formatMoney(1234.56)).toContain('R$')
  })

  it('maps monthly pace items from cents to reais', () => {
    const mapped = mapMonthlyPaceData([
      { day: 1, current_month_cents: 4500, last_month_cents: 3000 },
      { day: 2, current_month_cents: null, last_month_cents: 6000 },
    ])

    expect(mapped).toEqual([
      { day: 1, current: 45, last: 30 },
      { day: 2, current: null, last: 60 },
    ])
  })

  it('computes pace comparison from the last day with current-month data', () => {
    const comparison = computePaceComparison([
      { day: 1, current_month_cents: 4000, last_month_cents: 2000 },
      { day: 2, current_month_cents: 9000, last_month_cents: 5000 },
      { day: 3, current_month_cents: null, last_month_cents: 8000 },
    ])

    expect(comparison).toEqual({
      day: 2,
      currentCents: 9000,
      lastMonthCentsAtSameDay: 5000,
      deltaPercent: 80,
    })
  })

  it('returns null deltaPercent when there is no comparable last month value', () => {
    const comparison = computePaceComparison([
      { day: 1, current_month_cents: 4000, last_month_cents: 0 },
    ])

    expect(comparison?.deltaPercent).toBeNull()
  })

  it('returns null when no item has current-month data yet', () => {
    const comparison = computePaceComparison([
      { day: 1, current_month_cents: null, last_month_cents: 2000 },
    ])

    expect(comparison).toBeNull()
  })

  it('detects when there is no sales data at all', () => {
    expect(
      hasMonthlyPaceData([
        { day: 1, current_month_cents: 0, last_month_cents: 0 },
        { day: 2, current_month_cents: null, last_month_cents: 0 },
      ])
    ).toBe(false)

    expect(
      hasMonthlyPaceData([
        { day: 1, current_month_cents: 1000, last_month_cents: 0 },
      ])
    ).toBe(true)
  })
})
