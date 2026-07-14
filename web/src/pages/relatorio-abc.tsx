import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AlertTriangle, Copy, Download, FileBarChart2, FileText } from 'lucide-react'
import { useMemo } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { useGetReportsAbc } from '@/api/hooks/reportsController/useGetReportsAbc'
import { BackToDashboardButton } from '@/components/back-to-dashboard-button'
import { toIsoRangeEnd, toIsoRangeStart } from './-components/sales-manager/formatters'

const searchSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export const Route = createFileRoute('/relatorio-abc')({
  component: RelatorioAbcPage,
  validateSearch: searchSchema,
})

function formatCents(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
}

function coverageBadge(coveragePercentage: number | null, needsPurchase: boolean) {
  if (coveragePercentage === null) {
    return <span className="text-muted-foreground">—</span>
  }
  return (
    <span
      className={`inline-flex items-center gap-1 justify-end tabular-nums ${
        needsPurchase ? 'text-destructive font-semibold' : 'text-foreground'
      }`}
    >
      {needsPurchase && <AlertTriangle className="size-3.5" />}
      {coveragePercentage.toFixed(1)}%
    </span>
  )
}

function classBadge(cls: 'A' | 'B' | 'C') {
  const styles = {
    A: 'bg-emerald-100 text-emerald-700',
    B: 'bg-amber-100 text-amber-700',
    C: 'bg-slate-100 text-slate-600',
  }
  return (
    <span
      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${styles[cls]}`}
    >
      {cls}
    </span>
  )
}

function RelatorioAbcPage() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { startDate, endDate } = Route.useSearch()

  const apiParams = useMemo(() => {
    if (!startDate || !endDate) return null
    const start = toIsoRangeStart(new Date(`${startDate}T12:00:00`))
    const end = toIsoRangeEnd(new Date(`${endDate}T12:00:00`))
    if (!start || !end) return null
    return { startDate: start, endDate: end }
  }, [startDate, endDate])

  const { data, isLoading, isError } = useGetReportsAbc(
    apiParams ?? { startDate: '', endDate: '' },
    { query: { enabled: !!apiParams } },
  )

  const stores = data?.stores ?? []

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      toast.success('Link copiado para a área de transferência.')
    })
  }

  function handleExportCsv() {
    if (stores.length === 0) return

    const header = [
      'Loja',
      'Rank',
      'SKU',
      'Faturamento (R$)',
      'Qtd. Vendas',
      'Unidades',
      '% do Total',
      '% Acumulado',
      'Classe',
      'Estoque Atual',
      'Vendas 90d',
      '% Cobertura de Estoque',
      'Precisa Comprar',
    ]
    const rows = stores.flatMap((store) =>
      store.items.map((item) => [
        store.store_name,
        item.rank,
        item.sku,
        (item.total_revenue / 100).toFixed(2).replace('.', ','),
        item.qty_sales,
        item.qty_units,
        item.percentage.toFixed(2).replace('.', ','),
        item.cumulative_percentage.toFixed(2).replace('.', ','),
        item.class,
        item.stock_qty,
        item.units_90d,
        item.coverage_percentage === null ? '—' : item.coverage_percentage.toFixed(2).replace('.', ','),
        item.needs_purchase ? 'Sim' : 'Não',
      ]),
    )

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
      .join('\n')

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `curva-abc-${startDate}-a-${endDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exportado com sucesso.')
  }

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
              Curva ABC
            </h1>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="glass-card p-6 rounded-2xl space-y-4">
        <p className="text-xs text-muted-foreground uppercase tracking-widest">Período</p>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Data inicial</label>
            <input
              type="date"
              value={startDate ?? ''}
              onChange={(e) =>
                navigate({ search: (prev) => ({ ...prev, startDate: e.target.value || undefined }) })
              }
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Data final</label>
            <input
              type="date"
              value={endDate ?? ''}
              onChange={(e) =>
                navigate({ search: (prev) => ({ ...prev, endDate: e.target.value || undefined }) })
              }
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            />
          </div>
          {stores.length > 0 && (
            <div className="flex gap-2 sm:ml-auto">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-2 h-10 px-4 rounded-xl border border-input bg-background text-sm text-foreground hover:bg-secondary transition-colors"
              >
                <Copy className="size-4" />
                Copiar link
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                className="flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Download className="size-4" />
                Exportar CSV
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Legenda */}
      {apiParams && !isLoading && !isError && stores.length > 0 && (
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">A</span>
            <span className="text-muted-foreground">Representam ~80% do faturamento</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">B</span>
            <span className="text-muted-foreground">Próximos ~15%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">C</span>
            <span className="text-muted-foreground">Cauda longa (~5%)</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-destructive" />
            <span className="text-muted-foreground">
              Cobertura de Estoque abaixo de 100% (estoque menor que as vendas dos últimos 90 dias) — precisa comprar
            </span>
          </div>
        </div>
      )}

      {/* Estado vazio */}
      {!apiParams && (
        <div className="glass-card p-12 rounded-2xl flex flex-col items-center justify-center gap-3 text-center">
          <FileBarChart2 className="size-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">
            Selecione o período para gerar a Curva ABC.
          </p>
        </div>
      )}

      {/* Loading */}
      {apiParams && isLoading && (
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="glass-card p-6 rounded-2xl animate-pulse space-y-3">
              <div className="h-6 bg-muted rounded w-48" />
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="h-9 bg-muted rounded" />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Erro */}
      {apiParams && isError && (
        <div className="glass-card p-6 rounded-2xl text-center text-destructive">
          Erro ao carregar o relatório. Tente novamente.
        </div>
      )}

      {/* Sem dados */}
      {apiParams && !isLoading && !isError && stores.length === 0 && (
        <div className="glass-card p-12 rounded-2xl flex flex-col items-center justify-center gap-3 text-center">
          <FileText className="size-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">Nenhuma venda com loja associada no período selecionado.</p>
        </div>
      )}

      {/* Tabelas por loja */}
      {apiParams && !isLoading && !isError && stores.map((store) => (
        <div key={store.store_name} className="glass-card rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between gap-3 p-6 border-b border-border">
            <div>
              <p className="font-bold text-lg text-foreground">{store.store_name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {store.items.length} SKU{store.items.length !== 1 ? 's' : ''} ·
                Total: {formatCents(store.total_revenue)}
              </p>
            </div>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span className="text-emerald-600 font-medium">
                {store.items.filter((i) => i.class === 'A').length} A
              </span>
              <span className="text-amber-600 font-medium">
                {store.items.filter((i) => i.class === 'B').length} B
              </span>
              <span className="text-slate-500 font-medium">
                {store.items.filter((i) => i.class === 'C').length} C
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left font-semibold text-foreground px-4 py-3 whitespace-nowrap w-14">#</th>
                  <th className="text-left font-semibold text-foreground px-4 py-3 whitespace-nowrap">SKU</th>
                  <th className="text-right font-semibold text-foreground px-4 py-3 whitespace-nowrap">Faturamento</th>
                  <th className="text-right font-semibold text-foreground px-4 py-3 whitespace-nowrap">Qtd. Vendas</th>
                  <th className="text-right font-semibold text-foreground px-4 py-3 whitespace-nowrap">Unidades</th>
                  <th className="text-right font-semibold text-foreground px-4 py-3 whitespace-nowrap">% Total</th>
                  <th className="text-right font-semibold text-foreground px-4 py-3 whitespace-nowrap">% Acum.</th>
                  <th className="text-center font-semibold text-foreground px-4 py-3 whitespace-nowrap w-20">Classe</th>
                  <th className="text-right font-semibold text-foreground px-4 py-3 whitespace-nowrap">Cobertura de Estoque</th>
                </tr>
              </thead>
              <tbody>
                {store.items.map((item, idx) => (
                  <tr
                    key={item.sku}
                    className={
                      idx % 2 === 0
                        ? 'border-b border-border/50'
                        : 'border-b border-border/50 bg-secondary/10'
                    }
                  >
                    <td className="px-4 py-2.5 tabular-nums text-muted-foreground">{item.rank}</td>
                    <td className="px-4 py-2.5 font-mono font-semibold text-foreground whitespace-nowrap">
                      {item.sku}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-foreground whitespace-nowrap">
                      {formatCents(item.total_revenue)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground whitespace-nowrap">
                      {item.qty_sales.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground whitespace-nowrap">
                      {item.qty_units.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground whitespace-nowrap">
                      {item.percentage.toFixed(1)}%
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground whitespace-nowrap">
                      {item.cumulative_percentage.toFixed(1)}%
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {classBadge(item.class)}
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      {coverageBadge(item.coverage_percentage, item.needs_purchase)}
                      <span className="block text-[10px] text-muted-foreground font-normal">
                        {item.stock_qty} em estoque · {item.units_90d} vendidos/90d
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
