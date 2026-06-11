import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { mapComparisonChartItems } from './formatters'
import type { FbaResultItem } from './types'

type FbaAnalysisProductComparisonChartProps = {
  item: FbaResultItem
}

export function FbaAnalysisProductComparisonChart({
  item,
}: FbaAnalysisProductComparisonChartProps) {
  const chartData = mapComparisonChartItems(item)

  return (
    <div className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#6F7E86', fontSize: 11 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#6F7E86', fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{
              background: '#ffffff',
              border: '1px solid #D6DEE2',
              borderRadius: '12px',
            }}
          />
          <Bar dataKey="value" fill="#1F5B72" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
