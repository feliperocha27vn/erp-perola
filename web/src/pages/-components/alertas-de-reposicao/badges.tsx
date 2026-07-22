import { AlertTriangle, TrendingUp } from 'lucide-react'
import type {
  ItemsReasonsEnumKey,
  ItemsSeverityEnumKey,
} from '@/api/types/reportsController/GetReportsRestockAlerts'

const REASON_LABEL: Record<ItemsReasonsEnumKey, string> = {
  perto_do_limite: 'Perto do limite',
  vendas_acelerando: 'Vendas acelerando',
}

export function SeverityBadge({
  severity,
}: {
  severity: ItemsSeverityEnumKey
}) {
  if (severity === 'critico') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-destructive/10 text-destructive">
        <AlertTriangle className="size-3.5" />
        Crítico
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
      <TrendingUp className="size-3.5" />
      Atenção
    </span>
  )
}

export function ReasonTags({ reasons }: { reasons: ItemsReasonsEnumKey[] }) {
  if (reasons.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {reasons.map(reason => (
        <span
          key={reason}
          className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200"
        >
          {REASON_LABEL[reason]}
        </span>
      ))}
    </div>
  )
}
