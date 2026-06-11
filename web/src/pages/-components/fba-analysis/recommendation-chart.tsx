import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { mapRecommendationChartItems } from './formatters'
import type { FbaResultItem } from './types'

type FbaAnalysisRecommendationChartProps = {
  items: FbaResultItem[]
}

export function FbaAnalysisRecommendationChart({
  items,
}: FbaAnalysisRecommendationChartProps) {
  const chartData = mapRecommendationChartItems(items)

  if (chartData.length === 0) {
    return null
  }

  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      <div>
        <h3 className="text-xl font-display font-semibold">
          Top recomendacoes de envio
        </h3>
        <p className="text-sm text-muted-foreground">
          Comparativo dos SKUs com maior quantidade recomendada para envio ao
          FBA.
        </p>
      </div>

      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
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
              dataKey="sku"
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#6F7E86', fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#6F7E86', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                background: '#ffffff',
                border: '1px solid #D6DEE2',
                borderRadius: '12px',
              }}
            />
            <Bar
              dataKey="recommended"
              name="Enviar"
              fill="#1F5B72"
              radius={[8, 8, 0, 0]}
            />
            <Bar
              dataKey="stock"
              name="Estoque"
              fill="#3F8AA8"
              radius={[8, 8, 0, 0]}
            />
            <Bar
              dataKey="sold90d"
              name="Vendas 90d"
              fill="#87B7CC"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
