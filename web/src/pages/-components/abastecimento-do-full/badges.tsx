import { AlertTriangle, Clock, Timer } from 'lucide-react'
import type {
  AlertsMarketplaceEnumKey,
  AlertsSeverityEnumKey,
} from '@/api/types/reportsController/GetReportsFullReplenishmentAlerts'

const MARKETPLACE_LABEL: Record<AlertsMarketplaceEnumKey, string> = {
  mercado_livre: 'ML Full',
  amazon: 'Amazon FBA',
  shopee: 'Shopee',
}

const MARKETPLACE_STYLE: Record<AlertsMarketplaceEnumKey, string> = {
  mercado_livre: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  amazon: 'bg-slate-100 text-slate-700 border-slate-200',
  shopee: 'bg-orange-100 text-orange-700 border-orange-200',
}

export function MarketplaceBadge({
  marketplace,
}: {
  marketplace: AlertsMarketplaceEnumKey
}) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${MARKETPLACE_STYLE[marketplace]}`}
    >
      {MARKETPLACE_LABEL[marketplace]}
    </span>
  )
}

export function SeverityBadge({
  severity,
}: {
  severity: AlertsSeverityEnumKey
}) {
  if (severity === 'critico') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-destructive/10 text-destructive whitespace-nowrap">
        <AlertTriangle className="size-3.5" />
        Crítico
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 whitespace-nowrap">
      <Timer className="size-3.5" />
      Atenção
    </span>
  )
}

/** Dias de autonomia. null = sem venda na janela, entao nao ha o que projetar. */
export function AutonomyValue({
  days,
  reorderPoint,
}: {
  days: number | null
  reorderPoint?: number
}) {
  if (days === null) {
    return <span className="text-muted-foreground">sem vendas</span>
  }

  const isUrgent = reorderPoint !== undefined && days < reorderPoint

  return (
    <span
      className={`tabular-nums font-semibold ${isUrgent ? 'text-destructive' : 'text-foreground'}`}
    >
      {days.toFixed(days < 10 ? 1 : 0)}
      <span className="text-muted-foreground font-normal text-xs ml-1">
        dias
      </span>
    </span>
  )
}

export function EstimatedRateTag() {
  return (
    <span
      title="O depósito teve estoque por poucos dias na janela, então o ritmo foi estimado pela média dos outros depósitos deste produto."
      className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200"
    >
      <Clock className="size-2.5" />
      estimado
    </span>
  )
}
