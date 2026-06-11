import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useId, useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { EmptyState } from '@/components/ui/empty-state'
import { SectionErrorState } from '@/components/ui/section-error-state'
import {
  calculateTotalRevenue,
  formatMoney,
  mapMonthlyRevenueData,
} from './formatters'
import { MonthlyRevenueChartSkeleton } from './monthly-revenue-chart-skeleton'

type MonthlyRevenueItem = {
  date: string
  total_cents: number
}

type MonthlyRevenueChartProps = {
  items: MonthlyRevenueItem[]
  dailyAverageCents: number
  isLoading: boolean
  isError?: boolean
  onRetry?: () => void
}

export function MonthlyRevenueChart({
  items,
  dailyAverageCents,
  isLoading,
  isError = false,
  onRetry,
}: MonthlyRevenueChartProps) {
  const gradientId = useId()

  const chartData = useMemo(
    () => mapMonthlyRevenueData(items, format, ptBR),
    [items]
  )

  const totalRevenue = useMemo(() => calculateTotalRevenue(items), [items])

  return (
    <div className="glass-card rounded-2xl p-6 md:p-8 space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-muted-foreground">
            Faturamento mensal
          </p>
          <h3 className="text-2xl font-display font-bold">Vendas por dia</h3>
        </div>
        <div className="text-left md:text-right">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end md:justify-end">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Total no periodo
              </p>
              <p className="text-2xl font-display font-bold text-primary">
                {formatMoney(totalRevenue)}
              </p>
            </div>

            <div className="sm:pl-4 sm:border-l sm:border-border">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Valor medio diario
              </p>
              <p className="text-lg font-display font-semibold text-primary/80">
                {formatMoney(dailyAverageCents / 100)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <MonthlyRevenueChartSkeleton />
      ) : isError ? (
        <SectionErrorState
          title="Nao foi possivel carregar o grafico"
          description="Verifique sua conexao e tente novamente."
          onRetry={onRetry}
          className="h-[320px] flex items-center"
        />
      ) : chartData.length === 0 ? (
        <EmptyState
          title="Nenhuma venda encontrada no periodo."
          className="h-[320px] flex flex-col justify-center"
        />
      ) : (
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1F5B72" stopOpacity={0.32} />
                  <stop offset="100%" stopColor="#1F5B72" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(111,126,134,0.25)"
                vertical={false}
              />
              <XAxis
                dataKey="dayLabel"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#6F7E86', fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#6F7E86', fontSize: 12 }}
                tickFormatter={(value: number) =>
                  `R$ ${Number(value).toFixed(0)}`
                }
              />
              <Tooltip
                contentStyle={{
                  background: '#ffffff',
                  border: '1px solid #D6DEE2',
                  borderRadius: '12px',
                  color: '#163746',
                }}
                labelFormatter={(_, payload) => {
                  const point = payload?.[0]?.payload as
                    | { fullDateLabel?: string }
                    | undefined
                  return point?.fullDateLabel ?? ''
                }}
                formatter={(value: number) => formatMoney(Number(value))}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#1F5B72"
                strokeWidth={2.5}
                fill={`url(#${gradientId})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
