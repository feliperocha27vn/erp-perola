import { formatInteger } from './formatters'
import type { FbaSummary } from './types'

type FbaAnalysisSummaryCardsProps = {
  summary: FbaSummary
}

export function FbaAnalysisSummaryCards({
  summary,
}: FbaAnalysisSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="glass-card p-5 rounded-2xl space-y-1">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Linhas do CSV
        </p>
        <p className="text-3xl font-display font-bold">
          {formatInteger(summary.total_rows)}
        </p>
      </div>

      <div className="glass-card p-5 rounded-2xl space-y-1">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Itens analisados
        </p>
        <p className="text-3xl font-display font-bold text-primary">
          {formatInteger(summary.analyzed_items)}
        </p>
      </div>

      <div className="glass-card p-5 rounded-2xl space-y-1">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Unidades recomendadas
        </p>
        <p className="text-3xl font-display font-bold text-primary">
          {formatInteger(summary.total_recommended_units)}
        </p>
      </div>

      <div className="glass-card p-5 rounded-2xl space-y-1">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Top SKU
        </p>
        <p className="text-xl font-display font-bold">
          {summary.top_sku_by_recommendation ?? '-'}
        </p>
      </div>
    </div>
  )
}
