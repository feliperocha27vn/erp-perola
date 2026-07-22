import { Link } from '@tanstack/react-router'
import { ChevronRight, PackageCheck, PackageSearch } from 'lucide-react'
import { useGetReportsRestockAlerts } from '@/api/hooks/reportsController/useGetReportsRestockAlerts'
import { SectionErrorState } from '@/components/ui/section-error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { ReasonTags, SeverityBadge } from '../alertas-de-reposicao/badges'

const PREVIEW_LIMIT = 5

export function RestockAlertCard() {
  const { data, isLoading, isError, refetch } = useGetReportsRestockAlerts()

  const items = data?.items ?? []
  const criticoCount = items.filter(i => i.severity === 'critico').length
  const atencaoCount = items.filter(i => i.severity === 'atencao').length
  const preview = items.slice(0, PREVIEW_LIMIT)

  return (
    <div className="glass-card rounded-2xl p-6 md:p-8 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
            <PackageSearch className="size-5 text-primary" />
          </div>
          <p className="text-sm uppercase tracking-widest text-muted-foreground">
            Alerta de Reposição
          </p>
        </div>
        {!isLoading && !isError && items.length > 0 && (
          <Link
            to="/alertas-de-reposicao"
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
      ) : items.length === 0 ? (
        <div className="flex items-center gap-3 py-4">
          <PackageCheck className="size-8 text-emerald-500" />
          <p className="text-sm text-muted-foreground">
            Nenhum produto precisa de reposição no momento.
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
          </p>
          <div className="divide-y divide-border">
            {preview.map(item => (
              <div
                key={item.product_id}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="font-mono font-semibold text-sm text-foreground truncate">
                    {item.sku}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {item.brand_name ?? 'Sem marca'} · {item.physical_stock_qty}{' '}
                    em estoque · {item.units_30d} vendidos/30d
                  </p>
                  <ReasonTags reasons={item.reasons} />
                </div>
                <SeverityBadge severity={item.severity} />
              </div>
            ))}
          </div>
          {items.length > PREVIEW_LIMIT && (
            <Link
              to="/alertas-de-reposicao"
              className="block text-center text-xs font-semibold text-primary hover:underline pt-1"
            >
              Ver mais {items.length - PREVIEW_LIMIT} produto
              {items.length - PREVIEW_LIMIT !== 1 ? 's' : ''}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
