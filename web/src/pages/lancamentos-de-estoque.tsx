import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { History, PackagePlus, Warehouse } from 'lucide-react'
import { useMemo } from 'react'
import { z } from 'zod'
import { useGetBrands } from '@/api/hooks/brandsController/useGetBrands'
import { useGetStockEntries } from '@/api/hooks/stockEntriesController/useGetStockEntries'
import { BackToDashboardButton } from '@/components/back-to-dashboard-button'
import { Select } from '@base-ui/react/select'

const NO_BRAND_VALUE = 'NO_BRAND'

const PERIOD_OPTIONS = [
  { label: 'Últimos 7 dias', value: '7' },
  { label: 'Últimos 30 dias', value: '30' },
  { label: 'Últimos 90 dias', value: '90' },
] as const

type PeriodValue = (typeof PERIOD_OPTIONS)[number]['value']

const searchSchema = z.object({
  brandId: z.string().optional(),
  period: z.enum(['7', '30', '90']).optional().default('30'),
})

export const Route = createFileRoute('/lancamentos-de-estoque')({
  component: LancamentosDeEstoquePage,
  validateSearch: searchSchema,
})

function buildDateRange(period: PeriodValue) {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - Number(period))
  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  }
}

function LancamentosDeEstoquePage() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { brandId, period } = Route.useSearch()

  const { data: brandsData, isLoading: isBrandsLoading } = useGetBrands()
  const brands = useMemo(() => brandsData?.brands ?? [], [brandsData?.brands])

  const queryParams = useMemo(() => {
    const dates = buildDateRange(period)
    const params: Record<string, string> = { ...dates }
    if (brandId === NO_BRAND_VALUE) {
      params.noBrand = 'true'
    } else if (brandId) {
      params.brandId = brandId
    }
    return params
  }, [brandId, period])

  const {
    data: entriesData,
    isLoading: isEntriesLoading,
    isError: isEntriesError,
  } = useGetStockEntries(queryParams)

  const entries = entriesData?.entries ?? []

  const totalUnits = useMemo(
    () => entries.reduce((sum, e) => sum + e.quantity, 0),
    [entries],
  )

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <BackToDashboardButton />
          <div className="space-y-1">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
              Estoque
            </h2>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-foreground">
              Lançamentos
            </h1>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="glass-card p-6 rounded-2xl space-y-4">
        <p className="text-xs text-muted-foreground uppercase tracking-widest">Filtros</p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Período */}
          <div className="space-y-1.5 w-full sm:max-w-[180px]">
            <p className="text-xs text-muted-foreground">Período</p>
            <Select.Root
              value={period}
              onValueChange={(value) => {
                if (value) navigate({ search: (prev) => ({ ...prev, period: value as PeriodValue }) })
              }}
            >
              <Select.Trigger className="flex h-11 w-full items-center justify-between rounded-xl border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20">
                <Select.Value>
                  {PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? 'Últimos 30 dias'}
                </Select.Value>
                <Select.Icon className="text-muted-foreground">▾</Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Positioner sideOffset={8} className="z-50 outline-none">
                  <Select.Popup className="min-w-[var(--anchor-width)] rounded-xl border border-border bg-popover p-1 shadow-md">
                    <Select.List>
                      {PERIOD_OPTIONS.map((o) => (
                        <Select.Item
                          key={o.value}
                          value={o.value}
                          className="cursor-pointer rounded-md px-3 py-2 text-sm text-foreground data-[highlighted]:bg-secondary"
                        >
                          <Select.ItemText>{o.label}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.List>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </div>

          {/* Marca */}
          <div className="space-y-1.5 w-full sm:max-w-sm">
            <p className="text-xs text-muted-foreground">Marca</p>
            <Select.Root
              value={brandId ?? ''}
              onValueChange={(value) => {
                navigate({ search: (prev) => ({ ...prev, brandId: value || undefined }) })
              }}
            >
              <Select.Trigger className="flex h-11 w-full items-center justify-between rounded-xl border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20">
                <Select.Value placeholder={isBrandsLoading ? 'Carregando...' : 'Todas as marcas'}>
                  {brandId === NO_BRAND_VALUE
                    ? 'Sem marca'
                    : brandId
                      ? (brands.find((b) => b.id === brandId)?.name ?? 'Todas as marcas')
                      : 'Todas as marcas'}
                </Select.Value>
                <Select.Icon className="text-muted-foreground">▾</Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Positioner sideOffset={8} className="z-50 outline-none">
                  <Select.Popup className="min-w-[var(--anchor-width)] rounded-xl border border-border bg-popover p-1 shadow-md">
                    <Select.List className="max-h-64 overflow-auto">
                      <Select.Item
                        value=""
                        className="cursor-pointer rounded-md px-3 py-2 text-sm text-foreground data-[highlighted]:bg-secondary"
                      >
                        <Select.ItemText>Todas as marcas</Select.ItemText>
                      </Select.Item>
                      <Select.Item
                        value={NO_BRAND_VALUE}
                        className="cursor-pointer rounded-md px-3 py-2 text-sm text-foreground data-[highlighted]:bg-secondary"
                      >
                        <Select.ItemText>Sem marca</Select.ItemText>
                      </Select.Item>
                      {brands.map((brand) => (
                        <Select.Item
                          key={brand.id}
                          value={brand.id}
                          className="cursor-pointer rounded-md px-3 py-2 text-sm text-foreground data-[highlighted]:bg-secondary"
                        >
                          <Select.ItemText>{brand.name}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.List>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </div>
        </div>
      </div>

      {/* Loading */}
      {isEntriesLoading && (
        <div className="glass-card p-6 rounded-2xl animate-pulse">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {isEntriesError && (
        <div className="glass-card p-6 rounded-2xl text-center text-destructive">
          Erro ao carregar lançamentos. Tente novamente.
        </div>
      )}

      {/* Empty */}
      {!isEntriesLoading && !isEntriesError && entries.length === 0 && (
        <div className="glass-card p-12 rounded-2xl flex flex-col items-center justify-center gap-3 text-center">
          <PackagePlus className="size-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">
            Nenhum lançamento encontrado para o período selecionado.
          </p>
        </div>
      )}

      {/* Table */}
      {!isEntriesLoading && !isEntriesError && entries.length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 p-6 border-b border-border">
            <History className="size-5 text-primary" />
            <div>
              <p className="font-semibold text-foreground">
                {entries.length} lançamento{entries.length !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-muted-foreground">
                {totalUnits} unidade{totalUnits !== 1 ? 's' : ''} no total
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left font-semibold text-foreground px-4 py-3 whitespace-nowrap">Data</th>
                  <th className="text-left font-semibold text-foreground px-4 py-3 whitespace-nowrap">SKU</th>
                  <th className="text-left font-semibold text-foreground px-4 py-3 whitespace-nowrap">Marca</th>
                  <th className="text-left font-semibold text-foreground px-4 py-3 whitespace-nowrap">Estoque</th>
                  <th className="text-right font-semibold text-foreground px-4 py-3 whitespace-nowrap">Qtde</th>
                  <th className="text-left font-semibold text-foreground px-4 py-3 whitespace-nowrap">Obs.</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, idx) => (
                  <tr
                    key={entry.id}
                    className={
                      idx % 2 === 0
                        ? 'border-b border-border/50'
                        : 'border-b border-border/50 bg-secondary/10'
                    }
                  >
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap tabular-nums">
                      {new Date(entry.created_at).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3 font-mono text-foreground whitespace-nowrap">
                      {entry.product_sku}
                    </td>
                    <td className="px-4 py-3 text-foreground whitespace-nowrap">
                      {entry.brand_name ?? <span className="text-muted-foreground/50">—</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Warehouse className="size-3.5 text-muted-foreground shrink-0" />
                        <span className="text-foreground">{entry.stock_title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-emerald-600 whitespace-nowrap">
                      +{entry.quantity}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                      {entry.notes ?? '—'}
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
