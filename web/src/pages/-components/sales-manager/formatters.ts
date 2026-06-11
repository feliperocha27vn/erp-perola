export function toIsoRangeStart(date?: Date) {
  if (!date) return undefined

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return new Date(`${year}-${month}-${day}T00:00:00.000Z`).toISOString()
}

export function toIsoRangeEnd(date?: Date) {
  if (!date) return undefined

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return new Date(`${year}-${month}-${day}T23:59:59.999Z`).toISOString()
}

export function parseCurrencyToCents(input: string): number {
  const normalized = input.trim().replace(/\s/g, '')

  if (!normalized) {
    return Number.NaN
  }

  const hasComma = normalized.includes(',')
  const hasDot = normalized.includes('.')

  if (hasComma && hasDot) {
    const value = normalized.replace(/\./g, '').replace(',', '.')
    const parsed = Number(value)
    return Number.isFinite(parsed) ? Math.round(parsed * 100) : Number.NaN
  }

  if (hasComma) {
    const value = normalized.replace(',', '.')
    const parsed = Number(value)
    return Number.isFinite(parsed) ? Math.round(parsed * 100) : Number.NaN
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : Number.NaN
}

export function formatCentsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',')
}

export function getPrefilledSalePriceInput(
  salePriceCents: number | null | undefined,
  fallback: string
): string {
  if (
    typeof salePriceCents !== 'number' ||
    !Number.isInteger(salePriceCents) ||
    salePriceCents < 0
  ) {
    return fallback
  }

  return formatCentsToInput(salePriceCents)
}

export function toDateOnly(value: string): string | null {
  const normalized = value.trim()
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/)

  if (!match) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return null
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null
  }

  return `${match[1]}-${match[2]}-${match[3]}`
}
