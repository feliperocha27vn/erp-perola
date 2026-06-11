import type {
  ComparisonChartItem,
  FbaResultItem,
  RecommendationChartItem,
} from './types'

const percentFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatPercent(value: number): string {
  return `${percentFormatter.format(value)}%`
}

export function formatInteger(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function getTopRecommendationSku(items: FbaResultItem[]): string | null {
  if (items.length === 0) {
    return null
  }

  const sorted = [...items].sort(
    (a, b) => b.recommended_send_quantity - a.recommended_send_quantity
  )
  return sorted[0]?.sku ?? null
}

export function mapRecommendationChartItems(
  items: FbaResultItem[]
): RecommendationChartItem[] {
  return [...items]
    .sort((a, b) => b.recommended_send_quantity - a.recommended_send_quantity)
    .slice(0, 10)
    .map(item => ({
      sku: item.sku,
      recommended: item.recommended_send_quantity,
      sold90d: item.units_sold_90d,
      stock: item.physical_stock,
    }))
}

export function mapComparisonChartItems(
  item: FbaResultItem
): ComparisonChartItem[] {
  return [
    { label: 'Estoque Fisico', value: item.physical_stock },
    { label: 'Vendas 90d', value: item.units_sold_90d },
    { label: 'Enviar FBA', value: item.recommended_send_quantity },
  ]
}
