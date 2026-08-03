export function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export type MonthlySalesPacePoint = {
  day: number
  current_month_cents: number | null
  last_month_cents: number | null
}

export function mapMonthlyPaceData(items: MonthlySalesPacePoint[]) {
  return items.map(item => ({
    day: item.day,
    current:
      item.current_month_cents != null ? item.current_month_cents / 100 : null,
    last: item.last_month_cents != null ? item.last_month_cents / 100 : null,
  }))
}

export type PaceComparison = {
  day: number
  currentCents: number
  lastMonthCentsAtSameDay: number
  deltaPercent: number | null
}

export function computePaceComparison(
  items: MonthlySalesPacePoint[]
): PaceComparison | null {
  const lastPoint = [...items]
    .reverse()
    .find(item => item.current_month_cents != null)

  if (!lastPoint || lastPoint.current_month_cents == null) return null

  const currentCents = lastPoint.current_month_cents
  const lastMonthCentsAtSameDay = lastPoint.last_month_cents ?? 0

  return {
    day: lastPoint.day,
    currentCents,
    lastMonthCentsAtSameDay,
    deltaPercent:
      lastMonthCentsAtSameDay > 0
        ? ((currentCents - lastMonthCentsAtSameDay) / lastMonthCentsAtSameDay) *
          100
        : null,
  }
}

export function hasMonthlyPaceData(items: MonthlySalesPacePoint[]) {
  return items.some(
    item => (item.current_month_cents ?? 0) > 0 || (item.last_month_cents ?? 0) > 0
  )
}
