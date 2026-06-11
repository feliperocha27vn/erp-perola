import type { Locale } from 'date-fns'

type MonthlyRevenueItem = {
  date: string
  total_cents: number
}

export function toLocalDate(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function calculateTotalRevenue(items: MonthlyRevenueItem[]) {
  return items.reduce((acc, item) => acc + item.total_cents, 0) / 100
}

export function mapMonthlyRevenueData(
  items: MonthlyRevenueItem[],
  formatDate: (date: Date, mask: string, options: { locale: Locale }) => string,
  locale: Locale
) {
  return items.map(item => {
    const date = toLocalDate(item.date)

    return {
      dayLabel: formatDate(date, 'dd/MM', { locale }),
      fullDateLabel: formatDate(date, 'dd/MM/yyyy', { locale }),
      total: item.total_cents / 100,
      date,
    }
  })
}
