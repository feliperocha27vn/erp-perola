import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { describe, expect, it } from 'vitest'
import {
  calculateTotalRevenue,
  formatMoney,
  mapDailyRevenueData,
  toLocalDate,
} from './formatters'

describe('dashboard formatters', () => {
  it('parses YYYY-MM-DD into local date', () => {
    const date = toLocalDate('2026-04-10')
    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(3)
    expect(date.getDate()).toBe(10)
  })

  it('formats money in pt-BR', () => {
    expect(formatMoney(1234.56)).toContain('R$')
  })

  it('calculates total revenue from cents', () => {
    const total = calculateTotalRevenue([
      { date: '2026-04-10', total_cents: 1000 },
      { date: '2026-04-11', total_cents: 2500 },
    ])
    expect(total).toBe(35)
  })

  it('maps daily revenue chart data', () => {
    const mapped = mapDailyRevenueData(
      [{ date: '2026-04-10', total_cents: 4500 }],
      format,
      ptBR
    )

    expect(mapped).toHaveLength(1)
    expect(mapped[0]?.dayLabel).toBe('10/04')
    expect(mapped[0]?.fullDateLabel).toBe('10/04/2026')
    expect(mapped[0]?.total).toBe(45)
  })
})
