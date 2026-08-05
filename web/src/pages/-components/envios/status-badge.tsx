import { PackageCheck, Send, Truck } from 'lucide-react'

export type ShipmentStatus = 'rascunho' | 'em_transito' | 'recebido'

export function ShipmentStatusBadge({ status }: { status: ShipmentStatus }) {
  if (status === 'recebido') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 whitespace-nowrap">
        <PackageCheck size={11} />
        Recebido
      </span>
    )
  }

  if (status === 'em_transito') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700 whitespace-nowrap">
        <Truck size={11} />
        Em trânsito
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 whitespace-nowrap">
      <Send size={11} />
      Rascunho
    </span>
  )
}
