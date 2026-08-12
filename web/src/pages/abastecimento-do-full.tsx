import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { PackageCheck, PackagePlus, Send, Warehouse } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useGetReportsFullReplenishmentAlerts } from '@/api/hooks/reportsController/useGetReportsFullReplenishmentAlerts'
import { useGetShipmentAccounts } from '@/api/hooks/shipmentAccountsController/useGetShipmentAccounts'
import { usePostShipments } from '@/api/hooks/shipmentsController/usePostShipments'
import type { GetReportsFullReplenishmentAlerts200 } from '@/api/types/reportsController/GetReportsFullReplenishmentAlerts'
import { BackToDashboardButton } from '@/components/back-to-dashboard-button'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { SectionErrorState } from '@/components/ui/section-error-state'
import { queryClient } from '@/lib/react-query'
import {
  AutonomyValue,
  EstimatedRateTag,
  IdleReasonBadge,
  MarketplaceBadge,
  SeverityBadge,
} from './-components/abastecimento-do-full/badges'

export const Route = createFileRoute('/abastecimento-do-full')({
  component: AbastecimentoDoFullPage,
})

type AlertItem = GetReportsFullReplenishmentAlerts200['alerts'][number]
type IdleItem = GetReportsFullReplenishmentAlerts200['idle'][number]

interface DepotGroup {
  stockTitle: string
  marketplace: AlertItem['marketplace']
  items: AlertItem[]
}

/**
 * Um envio vai para um centro de distribuicao so, entao os alertas sao agrupados
 * pelo deposito de destino — cada grupo vira um rascunho separado.
 */
function groupByDepot(alerts: AlertItem[]): DepotGroup[] {
  const map = new Map<string, DepotGroup>()

  for (const item of alerts) {
    const group = map.get(item.stock_title)
    if (group) {
      group.items.push(item)
    } else {
      map.set(item.stock_title, {
        stockTitle: item.stock_title,
        marketplace: item.marketplace,
        items: [item],
      })
    }
  }

  return [...map.values()].sort((a, b) => a.stockTitle.localeCompare(b.stockTitle))
}

function AbastecimentoDoFullPage() {
  const { data, isLoading, isError, refetch } =
    useGetReportsFullReplenishmentAlerts()

  const alerts = useMemo(() => data?.alerts ?? [], [data])
  const idle = data?.idle ?? []
  const groups = useMemo(() => groupByDepot(alerts), [alerts])

  const criticoCount = alerts.filter(a => a.severity === 'critico').length
  const atencaoCount = alerts.filter(a => a.severity === 'atencao').length

  const [depotToShip, setDepotToShip] = useState<DepotGroup | null>(null)

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4">
        <BackToDashboardButton />
        <div className="space-y-1">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            Relatórios
          </h2>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-foreground">
            Abastecimento do Full
          </h1>
        </div>
      </div>

      {!isLoading && !isError && (
        <p className="text-sm text-muted-foreground max-w-3xl">
          Dias de autonomia de cada produto em cada centro de distribuição, no
          ritmo de saída dos últimos 90 dias. O alerta dispara antes que o
          estoque acabe dentro do prazo de entrega daquele marketplace — ML Full
          conta 7 dias, Amazon FBA 14. Dentro de cada marketplace, o SKU é
          abastecido em uma conta só: a que mais vendeu na janela.
        </p>
      )}

      {isLoading && (
        <div className="glass-card p-6 rounded-2xl animate-pulse space-y-3">
          <div className="h-6 bg-muted rounded w-48" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 bg-muted rounded" />
          ))}
        </div>
      )}

      {isError && (
        <SectionErrorState
          title="Não foi possível carregar o abastecimento"
          description="Verifique sua conexão e tente novamente."
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && alerts.length === 0 && (
        <div className="glass-card p-12 rounded-2xl flex flex-col items-center justify-center gap-3 text-center">
          <PackageCheck className="size-12 text-emerald-500" />
          <p className="text-muted-foreground">
            Nenhum centro de distribuição precisa de abastecimento agora.
          </p>
        </div>
      )}

      {!isLoading && !isError && alerts.length > 0 && (
        <div className="flex flex-wrap gap-3 text-xs">
          <span className="text-destructive font-semibold">
            {criticoCount} crítico{criticoCount !== 1 ? 's' : ''} — vai acabar
            antes do envio chegar
          </span>
          <span className="text-amber-700 font-semibold">
            {atencaoCount} em atenção — está na hora de enviar
          </span>
        </div>
      )}

      {groups.map(group => (
        <DepotSection
          key={group.stockTitle}
          group={group}
          onGenerate={() => setDepotToShip(group)}
        />
      ))}

      {!isLoading && !isError && idle.length > 0 && <IdleSection items={idle} />}

      <GenerateShipmentDialog
        group={depotToShip}
        onClose={() => setDepotToShip(null)}
      />
    </div>
  )
}

