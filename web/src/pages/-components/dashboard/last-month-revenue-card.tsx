import { CalendarArrowUp } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { SectionErrorState } from '@/components/ui/section-error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { formatMoney } from './formatters'

type LastMonthRevenueCardProps = {
  totalCents: number
  isLoading: boolean
  isError?: boolean
  onRetry?: () => void
}

export function LastMonthRevenueCard({
  totalCents,
  isLoading,
  isError = false,
  onRetry,
}: LastMonthRevenueCardProps) {
  return (
    <div className="glass-card rounded-2xl p-6 md:p-8 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
          <CalendarArrowUp className="size-5 text-primary" />
        </div>
        <p className="text-sm uppercase tracking-widest text-muted-foreground">
          Vendas do mes passado
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
        <EmptyState
          title="Nenhuma venda registrada no mes passado."
          className="py-4"
        />
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
