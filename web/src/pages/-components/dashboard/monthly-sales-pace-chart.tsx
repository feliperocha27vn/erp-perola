import { TrendingDown, TrendingUp } from 'lucide-react'
import { useMemo } from 'react'
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts'
import { type ChartConfig, ChartContainer } from '@/components/ui/chart'
import { EmptyState } from '@/components/ui/empty-state'
import { SectionErrorState } from '@/components/ui/section-error-state'
import { cn } from '@/lib/utils'
import {
  computePaceComparison,
  formatMoney,
  hasMonthlyPaceData,
  mapMonthlyPaceData,
  type MonthlySalesPacePoint,
} from './formatters'
import { MonthlySalesPaceChartSkeleton } from './monthly-sales-pace-chart-skeleton'

type MonthlySalesPaceChartProps = {
  items: MonthlySalesPacePoint[]
  isLoading: boolean
  isError?: boolean
  onRetry?: () => void
}

const chartConfig = {
  current: {
    label: 'Mês atual',
    color: '#1F5B72',
  },
  last: {
    label: 'Mês passado',
    color: '#9BB0B8',
  },
} satisfies ChartConfig

export function MonthlySalesPaceChart({
  items,
  isLoading,
  isError = false,
  onRetry,
}: MonthlySalesPaceChartProps) {
  const chartData = useMemo(() => mapMonthlyPaceData(items), [items])
  const comparison = useMemo(() => computePaceComparison(items), [items])
  const hasData = useMemo(() => hasMonthlyPaceData(items), [items])

  return (
    <div className="glass-card rounded-2xl p-6 md:p-8 flex flex-col gap-6 h-full">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-muted-foreground">
            Acumulado por dia do mês
          </p>
          <h3 className="text-2xl font-display font-bold">Ritmo de vendas</h3>
        </div>

        {comparison && (
          <div className="text-left md:text-right">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Faturado até o dia {comparison.day}
            </p>
            <div className="flex items-center gap-2 md:justify-end">
              <p className="text-2xl font-display font-bold text-primary">
                {formatMoney(comparison.currentCents / 100)}
              </p>
              {comparison.deltaPercent != null && (
                <span
                  className={cn(
                    'flex items-center gap-1 text-sm font-semibold',
                    comparison.deltaPercent >= 0
                      ? 'text-emerald-600'
                      : 'text-red-500'
                  )}
                >
                  {comparison.deltaPercent >= 0 ? (
                    <TrendingUp className="size-4" />
                  ) : (
                    <TrendingDown className="size-4" />
                  )}
                  {comparison.deltaPercent >= 0 ? '+' : ''}
                  {comparison.deltaPercent.toFixed(0)}%
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              vs {formatMoney(comparison.lastMonthCentsAtSameDay / 100)} no mês
              passado
            </p>
          </div>
        )}
      </div>

      {isLoading ? (
        <MonthlySalesPaceChartSkeleton />
      ) : isError ? (
        <SectionErrorState
          title="Não foi possível carregar o gráfico"
          description="Verifique sua conexão e tente novamente."
          onRetry={onRetry}
          className="flex-1 min-h-[240px] md:min-h-[320px] lg:min-h-[380px] flex items-center"
        />
      ) : !hasData ? (
        <EmptyState
          title="Nenhuma venda encontrada neste mês ou no mês passado."
          className="flex-1 min-h-[240px] md:min-h-[320px] lg:min-h-[380px] flex flex-col justify-center"
        />
      ) : (
        <ChartContainer
          config={chartConfig}
          className="flex-1 min-h-[240px] md:min-h-[320px] lg:min-h-[380px] w-full aspect-auto"
        >
          <LineChart
            data={chartData}
            margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(111,126,134,0.25)"
              vertical={false}
            />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#6F7E86', fontSize: 12 }}
              tickFormatter={(value: number) => `${value}`}
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
              cursor={{ stroke: 'rgba(31,91,114,0.3)', strokeWidth: 1 }}
              contentStyle={{
                background: '#ffffff',
                border: '1px solid #D6DEE2',
                borderRadius: '12px',
                color: '#163746',
              }}
              labelFormatter={(value: number) => `Dia ${value}`}
              formatter={(value: number, name) => [
                formatMoney(Number(value)),
                name === 'current' ? 'Mês atual' : 'Mês passado',
              ]}
            />
            <Line
              type="monotone"
              dataKey="current"
              stroke="var(--color-current)"
              strokeWidth={2.5}
              dot={false}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="last"
              stroke="var(--color-last)"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              connectNulls={false}
            />
          </LineChart>
        </ChartContainer>
      )}
    </div>
  )
}
