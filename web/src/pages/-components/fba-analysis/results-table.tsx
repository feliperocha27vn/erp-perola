import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatInteger, formatPercent } from './formatters'
import { FbaAnalysisProductComparisonChart } from './product-comparison-chart'
import type { FbaResultItem } from './types'

type FbaAnalysisResultsTableProps = {
  items: FbaResultItem[]
}

export function FbaAnalysisResultsTable({
  items,
}: FbaAnalysisResultsTableProps) {
  return (
    <div className="glass-card rounded-2xl p-4 space-y-4">
      <h3 className="text-xl font-display font-semibold">
        Recomendacoes por SKU
      </h3>
      <Table className="min-w-[1320px] table-auto">
        <TableHeader>
          <TableRow>
            <TableHead className="w-28">SKU</TableHead>
            <TableHead className="min-w-64">Titulo</TableHead>
            <TableHead className="w-36">ASIN</TableHead>
            <TableHead className="w-28">Estoque Fisico</TableHead>
            <TableHead className="w-28">Unidades 90d</TableHead>
            <TableHead className="w-24">Conversao</TableHead>
            <TableHead className="w-20">Enviar</TableHead>
            <TableHead className="w-24">Origem</TableHead>
            <TableHead className="w-24">Confianca</TableHead>
            <TableHead className="min-w-[240px]">Sinais</TableHead>
            <TableHead className="min-w-[360px]">Motivo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map(item => (
            <TableRow key={item.sku}>
              <TableCell className="font-semibold">{item.sku}</TableCell>
              <TableCell className="max-w-72 overflow-hidden text-ellipsis">
                {item.title}
              </TableCell>
              <TableCell>{item.asin}</TableCell>
              <TableCell>{formatInteger(item.physical_stock)}</TableCell>
              <TableCell>{formatInteger(item.units_sold_90d)}</TableCell>
              <TableCell>{formatPercent(item.conversion_rate)}</TableCell>
              <TableCell className="font-semibold text-primary">
                {formatInteger(item.recommended_send_quantity)}
              </TableCell>
              <TableCell>
                {item.analysis_source === 'gemini' ? 'Gemini' : 'Fallback'}
              </TableCell>
              <TableCell>{item.confidence}</TableCell>
              <TableCell className="whitespace-normal align-top">
                <div className="flex flex-wrap gap-1.5">
                  {item.decision_tags.map(tag => (
                    <span
                      key={`${item.sku}-${tag}`}
                      className="inline-flex items-center rounded-full border border-border bg-muted/60 px-2 py-0.5 text-xs text-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </TableCell>
              <TableCell className="whitespace-normal break-words leading-relaxed align-top">
                {item.reason}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {items.slice(0, 4).map(item => (
          <div
            key={`${item.sku}-chart`}
            className="border border-border rounded-xl p-4 space-y-2 bg-background/40"
          >
            <p className="text-sm font-medium text-foreground">
              Comparativo: {item.sku}
            </p>
            <FbaAnalysisProductComparisonChart item={item} />
          </div>
        ))}
      </div>
    </div>
  )
}
