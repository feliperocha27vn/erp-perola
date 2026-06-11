import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { FbaPendingItem } from './types'

type FbaAnalysisPendingTableProps = {
  items: FbaPendingItem[]
}

export function FbaAnalysisPendingTable({
  items,
}: FbaAnalysisPendingTableProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <div className="glass-card rounded-2xl p-4 space-y-4">
      <h3 className="text-xl font-display font-semibold">Pendencias</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Titulo</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Detalhe</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map(item => (
            <TableRow
              key={`${item.reason}-${item.sku}-${item.detail}-${item.title}`}
            >
              <TableCell>{item.sku || '-'}</TableCell>
              <TableCell className="max-w-80 overflow-hidden text-ellipsis">
                {item.title || '-'}
              </TableCell>
              <TableCell>{item.reason}</TableCell>
              <TableCell>{item.detail}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
