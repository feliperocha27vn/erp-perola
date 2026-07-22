import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts'
import { type ChartConfig, ChartContainer } from '@/components/ui/chart'
import { EmptyState } from '@/components/ui/empty-state'
import { SectionErrorState } from '@/components/ui/section-error-state'
import {
  calculateTotalRevenue,
  formatMoney,
  mapDailyRevenueData,
} from './formatters'
import { RecentSalesChartSkeleton } from './recent-sales-chart-skeleton'

type DailyRevenueItem = {
  date: string
  total_cents: number
}

type RecentSalesChartProps = {
  items: DailyRevenueItem[]
  dailyAverageCents: number
  isLoading: boolean
  isError?: boolean
  onRetry?: () => void
}

const chartConfig = {
  total: {
    label: 'Faturamento',
    color: '#1F5B72',
  },
} satisfies ChartConfig

export function RecentSalesChart({
  items,
  dailyAverageCents,
  isLoading,
  isError = false,
  onRetry,
}: RecentSalesChartProps) {
  const chartData = useMemo(
    () => mapDailyRevenueData(items, format, ptBR),
    [items]
  )

  const totalRevenue = useMemo(() => calculateTotalRevenue(items), [items])

  return (
    <div className="glass-card rounded-2xl p-6 md:p-8 flex flex-col gap-6 h-full">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-muted-foreground">
            Últimos 15 dias
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
        <RecentSalesChartSkeleton />
      ) : isError ? (
        <SectionErrorState
          title="Nao foi possivel carregar o grafico"
          description="Verifique sua conexao e tente novamente."
          onRetry={onRetry}
          className="flex-1 min-h-[220px] flex items-center"
        />
      ) : chartData.length === 0 ? (
        <EmptyState
          title="Nenhuma venda encontrada no periodo."
          className="flex-1 min-h-[220px] flex flex-col justify-center"
        />
      ) : (
        <ChartContainer
          config={chartConfig}
          className="flex-1 min-h-[220px] w-full aspect-auto"
        >
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
          >
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
              cursor={{ fill: 'rgba(31,91,114,0.08)' }}
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
            <Bar dataKey="total" fill="var(--color-total)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartContainer>
      )}
    </div>
  )
}
