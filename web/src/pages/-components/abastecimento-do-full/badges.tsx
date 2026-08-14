import { AlertTriangle, Clock, Timer } from 'lucide-react'
import type {
  AlertsMarketplaceEnumKey,
  AlertsSeverityEnumKey,
  AlertsShortfallReasonEnumKey,
  GetReportsFullReplenishmentAlerts200,
  IdleReasonEnumKey,
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

/** Por que aquele saldo está parado — cada motivo pede uma ação diferente. */
export function IdleReasonBadge({
  reason,
  winnerStockTitle,
}: {
  reason: IdleReasonEnumKey
  winnerStockTitle: string | null
}) {
  if (reason === 'conta_secundaria') {
    return (
      <span
        title={`Este SKU foi concentrado em ${winnerStockTitle ?? 'outra conta'}, que vende mais nos últimos 90 dias. Esta conta não recebe mais abastecimento dele — deixe escoar ou retire.`}
        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-violet-50 text-violet-700 border-violet-200 whitespace-nowrap"
      >
        concentrado em {winnerStockTitle ?? 'outra conta'}
      </span>
    )
  }

  if (reason === 'sem_venda') {
    return (
      <span
        title="Nenhuma unidade saiu deste depósito nos últimos 90 dias."
        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-slate-100 text-slate-700 border-slate-200 whitespace-nowrap"
      >
        sem venda em 90d
      </span>
    )
  }

  return (
    <span
      title="A cobertura passa do teto de dias do marketplace. Acima disso o CD vira custo."
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-amber-50 text-amber-700 border-amber-200 whitespace-nowrap"
    >
      acima do teto
    </span>
  )
}

type AlertItem = GetReportsFullReplenishmentAlerts200['alerts'][number]

const SHORTFALL_LABEL: Record<AlertsShortfallReasonEnumKey, string> = {
  sem_estoque_fisico: 'sem estoque próprio',
  estoque_insuficiente: 'físico não cobre',
  reserva_venda_direta: 'reservado p/ venda direta',
  rascunho_pendente: 'preso em rascunho',
  dividido_entre_cds: 'dividido com outro CD',
}

/**
 * Por que a sugestão saiu menor que o necessário, com os números que sustentam
 * a frase. Antes a tela dizia só "limitado pelo físico" ao lado de um saldo
 * físico visivelmente maior que zero — dois dados que se contradiziam.
 */
function shortfallDetail(item: AlertItem): string {
  const falta = `Precisa de ${item.needed_quantity} e ${
    item.suggested_quantity > 0
      ? `só ${item.suggested_quantity} cabem agora`
      : 'nenhuma cabe agora'
  }.`

  switch (item.shortfall_reason) {
    case 'sem_estoque_fisico':
      return `${falta} Não há nenhuma unidade deste produto em depósito próprio — isso é caso de compra, não de abastecimento. Veja o Alerta de Reposição.`
    case 'estoque_insuficiente':
      return `${falta} O estoque próprio inteiro soma ${item.physical_total_qty} unidade(s).`
    case 'reserva_venda_direta':
      return `${falta} Há ${item.physical_total_qty} no estoque próprio, mas ${item.physical_reserved_qty} ficam reservadas para as vendas diretas dos próximos 15 dias. Sobram ${item.physical_available_qty} para abastecer.`
    case 'rascunho_pendente':
      return `${falta} ${item.physical_committed_qty} unidade(s) do estoque próprio já estão prometidas a um envio em rascunho. Despache ou apague o rascunho para liberar.`
    case 'dividido_entre_cds':
      return `${falta} As ${item.physical_available_qty} unidades disponíveis foram para o centro de distribuição que fica sem estoque primeiro.`
    default:
      return falta
  }
}

export function ShortfallTag({ item }: { item: AlertItem }) {
  if (item.shortfall_reason === null) return null

  return (
    <div
      title={shortfallDetail(item)}
      className="text-[10px] text-amber-700 cursor-help"
    >
      {SHORTFALL_LABEL[item.shortfall_reason]}
    </div>
  )
}

/** De onde sai a mercadoria. Só aparece quando o envio nasce dividido. */
export function SourceBreakdown({ item }: { item: AlertItem }) {
  if (item.sources.length < 2) return null

  return (
    <div
      title="O envio sai de mais de um depósito próprio — cada origem vira um item do rascunho."
      className="text-[10px] text-muted-foreground cursor-help"
    >
      {item.sources.map(s => `${s.stock_title} ${s.quantity}`).join(' · ')}
    </div>
  )
}

export function EstimatedRateTag() {
  return (
    <span
      title="O depósito teve estoque por poucos dias na janela. O ritmo usa só as vendas dele, mas diluídas por 14 dias, para não extrapolar a partir de uma amostra curta."
      className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200"
    >
      <Clock className="size-2.5" />
      estimado
    </span>
  )
}
