import { describe, expect, it } from 'vitest'
import {
  formatInteger,
  formatPercent,
  getTopRecommendationSku,
  mapComparisonChartItems,
  mapRecommendationChartItems,
} from './formatters'

const baseItem = {
  sku: 'SKU-1',
  asin: 'ASIN-1',
  title: 'Produto 1',
  physical_stock: 10,
  units_sold_90d: 8,
  conversion_rate: 1.23,
  recommended_send_quantity: 6,
  confidence: 'high' as const,
  decision_tags: ['high_conversion'],
  analysis_source: 'gemini' as const,
  reason: 'Motivo',
}

describe('fba formatters', () => {
  it('formats percent and integer', () => {
    expect(formatPercent(1.234)).toBe('1,23%')
    expect(formatInteger(1234)).toBe('1.234')
  })

  it('returns top sku by recommended quantity', () => {
    expect(
      getTopRecommendationSku([
        { ...baseItem, sku: 'SKU-1', recommended_send_quantity: 2 },
        { ...baseItem, sku: 'SKU-2', recommended_send_quantity: 10 },
      ])
    ).toBe('SKU-2')
  })

  it('maps recommendation chart and comparison chart', () => {
    const recommendation = mapRecommendationChartItems([{ ...baseItem }])
    expect(recommendation).toHaveLength(1)
    expect(recommendation[0]).toMatchObject({ sku: 'SKU-1', recommended: 6 })

    const comparison = mapComparisonChartItems(baseItem)
    expect(comparison).toHaveLength(3)
    expect(comparison[2]).toMatchObject({ label: 'Enviar FBA', value: 6 })
  })
})
