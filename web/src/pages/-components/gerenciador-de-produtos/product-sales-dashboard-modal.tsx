import { Dialog } from '@base-ui/react/dialog'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useId, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { useGetProductSalesDaily } from '@/api/hooks/productsController/useGetProductSalesDaily'
import type { GetProductSalesDaily200 } from '@/api/types/productsController/GetProductSalesDaily'

type SalesDailyStore = GetProductSalesDaily200['stores'][number]
type SalesDailyPeriod = SalesDailyStore['periods'][number]

const PERIODS = [15, 30, 60, 90] as const
type Period = (typeof PERIODS)[number]

type ProductSalesDashboardModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string
  productSku: string
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

  if (chartData.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center">
        <p className="text-sm text-muted-foreground">Nenhuma venda neste período.</p>
      </div>
    )
  }

  return (
    <div className="h-[220px] w-full">
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
      <div className="flex items-center justify-between">
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
}: ProductSalesDashboardModalProps) {
  const [activeStore, setActiveStore] = useState<string | null>(null)

  const { data, isLoading } = useGetProductSalesDaily(productId, {
    query: { enabled: open },
  })

  const stores = data?.stores ?? []
  const currentStoreId = activeStore === undefined ? null : activeStore
  const currentStore =
    stores.find(s => s.store_id === currentStoreId) ?? stores[0]

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-background border border-border shadow-2xl p-6 space-y-5 focus:outline-none max-h-[90vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-display font-semibold">Dashboard de Vendas</h2>
              <p className="text-sm text-muted-foreground">{productSku}</p>
            </div>
            <Dialog.Close className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </Dialog.Close>
          </div>

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
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
