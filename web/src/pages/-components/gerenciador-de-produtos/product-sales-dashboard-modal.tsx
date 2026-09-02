import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MessageCircle } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useGetProductSalesDaily } from '@/api/hooks/productsController/useGetProductSalesDaily'
import type { GetProductSalesDaily200 } from '@/api/types/productsController/GetProductSalesDaily'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import type { ProductStockItem } from './types'

type SalesDailyStore = GetProductSalesDaily200['stores'][number]
type SalesDailyPeriod = SalesDailyStore['periods'][number]

const PERIODS = [15, 30, 60, 90] as const
type Period = (typeof PERIODS)[number]

type ProductSalesDashboardModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string
  productSku: string
  stocks: ProductStockItem[]
}

function formatUnits(units: number) {
  return `${units} unid.`
}

function buildProductStockSalesReport(
  sku: string,
  stocks: ProductStockItem[],
  stores: SalesDailyStore[]
) {
  const physicalStock = stocks
    .filter(stock => !stock.full)
    .reduce((acc, stock) => acc + stock.qtde, 0)
  const fullStock = stocks
    .filter(stock => stock.full)
    .reduce((acc, stock) => acc + stock.qtde, 0)

  const todas = stores.find(store => store.store_id === null)
  const units15d = todas?.periods.find(p => p.period === 15)?.total_units ?? 0
  const units90d = todas?.periods.find(p => p.period === 90)?.total_units ?? 0

  let topStore: { name: string; units: number } | null = null
  for (const store of stores) {
    if (store.store_id === null) continue
    const units = store.periods.find(p => p.period === 90)?.total_units ?? 0
    if (units > 0 && (!topStore || units > topStore.units)) {
      topStore = { name: store.store_name, units }
    }
  }

  const lines = [
    `*Relatório — SKU ${sku}*`,
    '',
    `Estoque físico: ${formatUnits(physicalStock)}`,
    `Estoque Full: ${formatUnits(fullStock)}`,
    `Total em estoque: ${formatUnits(physicalStock + fullStock)}`,
    '',
    `Vendas 15 dias: ${formatUnits(units15d)}`,
    `Vendas 90 dias: ${formatUnits(units90d)}`,
  ]

  if (topStore) {
    lines.push(
      `Loja que mais vende: ${topStore.name} (${formatUnits(topStore.units)} em 90 dias)`
    )
  }

  return lines.join('\n')
}

function PeriodSelector({
  active,
  onChange,
}: {
  active: Period
  onChange: (p: Period) => void
}) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-border p-1">
      {PERIODS.map(p => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
            active === p
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {p}d
        </button>
      ))}
    </div>
  )
}

