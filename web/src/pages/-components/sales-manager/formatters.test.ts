import { describe, expect, it } from 'vitest'
import {
  formatCentsToInput,
  getPrefilledSalePriceInput,
  parseCurrencyToCents,
  toDateOnly,
  toIsoRangeEnd,
  toIsoRangeStart,
} from './formatters'

describe('sales formatters', () => {
  it('parses currency with comma and dot patterns', () => {
    expect(parseCurrencyToCents('12,34')).toBe(1234)
    expect(parseCurrencyToCents('1.234,56')).toBe(123456)
    expect(parseCurrencyToCents('99.99')).toBe(9999)
  })

  it('returns NaN for invalid currency input', () => {
    expect(Number.isNaN(parseCurrencyToCents(''))).toBe(true)
    expect(Number.isNaN(parseCurrencyToCents('abc'))).toBe(true)
  })

  it('formats cents to input string with comma', () => {
    expect(formatCentsToInput(1050)).toBe('10,50')
  })

  it('prefills sale price input from product sale price cents', () => {
    expect(getPrefilledSalePriceInput(25990, '0')).toBe('259,90')
    expect(getPrefilledSalePriceInput(null, '0')).toBe('0')
  })

  it('formats start/end date range to ISO', () => {
    const date = new Date('2026-04-10T12:00:00.000Z')
    const start = toIsoRangeStart(date)
    const end = toIsoRangeEnd(date)

    expect(start?.endsWith('T00:00:00.000Z')).toBe(true)
    expect(end?.endsWith('T23:59:59.999Z')).toBe(true)
  })

  it('validates date-only string format', () => {
    expect(toDateOnly('2026-04-10')).toBe('2026-04-10')
    expect(toDateOnly('2026-13-10')).toBeNull()
    expect(toDateOnly('10/04/2026')).toBeNull()
  })
})
