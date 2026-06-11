import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type BrandSalesCountItem = {
  brand_id: string
  brand_name: string
  count: number
}

type SalesManagerBrandBreakdownProps = {
  items: BrandSalesCountItem[]
  isLoading: boolean
  selectedBrandId?: string
  onSelectBrand: (brandId: string | undefined) => void
}

const fmt = new Intl.NumberFormat('pt-BR')

export function SalesManagerBrandBreakdown({
  items,
  isLoading,
  selectedBrandId,
  onSelectBrand,
}: SalesManagerBrandBreakdownProps) {
  if (!selectedBrandId) return null

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
          <Skeleton key={i} className="h-7 w-20 rounded-md" />
        ))}
      </div>
    )
  }

  if (items.length === 0) return null

  const total = items.reduce((s, item) => s + item.count, 0)

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {items.map(item => {
        const selected = item.brand_id === selectedBrandId
        const pct = total > 0 ? Math.round((item.count / total) * 100) : 0

        return (
          <button
            key={item.brand_id}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelectBrand(selected ? undefined : item.brand_id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm transition-colors',
              selected
                ? 'bg-primary/10 text-primary ring-1 ring-primary/25'
                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
            )}
          >
            <span className={cn('font-medium', selected && 'font-semibold')}>
              {item.brand_name}
            </span>
            <span className="tabular-nums text-xs opacity-60">
              {fmt.format(item.count)}
            </span>
            <span className="text-xs opacity-40">{pct}%</span>
          </button>
        )
      })}

      {selectedBrandId && (
        <button
          type="button"
          onClick={() => onSelectBrand(undefined)}
          className="px-1 text-xs text-muted-foreground/50 transition-colors hover:text-muted-foreground"
        >
          limpar
        </button>
      )}
    </div>
  )
}