function DailyChart({
  period,
  gradientId,
}: {
  period: SalesDailyPeriod
  gradientId: string
}) {
  const chartData = useMemo(
    () =>
      period.days.map(d => ({
        date: d.date,
        units: d.units,
        label: format(new Date(`${d.date}T12:00:00`), 'dd MMM', { locale: ptBR }),
        fullLabel: format(new Date(`${d.date}T12:00:00`), "dd 'de' MMMM", { locale: ptBR }),
      })),
    [period.days]
  )

  const wrapperRef = useRef<HTMLDivElement>(null)

  // Recharts só desativa o tooltip via onMouseLeave (mouse), e onTouchEnd não
  // dispara isso internamente — o tooltip fica "travado" após o toque. React
  // deriva onMouseLeave de eventos nativos mouseout/mouseover (não escuta
  // mouseleave diretamente), então despachamos um mouseout sintético com
  // relatedTarget fora da árvore para fechar o tooltip ao soltar o dedo.
  useEffect(() => {
    const wrapperEl = wrapperRef.current
    if (!wrapperEl) return

    const closeTooltip = () => {
      const rechartsWrapper = wrapperEl.querySelector<HTMLElement>(
        '.recharts-wrapper'
      )
      rechartsWrapper?.dispatchEvent(
        new MouseEvent('mouseout', {
          bubbles: true,
          relatedTarget: document.body,
        } as MouseEventInit)
      )
    }

    wrapperEl.addEventListener('touchend', closeTooltip, { passive: true })
    wrapperEl.addEventListener('touchcancel', closeTooltip, { passive: true })

    return () => {
      wrapperEl.removeEventListener('touchend', closeTooltip)
      wrapperEl.removeEventListener('touchcancel', closeTooltip)
    }
  }, [])

  if (chartData.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center">
        <p className="text-sm text-muted-foreground">Nenhuma venda neste período.</p>
      </div>
    )
  }

  return (
    <div ref={wrapperRef} className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1F5B72" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#1F5B72" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(111,126,134,0.2)" vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#6F7E86', fontSize: 11 }}
            interval="preserveStartEnd"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#6F7E86', fontSize: 11 }}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: '#ffffff',
              border: '1px solid #D6DEE2',
              borderRadius: '12px',
              color: '#163746',
              fontSize: 13,
            }}
            labelFormatter={(_, payload) => {
              const pt = payload?.[0]?.payload as { fullLabel?: string } | undefined
              return pt?.fullLabel ?? ''
            }}
            formatter={(value: number) => [`${value} un`, 'Vendidos']}
          />
          <Area
            type="monotone"
            dataKey="units"
            stroke="#1F5B72"
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4, fill: '#1F5B72' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function StoreView({ store }: { store: SalesDailyStore }) {
  const [activePeriod, setActivePeriod] = useState<Period>(30)
  const gradientId = useId()

  const period = store.periods.find(p => p.period === activePeriod) ?? store.periods[1]

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Unidades vendidas
          </p>
          <p className="text-3xl font-display font-bold text-primary tabular-nums">
            {period?.total_units ?? 0}
          </p>
        </div>
        <PeriodSelector active={activePeriod} onChange={setActivePeriod} />
      </div>
      {period ? (
        <DailyChart period={period} gradientId={gradientId} />
      ) : null}
    </div>
  )
}

function SkeletonView() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="h-8 w-36" />
      </div>
      <Skeleton className="h-[220px] w-full rounded-xl" />
    </div>
  )
}

export function ProductSalesDashboardModal({
  open,
  onOpenChange,
  productId,
  productSku,
  stocks,
}: ProductSalesDashboardModalProps) {
  const [activeStore, setActiveStore] = useState<string | null>(null)

  const { data, isLoading } = useGetProductSalesDaily(productId, {
    query: { enabled: open },
  })

  const stores = data?.stores ?? []
  const currentStoreId = activeStore === undefined ? null : activeStore
  const currentStore =
    stores.find(s => s.store_id === currentStoreId) ?? stores[0]

  const handleGenerateReport = () => {
    if (!data) return
    const message = buildProductStockSalesReport(productSku, stocks, data.stores)
    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer'
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex-row items-start justify-between gap-3 pr-8 space-y-0">
          <div>
            <DialogTitle>Dashboard de Vendas</DialogTitle>
            <DialogDescription>{productSku}</DialogDescription>
          </div>
          <button
            type="button"
            onClick={handleGenerateReport}
            disabled={!data}
            className="flex flex-shrink-0 items-center gap-2 h-9 px-3 rounded-xl bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-600/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            <MessageCircle className="size-4" />
            Gerar relatório
          </button>
        </DialogHeader>

        {isLoading ? (
          <>
            <Skeleton className="h-9 w-full rounded-xl" />
            <SkeletonView />
          </>
        ) : (
          <>
            <div className="flex gap-1 rounded-xl border border-border p-1 overflow-x-auto">
              {stores.map(store => (
                <button
                  key={store.store_id ?? 'todas'}
                  type="button"
                  onClick={() => setActiveStore(store.store_id)}
                  className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    (activeStore === null && store.store_id === null) ||
                    activeStore === store.store_id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {store.store_name}
                </button>
              ))}
            </div>

            {currentStore ? (
              <StoreView store={currentStore} />
            ) : (
              <div className="flex h-[280px] items-center justify-center">
                <p className="text-sm text-muted-foreground">Sem dados para exibir.</p>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
