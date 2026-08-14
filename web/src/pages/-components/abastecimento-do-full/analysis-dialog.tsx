import { AlertCircle, ExternalLink, RefreshCw, Sparkles } from 'lucide-react'
import { useEffect } from 'react'
import { usePostReportsFullReplenishmentAlertsAnalyze } from '@/api/hooks/reportsController/usePostReportsFullReplenishmentAlertsAnalyze'
import type { GetReportsFullReplenishmentAlerts200 } from '@/api/types/reportsController/GetReportsFullReplenishmentAlerts'
import type {
  PostReportsFullReplenishmentAlertsAnalyze200,
  PostReportsFullReplenishmentAlertsAnalyze200VerdictEnumKey,
} from '@/api/types/reportsController/PostReportsFullReplenishmentAlertsAnalyze'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type AlertItem = GetReportsFullReplenishmentAlerts200['alerts'][number]
type Analysis = PostReportsFullReplenishmentAlertsAnalyze200

export interface QuantityOverride {
  quantity: number
  sources: AlertItem['sources']
}

const VERDICT_STYLE: Record<
  PostReportsFullReplenishmentAlertsAnalyze200VerdictEnumKey,
  { label: string; className: string }
> = {
  antecipar: {
    label: 'Antecipar',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  manter: {
    label: 'Manter',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  segurar: {
    label: 'Segurar',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
  },
}

/**
 * Leitura crítica de uma linha. A quantidade da regra continua sendo o padrão:
 * o que a IA devolve é um fator já convertido em unidades pelo servidor, dentro
 * do que o estoque próprio permite, e só entra no rascunho se for escolhido aqui.
 */
export function AnalysisDialog({
  item,
  onClose,
  onApply,
}: {
  item: AlertItem | null
  onClose: () => void
  onApply: (stockId: string, override: QuantityOverride | null) => void
}) {
  const analyze = usePostReportsFullReplenishmentAlertsAnalyze()
  const { mutate, reset } = analyze

  useEffect(() => {
    if (!item) {
      reset()
      return
    }

    mutate({
      data: {
        product_id: item.product_id,
        stock_id: item.stock_id,
        refresh: false,
      },
    })
  }, [item, mutate, reset])

  return (
    <Dialog open={item !== null} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            Leitura de {item?.sku}
          </DialogTitle>
        </DialogHeader>

        {analyze.isPending && (
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Pesquisando o modelo e o calendário comercial…
            </p>
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded w-4/5 animate-pulse" />
            <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
          </div>
        )}

        {analyze.isError && (
          <div className="space-y-3 py-2">
            <p className="text-sm text-destructive flex items-start gap-2">
              <AlertCircle className="size-4 mt-0.5 shrink-0" />
              {errorMessage(analyze.error)}
            </p>
            <p className="text-xs text-muted-foreground">
              A quantidade sugerida pela regra não depende desta análise e
              continua valendo.
            </p>
          </div>
        )}

        {analyze.isSuccess && item && (
          <AnalysisBody
            item={item}
            analysis={analyze.data}
            onRefresh={() =>
              mutate({
                data: {
                  product_id: item.product_id,
                  stock_id: item.stock_id,
                  refresh: true,
                },
              })
            }
            onApply={override => {
              onApply(item.stock_id, override)
              onClose()
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function AnalysisBody({
  item,
  analysis,
  onRefresh,
  onApply,
}: {
  item: AlertItem
  analysis: Analysis
  onRefresh: () => void
  onApply: (override: QuantityOverride | null) => void
}) {
  const verdict = VERDICT_STYLE[analysis.verdict]
  const factor = analysis.seasonal_factor / 100
  const differs = analysis.adjusted_quantity !== analysis.suggested_quantity

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${verdict.className}`}
        >
          {verdict.label}
        </span>
        {factor !== 1 && (
          <span className="text-xs text-muted-foreground tabular-nums">
            fator {factor.toFixed(2).replace('.', ',')}×
          </span>
        )}
        {analysis.stale && (
          <span
            title="Esta leitura foi escrita quando o ritmo de saída era outro. Vale reanalisar."
            className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 cursor-help"
          >
            números mudaram desde a análise
          </span>
        )}
        {!analysis.grounded && (
          <span
            title="A cota de busca da API do Gemini estava esgotada, então esta leitura saiu só do que o modelo já sabia — sem conferir preço, ruptura de mercado ou descontinuação em fonte externa."
            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 cursor-help"
          >
            sem busca na web
          </span>
        )}
      </div>

      <p className="text-sm text-foreground">{analysis.identity}</p>

      <p className="text-sm text-muted-foreground">{analysis.rationale}</p>

      {analysis.critique && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-semibold text-amber-900 mb-1">
            Crítica à sugestão
          </p>
          <p className="text-xs text-amber-900">{analysis.critique}</p>
        </div>
      )}

      <div className="rounded-lg border border-border p-3 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Pela regra</span>
          <span className="tabular-nums font-semibold text-foreground">
            {analysis.suggested_quantity} unid.
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Com o fator sazonal</span>
          <span className="tabular-nums font-semibold text-foreground">
            {analysis.adjusted_quantity} unid.
          </span>
        </div>
        {analysis.adjustment_capped && (
          <p className="text-[11px] text-amber-700">
            O fator pedia mais do que o estoque próprio permite depois da
            reserva de venda direta. Ficou no que cabe.
          </p>
        )}
        {analysis.adjusted_sources.length > 1 && (
          <p className="text-[11px] text-muted-foreground">
            Sairia de{' '}
            {analysis.adjusted_sources
              .map(s => `${s.stock_title} (${s.quantity})`)
              .join(' e ')}
            .
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={!differs}
          onClick={() =>
            onApply({
              quantity: analysis.adjusted_quantity,
              sources: analysis.adjusted_sources,
            })
          }
        >
          Usar {analysis.adjusted_quantity} unid.
        </Button>
        <Button size="sm" variant="outline" onClick={() => onApply(null)}>
          Manter {item.suggested_quantity} da regra
        </Button>
        <Button size="sm" variant="ghost" className="gap-1.5" onClick={onRefresh}>
          <RefreshCw size={14} />
          Reanalisar
        </Button>
      </div>

      {analysis.sources.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-border">
          <p className="text-[11px] font-semibold text-muted-foreground pt-2">
            Fontes consultadas
          </p>
          {analysis.sources.map(source => (
            <a
              key={source.url}
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-[11px] text-primary hover:underline truncate"
            >
              <ExternalLink size={11} className="shrink-0" />
              <span className="truncate">{source.title}</span>
            </a>
          ))}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground">
        {analysis.from_cache ? 'Leitura em cache de ' : 'Analisado em '}
        {new Date(analysis.analyzed_at).toLocaleDateString('pt-BR')} ·{' '}
        {analysis.model}
      </p>
    </div>
  )
}

function errorMessage(error: unknown): string {
  const status = (error as { response?: { status?: number } })?.response?.status

  if (status === 501) {
    return 'A análise por IA não está configurada nesta instalação (falta GEMINI_API_KEY).'
  }
  if (status === 404) {
    return 'Esta linha saiu do relatório. Recarregue a página.'
  }
  return 'Não foi possível concluir a análise agora.'
}
