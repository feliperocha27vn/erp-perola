import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { BarChart3 } from 'lucide-react'
import { useMemo } from 'react'
import { z } from 'zod'
import { useGetBrands } from '@/api/hooks/brandsController/useGetBrands'
import { useGetReportsStockByBrand } from '@/api/hooks/reportsController/useGetReportsStockByBrand'
import { BackToDashboardButton } from '@/components/back-to-dashboard-button'
import { Select } from '@base-ui/react/select'

const searchSchema = z.object({
  brandId: z.string().optional(),
})

export const Route = createFileRoute('/relatorio-de-estoque')({
  component: RelatorioDeEstoquePage,
  validateSearch: searchSchema,
})

const NO_BRAND_VALUE = 'NO_BRAND'

function RelatorioDeEstoquePage() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { brandId } = Route.useSearch()

  const { data: brandsData, isLoading: isBrandsLoading } = useGetBrands()
  const brands = useMemo(() => brandsData?.brands ?? [], [brandsData?.brands])

  const queryParams = useMemo(() => {
    if (!brandId) return undefined
    if (brandId === NO_BRAND_VALUE) return { noBrand: 'true' as const }
    return { brandId }
  }, [brandId])

  const {
    data: reportData,
    isLoading: isReportLoading,
    isError: isReportError,
  } = useGetReportsStockByBrand(queryParams, {
    query: { enabled: !!brandId },
  })

  const products = reportData?.products ?? []

  const stockTitles = useMemo(() => {
    const titles = new Set<string>()
    for (const product of products) {
      for (const stock of product.stocks) {
        titles.add(stock.title)
      }
    }
    return Array.from(titles).sort()
  }, [products])

  const selectedBrandLabel = useMemo(() => {
    if (!brandId) return ''
    if (brandId === NO_BRAND_VALUE) return 'Sem marca'
    return brands.find((b) => b.id === brandId)?.name ?? ''
  }, [brandId, brands])

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <BackToDashboardButton />
          <div className="space-y-1">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
              Relatórios
            </h2>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-foreground">
              Estoque por Marca
            </h1>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 rounded-2xl space-y-3">
        <p className="text-xs text-muted-foreground uppercase tracking-widest">
          Filtrar por marca
        </p>
        <Select.Root
          value={brandId ?? ''}
          onValueChange={(value) => {
            navigate({ search: (prev) => ({ ...prev, brandId: value || undefined }) })
          }}
        >
          <Select.Trigger className="flex h-11 w-full max-w-sm items-center justify-between rounded-xl border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20">
            <Select.Value placeholder={isBrandsLoading ? 'Carregando marcas...' : 'Selecione uma marca...'}>
              {brandId === NO_BRAND_VALUE
                ? 'Sem marca'
                : brandId
                  ? (brands.find(b => b.id === brandId)?.name ?? 'Selecione uma marca...')
                  : 'Selecione uma marca...'}
            </Select.Value>
            <Select.Icon className="text-muted-foreground">▾</Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner sideOffset={8} className="z-50 outline-none">
              <Select.Popup className="min-w-[var(--anchor-width)] rounded-xl border border-border bg-popover p-1 shadow-md">
                <Select.List className="max-h-64 overflow-auto">
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

      {!brandId && (
        <div className="glass-card p-12 rounded-2xl flex flex-col items-center justify-center gap-3 text-center">
          <BarChart3 className="size-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">
            Selecione uma marca para ver o relatório de estoque.
          </p>
        </div>
      )}

      {brandId && isReportLoading && (
        <div className="glass-card p-6 rounded-2xl animate-pulse">
          <div className="h-6 bg-muted rounded w-48 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-muted rounded" />
            ))}
          </div>
        </div>
      )}

      {brandId && isReportError && (
        <div className="glass-card p-6 rounded-2xl text-center text-destructive">
          Erro ao carregar o relatório. Tente novamente.
        </div>
      )}

      {brandId && !isReportLoading && !isReportError && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 p-6 border-b border-border">
            <BarChart3 className="size-5 text-primary" />
            <div>
              <p className="font-semibold text-foreground">{selectedBrandLabel}</p>
              <p className="text-xs text-muted-foreground">
                {products.length} produto{products.length !== 1 ? 's' : ''}
                {stockTitles.length > 0
                  ? ` · ${stockTitles.length} local${stockTitles.length !== 1 ? 'is' : ''} de estoque`
                  : ''}
              </p>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              Nenhum produto encontrado para esta marca.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left font-semibold text-foreground px-4 py-3 whitespace-nowrap">
                      SKU
                    </th>
                    {stockTitles.map((title) => (
                      <th
                        key={title}
                        className="text-right font-semibold text-foreground px-4 py-3 whitespace-nowrap"
                      >
                        {title}
                      </th>
                    ))}
                    <th className="text-right font-semibold text-foreground px-4 py-3 whitespace-nowrap">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, idx) => (
                    <tr
                      key={product.productId}
                      className={
                        idx % 2 === 0
                          ? 'border-b border-border/50'
                          : 'border-b border-border/50 bg-secondary/10'
                      }
                    >
                      <td className="px-4 py-3 font-mono text-foreground whitespace-nowrap">
                        {product.sku}
                      </td>
                      {stockTitles.map((title) => {
                        const stock = product.stocks.find((s) => s.title === title)
                        return (
                          <td
                            key={title}
                            className="px-4 py-3 text-right tabular-nums whitespace-nowrap"
                          >
                            {stock != null ? (
                              <span className="text-foreground font-medium">{stock.qtde}</span>
                            ) : (
                              <span className="text-muted-foreground/50">—</span>
                            )}
                          </td>
                        )
                      })}
                      <td className="px-4 py-3 text-right tabular-nums font-bold text-foreground whitespace-nowrap">
                        {product.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-secondary/20">
                    <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">
                      Total geral
                    </td>
                    {stockTitles.map((title) => {
                      const colTotal = products.reduce((sum, p) => {
                        const stock = p.stocks.find((s) => s.title === title)
                        return sum + (stock?.qtde ?? 0)
                      }, 0)
                      return (
                        <td
                          key={title}
                          className="px-4 py-3 text-right tabular-nums font-semibold text-foreground whitespace-nowrap"
                        >
                          {colTotal}
                        </td>
                      )
                    })}
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-primary whitespace-nowrap">
                      {products.reduce((sum, p) => sum + p.total, 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
