import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Copy, Download, FileText } from 'lucide-react'
import { useMemo } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { useGetReportsSales } from '@/api/hooks/reportsController/useGetReportsSales'
import { BackToDashboardButton } from '@/components/back-to-dashboard-button'
import { toIsoRangeEnd, toIsoRangeStart } from './-components/sales-manager/formatters'

const searchSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export const Route = createFileRoute('/relatorio-de-vendas')({
  component: RelatorioDeVendasPage,
  validateSearch: searchSchema,
})

function formatCents(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
  })
}

function RelatorioDeVendasPage() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { startDate, endDate } = Route.useSearch()

  const apiParams = useMemo(() => {
    if (!startDate || !endDate) return null
    const start = toIsoRangeStart(new Date(`${startDate}T12:00:00`))
    const end = toIsoRangeEnd(new Date(`${endDate}T12:00:00`))
    if (!start || !end) return null
    return { startDate: start, endDate: end }
  }, [startDate, endDate])

  const { data, isLoading, isError } = useGetReportsSales(
    apiParams ?? { startDate: '', endDate: '' },
    { query: { enabled: !!apiParams } },
  )

  const items = data?.items ?? []

  const totals = useMemo(
    () => ({
      quantity: items.reduce((s, r) => s + r.quantity, 0),
      total_price: items.reduce((s, r) => s + r.total_price, 0),
    }),
    [items],
  )

  function handleExportCsv() {
    if (items.length === 0) return

    const header = ['Data', 'SKU', 'Loja', 'Canal', 'Depósito', 'Qtde', 'Valor Unit. (R$)', 'Total (R$)']
    const rows = items.map((r) => [
      formatDate(r.sale_date),
      r.sku,
      r.store_name ?? '—',
      r.channel,
      r.stock_title,
      r.quantity,
      (r.sale_price / 100).toFixed(2).replace('.', ','),
      (r.total_price / 100).toFixed(2).replace('.', ','),
    ])

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
      .join('\n')

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-vendas-${startDate}-a-${endDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exportado com sucesso.')
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      toast.success('Link copiado para a área de transferência.')
    })
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
              Relatório de Vendas
            </h1>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="glass-card p-6 rounded-2xl space-y-4">
        <p className="text-xs text-muted-foreground uppercase tracking-widest">
          Período
        </p>
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
          {items.length > 0 && (
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

      {/* Estado vazio */}
      {!apiParams && (
        <div className="glass-card p-12 rounded-2xl flex flex-col items-center justify-center gap-3 text-center">
          <FileText className="size-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">
            Selecione o período para gerar o relatório de vendas.
          </p>
        </div>
      )}

      {/* Loading */}
      {apiParams && isLoading && (
        <div className="glass-card p-6 rounded-2xl animate-pulse space-y-3">
          <div className="h-6 bg-muted rounded w-48" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 bg-muted rounded" />
          ))}
        </div>
      )}

      {/* Erro */}
      {apiParams && isError && (
        <div className="glass-card p-6 rounded-2xl text-center text-destructive">
          Erro ao carregar o relatório. Tente novamente.
        </div>
      )}

      {/* Tabela */}
      {apiParams && !isLoading && !isError && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 p-6 border-b border-border">
            <FileText className="size-5 text-primary" />
            <div>
              <p className="font-semibold text-foreground">
                {startDate && endDate
                  ? `${new Date(`${startDate}T12:00:00`).toLocaleDateString('pt-BR')} — ${new Date(`${endDate}T12:00:00`).toLocaleDateString('pt-BR')}`
                  : ''}
              </p>
              <p className="text-xs text-muted-foreground">
                {items.length} venda{items.length !== 1 ? 's' : ''}
                {items.length > 0 ? ` · Total: ${formatCents(totals.total_price)}` : ''}
              </p>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              Nenhuma venda encontrada no período selecionado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left font-semibold text-foreground px-4 py-3 whitespace-nowrap">Data</th>
                    <th className="text-left font-semibold text-foreground px-4 py-3 whitespace-nowrap">SKU</th>
                    <th className="text-left font-semibold text-foreground px-4 py-3 whitespace-nowrap">Loja</th>
                    <th className="text-left font-semibold text-foreground px-4 py-3 whitespace-nowrap">Canal</th>
                    <th className="text-left font-semibold text-foreground px-4 py-3 whitespace-nowrap">Depósito</th>
                    <th className="text-right font-semibold text-foreground px-4 py-3 whitespace-nowrap">Qtde</th>
                    <th className="text-right font-semibold text-foreground px-4 py-3 whitespace-nowrap">Valor Unit.</th>
                    <th className="text-right font-semibold text-foreground px-4 py-3 whitespace-nowrap">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row, idx) => (
                    <tr
                      key={idx}
                      className={
                        idx % 2 === 0
                          ? 'border-b border-border/50'
                          : 'border-b border-border/50 bg-secondary/10'
                      }
                    >
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap tabular-nums">
                        {formatDate(row.sale_date)}
                      </td>
                      <td className="px-4 py-3 font-mono text-foreground whitespace-nowrap">
                        {row.sku}
                      </td>
                      <td className="px-4 py-3 text-foreground whitespace-nowrap">
                        {row.store_name ?? <span className="text-muted-foreground/50">—</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-foreground">
                          {row.channel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground whitespace-nowrap">
                        {row.stock_title}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-foreground whitespace-nowrap">
                        {row.quantity}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-foreground whitespace-nowrap">
                        {formatCents(row.sale_price)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-foreground whitespace-nowrap">
                        {formatCents(row.total_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-secondary/20">
                    <td colSpan={5} className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">
                      Total geral
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-foreground whitespace-nowrap">
                      {totals.quantity}
                    </td>
                    <td />
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-primary whitespace-nowrap">
                      {formatCents(totals.total_price)}
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
