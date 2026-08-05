import { Link } from '@tanstack/react-router'
import { ChevronRight, PackageCheck, Warehouse } from 'lucide-react'
import { useGetReportsFullReplenishmentAlerts } from '@/api/hooks/reportsController/useGetReportsFullReplenishmentAlerts'
import { SectionErrorState } from '@/components/ui/section-error-state'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AutonomyValue,
  MarketplaceBadge,
  SeverityBadge,
} from '../abastecimento-do-full/badges'

const PREVIEW_LIMIT = 5

export function FullReplenishmentCard() {
  const { data, isLoading, isError, refetch } =
    useGetReportsFullReplenishmentAlerts()

  const alerts = data?.alerts ?? []
  const idleCount = data?.idle.length ?? 0
  const criticoCount = alerts.filter(a => a.severity === 'critico').length
  const atencaoCount = alerts.filter(a => a.severity === 'atencao').length
  const preview = alerts.slice(0, PREVIEW_LIMIT)

  return (
    <div className="glass-card rounded-2xl p-6 md:p-8 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
            <Warehouse className="size-5 text-primary" />
          </div>
          <p className="text-sm uppercase tracking-widest text-muted-foreground">
            Abastecimento do Full
          </p>
        </div>
        {!isLoading && !isError && (alerts.length > 0 || idleCount > 0) && (
          <Link
            to="/abastecimento-do-full"
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            Ver todos
            <ChevronRight className="size-3.5" />
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError ? (
        <SectionErrorState
          title="Não foi possível carregar"
          description="Verifique sua conexão e tente novamente."
          onRetry={() => refetch()}
        />
      ) : alerts.length === 0 ? (
        <div className="flex items-center gap-3 py-4">
          <PackageCheck className="size-8 text-emerald-500" />
          <p className="text-sm text-muted-foreground">
            Nenhum centro de distribuição precisa de abastecimento.
            {idleCount > 0 && ` ${idleCount} com estoque parado.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            <span className="text-destructive font-semibold">
              {criticoCount} crítico{criticoCount !== 1 ? 's' : ''}
            </span>
            {' · '}
            <span className="text-amber-700 font-semibold">
              {atencaoCount} em atenção
            </span>
            {idleCount > 0 && (
              <>
                {' · '}
                <span className="font-semibold">{idleCount} parado</span>
              </>
            )}
          </p>

          <div className="divide-y divide-border">
            {preview.map(item => (
              <div
                key={item.stock_id}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-semibold text-sm text-foreground truncate">
                      {item.sku}
                    </p>
                    <MarketplaceBadge marketplace={item.marketplace} />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {item.stock_title} · {item.available_qty} no CD · enviar{' '}
                    <span className="font-semibold text-foreground">
                      {item.suggested_quantity}
                    </span>
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <SeverityBadge severity={item.severity} />
                  <AutonomyValue
                    days={item.days_of_autonomy}
                    reorderPoint={item.reorder_point_days}
                  />
                </div>
              </div>
            ))}
          </div>

          {alerts.length > PREVIEW_LIMIT && (
            <Link
              to="/abastecimento-do-full"
              className="block text-center text-xs font-semibold text-primary hover:underline pt-1"
            >
              Ver mais {alerts.length - PREVIEW_LIMIT} alerta
              {alerts.length - PREVIEW_LIMIT !== 1 ? 's' : ''}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
