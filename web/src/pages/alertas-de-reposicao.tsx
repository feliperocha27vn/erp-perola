import { Select } from '@base-ui/react/select'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AlertTriangle, PackageCheck } from 'lucide-react'
import { useMemo } from 'react'
import { z } from 'zod'
import { useGetReportsRestockAlerts } from '@/api/hooks/reportsController/useGetReportsRestockAlerts'
import { BackToDashboardButton } from '@/components/back-to-dashboard-button'
import { SectionErrorState } from '@/components/ui/section-error-state'
import {
  ReasonTags,
  SeverityBadge,
} from './-components/alertas-de-reposicao/badges'

const searchSchema = z.object({
  brand: z.string().optional(),
})

export const Route = createFileRoute('/alertas-de-reposicao')({
  component: AlertasDeReposicaoPage,
  validateSearch: searchSchema,
})

const ALL_BRANDS_VALUE = 'ALL_BRANDS'
const NO_BRAND_VALUE = 'NO_BRAND'
const SEM_MARCA = 'Sem marca'

function AlertasDeReposicaoPage() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { brand } = Route.useSearch()
  const { data, isLoading, isError, refetch } = useGetReportsRestockAlerts()

  const items = useMemo(() => data?.items ?? [], [data?.items])

  const brandOptions = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of items) {
      const key = item.brand_name ?? NO_BRAND_VALUE
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .sort(([a], [b]) => {
        if (a === NO_BRAND_VALUE) return 1
        if (b === NO_BRAND_VALUE) return -1
        return a.localeCompare(b, 'pt-BR')
      })
      .map(([value, count]) => ({
        value,
        label: value === NO_BRAND_VALUE ? SEM_MARCA : value,
        count,
      }))
  }, [items])

  const filteredItems = useMemo(() => {
    if (!brand) return items
    if (brand === NO_BRAND_VALUE) return items.filter(i => i.brand_name == null)
    return items.filter(i => i.brand_name === brand)
  }, [items, brand])

  const selectedBrandLabel = brand
    ? brand === NO_BRAND_VALUE
      ? SEM_MARCA
      : brand
    : ''

  const criticoCount = filteredItems.filter(i => i.severity === 'critico').length
  const atencaoCount = filteredItems.filter(i => i.severity === 'atencao').length

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4">
        <BackToDashboardButton />
        <div className="space-y-1">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            Relatórios
          </h2>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-foreground">
            Alertas de Reposição
          </h1>
        </div>
      </div>

      {!isLoading && !isError && items.length > 0 && (
        <div className="glass-card p-6 rounded-2xl space-y-3">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">
            Filtrar por marca
          </p>
          <Select.Root
            value={brand ?? ALL_BRANDS_VALUE}
            onValueChange={(value) => {
              navigate({
                search: (prev) => ({
                  ...prev,
                  brand:
                    value && value !== ALL_BRANDS_VALUE ? value : undefined,
                }),
              })
            }}
          >
            <Select.Trigger className="flex h-11 w-full max-w-sm items-center justify-between rounded-xl border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20">
              <Select.Value>
                {selectedBrandLabel || 'Todas as marcas'}
              </Select.Value>
              <Select.Icon className="text-muted-foreground">▾</Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner sideOffset={8} className="z-50 outline-none">
                <Select.Popup className="min-w-[var(--anchor-width)] rounded-xl border border-border bg-popover p-1 shadow-md">
                  <Select.List className="max-h-64 overflow-auto">
                    <Select.Item
                      value={ALL_BRANDS_VALUE}
                      className="cursor-pointer rounded-md px-3 py-2 text-sm text-foreground data-[highlighted]:bg-secondary"
                    >
                      <Select.ItemText>
                        Todas as marcas ({items.length})
                      </Select.ItemText>
                    </Select.Item>
                    {brandOptions.map((option) => (
                      <Select.Item
                        key={option.value}
                        value={option.value}
                        className="cursor-pointer rounded-md px-3 py-2 text-sm text-foreground data-[highlighted]:bg-secondary"
                      >
                        <Select.ItemText>
                          {option.label} ({option.count})
                        </Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.List>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        </div>
      )}

      {!isLoading && !isError && items.length > 0 && (
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-destructive" />
            <span className="text-muted-foreground">
              <span className="text-destructive font-semibold">Crítico</span> —
              vendas dos últimos 30 dias já superam o estoque físico
            </span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-600" />
            <span className="text-muted-foreground">
              <span className="text-amber-700 font-semibold">Atenção</span> —
              perto do limite (cobertura entre 100% e 130%) ou vendas acelerando
            </span>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="glass-card p-6 rounded-2xl animate-pulse space-y-3">
          <div className="h-6 bg-muted rounded w-48" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 bg-muted rounded" />
          ))}
        </div>
      )}

      {isError && (
        <SectionErrorState
          title="Não foi possível carregar os alertas"
          description="Verifique sua conexão e tente novamente."
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && items.length === 0 && (
        <div className="glass-card p-12 rounded-2xl flex flex-col items-center justify-center gap-3 text-center">
          <PackageCheck className="size-12 text-emerald-500" />
          <p className="text-muted-foreground">
            Nenhum produto precisa de reposição no momento.
          </p>
        </div>
      )}

      {!isLoading && !isError && items.length > 0 && filteredItems.length === 0 && (
        <div className="glass-card p-12 rounded-2xl flex flex-col items-center justify-center gap-3 text-center">
          <PackageCheck className="size-12 text-emerald-500" />
          <p className="text-muted-foreground">
            Nenhum produto de {selectedBrandLabel} precisa de reposição no
            momento.
          </p>
        </div>
      )}

      {!isLoading && !isError && filteredItems.length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between gap-3 p-6 border-b border-border">
            <div>
              <p className="font-bold text-lg text-foreground">
                {filteredItems.length} produto
                {filteredItems.length !== 1 ? 's' : ''}
              </p>
              {selectedBrandLabel && (
                <p className="text-xs text-muted-foreground">
                  {selectedBrandLabel}
                </p>
              )}
            </div>
            <div className="flex gap-3 text-xs">
              <span className="text-destructive font-medium">
                {criticoCount} crítico{criticoCount !== 1 ? 's' : ''}
              </span>
              <span className="text-amber-700 font-medium">
                {atencaoCount} atenção
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left font-semibold text-foreground px-4 py-3 whitespace-nowrap">
                    SKU
                  </th>
                  <th className="text-left font-semibold text-foreground px-4 py-3 whitespace-nowrap">
                    Marca
                  </th>
                  <th className="text-right font-semibold text-foreground px-4 py-3 whitespace-nowrap">
                    Estoque Físico
                  </th>
                  <th className="text-right font-semibold text-foreground px-4 py-3 whitespace-nowrap">
                    Vendas 15d
                  </th>
                  <th className="text-right font-semibold text-foreground px-4 py-3 whitespace-nowrap">
                    Vendas 30d
                  </th>
                  <th className="text-right font-semibold text-foreground px-4 py-3 whitespace-nowrap">
                    Cobertura
                  </th>
                  <th className="text-left font-semibold text-foreground px-4 py-3 whitespace-nowrap">
                    Situação
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, idx) => (
                  <tr
                    key={item.product_id}
                    className={
                      idx % 2 === 0
                        ? 'border-b border-border/50'
                        : 'border-b border-border/50 bg-secondary/10'
                    }
                  >
                    <td className="px-4 py-2.5 font-mono font-semibold text-foreground whitespace-nowrap">
                      {item.sku}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                      {item.brand_name ?? 'Sem marca'}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-foreground whitespace-nowrap">
                      {item.physical_stock_qty}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground whitespace-nowrap">
                      {item.units_15d}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground whitespace-nowrap">
                      {item.units_30d}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-foreground whitespace-nowrap">
                      {item.coverage_percentage.toFixed(1)}%
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <SeverityBadge severity={item.severity} />
                      <ReasonTags reasons={item.reasons} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
