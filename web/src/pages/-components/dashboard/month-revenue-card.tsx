import type { LucideIcon } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { SectionErrorState } from '@/components/ui/section-error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { formatMoney } from './formatters'

type MonthRevenueCardProps = {
  icon: LucideIcon
  label: string
  emptyMessage: string
  totalCents: number
  isLoading: boolean
  isError?: boolean
  onRetry?: () => void
}

export function MonthRevenueCard({
  icon: Icon,
  label,
  emptyMessage,
  totalCents,
  isLoading,
  isError = false,
  onRetry,
}: MonthRevenueCardProps) {
  return (
    <div className="glass-card rounded-2xl p-6 md:p-8 space-y-4 h-full">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
          <Icon className="size-5 text-primary" />
        </div>
        <p className="text-sm uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-48" />
        </div>
      ) : isError ? (
        <SectionErrorState
          title="Nao foi possivel carregar"
          description="Verifique sua conexao e tente novamente."
          onRetry={onRetry}
        />
      ) : totalCents === 0 ? (
        <EmptyState title={emptyMessage} className="py-4" />
      ) : (
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
            Total faturado
          </p>
          <p className="text-3xl font-display font-bold text-primary">
            {formatMoney(totalCents / 100)}
          </p>
        </div>
      )}
    </div>
  )
}