function DepotSection({
  group,
  onGenerate,
}: {
  group: DepotGroup
  onGenerate: () => void
}) {
  const shippable = group.items.filter(i => i.suggested_quantity > 0)
  const totalUnits = shippable.reduce((sum, i) => sum + i.suggested_quantity, 0)

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
            <Warehouse className="size-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-lg text-foreground">
                {group.stockTitle}
              </p>
              <MarketplaceBadge marketplace={group.marketplace} />
            </div>
            <p className="text-xs text-muted-foreground">
              {group.items.length} produto
              {group.items.length !== 1 ? 's' : ''} ·{' '}
              {totalUnits > 0
                ? `${totalUnits} unidade${totalUnits !== 1 ? 's' : ''} sugerida${totalUnits !== 1 ? 's' : ''}`
                : 'sem estoque físico disponível'}
            </p>
          </div>
        </div>

        <Button
          size="sm"
          className="gap-2"
          disabled={shippable.length === 0}
          onClick={onGenerate}
        >
          <PackagePlus size={15} />
          Gerar rascunho
        </Button>
      </div>

      {/* Desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="text-left font-semibold text-foreground px-4 py-3 whitespace-nowrap">
                SKU
              </th>
              <th className="text-left font-semibold text-foreground px-4 py-3 whitespace-nowrap">
                Marca
              </th>
              <th className="text-right font-semibold text-foreground px-4 py-3 whitespace-nowrap">
                No CD
              </th>
              <th className="text-right font-semibold text-foreground px-4 py-3 whitespace-nowrap">
                Em trânsito
              </th>
              <th className="text-right font-semibold text-foreground px-4 py-3 whitespace-nowrap">
                Ritmo/dia
              </th>
              <th className="text-right font-semibold text-foreground px-4 py-3 whitespace-nowrap">
                Autonomia
              </th>
              <th className="text-right font-semibold text-foreground px-4 py-3 whitespace-nowrap">
                Enviar
              </th>
              <th className="text-left font-semibold text-foreground px-4 py-3 whitespace-nowrap">
                Situação
              </th>
            </tr>
          </thead>
          <tbody>
            {group.items.map((item, idx) => (
              <tr
                key={item.stock_id}
                className={
                  idx % 2 === 0
                    ? 'border-b border-border/50'
                    : 'border-b border-border/50 bg-secondary/10'
                }
              >
                <td className="px-4 py-2.5 font-mono font-semibold text-foreground whitespace-nowrap">
                  {item.sku}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                  {item.brand_name ?? 'Sem marca'}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-foreground whitespace-nowrap">
                  {item.available_qty}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground whitespace-nowrap">
                  {item.in_transit_qty > 0 ? item.in_transit_qty : '—'}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground whitespace-nowrap">
                  {item.demand_rate_per_day.toFixed(2)}
                  {item.rate_is_estimated && (
                    <div className="mt-0.5">
                      <EstimatedRateTag />
                    </div>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right whitespace-nowrap">
                  <AutonomyValue
                    days={item.days_of_autonomy}
                    reorderPoint={item.reorder_point_days}
                  />
                </td>
                <td className="px-4 py-2.5 text-right whitespace-nowrap">
                  <span className="tabular-nums font-bold text-foreground">
                    {item.suggested_quantity}
                  </span>
                  {item.limited_by_physical_stock && (
                    <div
                      title={`O estoque físico disponível (${item.physical_available_qty}) não cobre tudo que este depósito precisa. Quem tinha menos autonomia foi servido primeiro.`}
                      className="text-[10px] text-amber-700"
                    >
                      limitado pelo físico
                    </div>
                  )}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  <SeverityBadge severity={item.severity} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden divide-y divide-border">
        {group.items.map(item => (
          <div key={item.stock_id} className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono font-semibold text-foreground">
                  {item.sku}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.brand_name ?? 'Sem marca'}
                </p>
              </div>
              <SeverityBadge severity={item.severity} />
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>
                No CD:{' '}
                <span className="text-foreground font-medium tabular-nums">
                  {item.available_qty}
                </span>
              </span>
              {item.in_transit_qty > 0 && (
                <span>
                  Em trânsito:{' '}
                  <span className="text-foreground font-medium tabular-nums">
                    {item.in_transit_qty}
                  </span>
                </span>
              )}
              <span>
                Autonomia:{' '}
                <AutonomyValue
                  days={item.days_of_autonomy}
                  reorderPoint={item.reorder_point_days}
                />
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-xs text-muted-foreground">
                Enviar{' '}
                <span className="text-foreground font-bold tabular-nums text-sm">
                  {item.suggested_quantity}
                </span>{' '}
                unid.
              </span>
              {item.rate_is_estimated && <EstimatedRateTag />}
            </div>

            {item.limited_by_physical_stock && (
              <p className="text-[11px] text-amber-700">
                Limitado pelo estoque físico disponível ({item.physical_available_qty}).
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function IdleSection({ items }: { items: IdleItem[] }) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-border space-y-1">
        <p className="font-bold text-lg text-foreground">
          Estoque parado no Full
        </p>
        <p className="text-xs text-muted-foreground max-w-3xl">
          {items.length} depósito{items.length !== 1 ? 's' : ''} com estoque que
          a saída não justifica — seja por excesso, seja porque o SKU foi
          concentrado em outra conta do mesmo marketplace. No ML Full, 90 dias
          sem venda abre prazo de retirada e acima de 6 meses o custo sobe 6,4%;
          na Amazon, o excesso derruba seu IPI e reduz quanto você consegue
          enviar. São também unidades que não estão no físico para socorrer outro
          CD.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="text-left font-semibold text-foreground px-4 py-3 whitespace-nowrap">
                SKU
              </th>
              <th className="text-left font-semibold text-foreground px-4 py-3 whitespace-nowrap">
                Depósito
              </th>
              <th className="text-right font-semibold text-foreground px-4 py-3 whitespace-nowrap">
                Parado
              </th>
              <th className="text-right font-semibold text-foreground px-4 py-3 whitespace-nowrap">
                Vendas 90d
              </th>
              <th className="text-right font-semibold text-foreground px-4 py-3 whitespace-nowrap">
                Autonomia
              </th>
              <th className="text-left font-semibold text-foreground px-4 py-3 whitespace-nowrap">
                Motivo
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr
                key={item.stock_id}
                className={
                  idx % 2 === 0
                    ? 'border-b border-border/50'
                    : 'border-b border-border/50 bg-secondary/10'
                }
              >
                <td className="px-4 py-2.5 font-mono font-semibold text-foreground whitespace-nowrap">
                  {item.sku}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  <span className="text-foreground">{item.stock_title}</span>{' '}
                  <MarketplaceBadge marketplace={item.marketplace} />
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-foreground whitespace-nowrap">
                  {item.qtde}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground whitespace-nowrap">
                  {item.units_window}
                </td>
                <td className="px-4 py-2.5 text-right whitespace-nowrap">
                  <AutonomyValue days={item.days_of_autonomy} />
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  <IdleReasonBadge
                    reason={item.reason}
                    winnerStockTitle={item.winner_stock_title}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function GenerateShipmentDialog({
  group,
  onClose,
}: {
  group: DepotGroup | null
  onClose: () => void
}) {
  const navigate = useNavigate()
  const { data: accountsData } = useGetShipmentAccounts()
  const accounts = accountsData?.accounts ?? []

  const [accountId, setAccountId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))

  const createMutation = usePostShipments()

  const shippable = group?.items.filter(i => i.suggested_quantity > 0) ?? []
  const totalUnits = shippable.reduce((sum, i) => sum + i.suggested_quantity, 0)

  async function handleGenerate() {
    if (!group) return

    if (!accountId) {
      toast.error('Selecione a conta de destino.')
      return
    }

    const items = shippable
      .filter(i => i.physical_stock_id !== null)
      .map(i => ({
        product_id: i.product_id,
        quantity: i.suggested_quantity,
        source_stock_id: i.physical_stock_id as string,
        destination_stock_id: i.stock_id,
      }))

    if (items.length === 0) {
      toast.error('Nenhum item tem estoque físico de origem definido.')
      return
    }

    try {
      const res = await createMutation.mutateAsync({
        data: {
          account_id: accountId,
          date: new Date(`${date}T12:00:00`).toISOString(),
          notes: `Abastecimento sugerido — ${group.stockTitle}`,
          items,
        },
      })

      queryClient.invalidateQueries({ queryKey: [{ url: '/shipments' }] })
      toast.success('Rascunho gerado. Revise antes de despachar.')
      onClose()
      navigate({
        to: '/envios/novo',
        search: { shipmentId: res.shipment.id },
      })
    } catch {
      toast.error('Erro ao gerar o rascunho de envio.')
    }
  }

  return (
    <Dialog open={group !== null} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gerar rascunho — {group?.stockTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {shippable.length} produto{shippable.length !== 1 ? 's' : ''},{' '}
            {totalUnits} unidade{totalUnits !== 1 ? 's' : ''}. O rascunho não
            move estoque — você revisa e despacha depois.
          </p>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Conta de destino
            </label>
            <select
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              className="w-full h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Selecionar conta…</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Data do envio
            </label>
            <Input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="h-11"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="gap-2"
            disabled={createMutation.isPending}
            onClick={handleGenerate}
          >
            <Send size={15} />
            Gerar rascunho
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
