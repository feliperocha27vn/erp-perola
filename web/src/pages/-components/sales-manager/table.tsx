import { addMinutes, format } from 'date-fns'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { SectionErrorState } from '@/components/ui/section-error-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SalesManagerTableSkeleton } from './table-skeleton'
import type { SaleItem } from './types'

type SalesManagerTableProps = {
  sales: SaleItem[]
  isLoading: boolean
  isError?: boolean
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onView: (sale: SaleItem) => void
  onEdit: (sale: SaleItem) => void
  onDelete: (sale: SaleItem) => void
  onRetry?: () => void
}

export function SalesManagerTable({
  sales,
  isLoading,
  isError = false,
  currentPage,
  totalPages,
  onPageChange,
  onView,
  onEdit,
  onDelete,
  onRetry,
}: SalesManagerTableProps) {
  return (
    <div className="glass-card rounded-2xl p-4 space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Loja</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead>Quantidade</TableHead>
            <TableHead>Valor Total</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="p-2">
                <SalesManagerTableSkeleton />
              </TableCell>
            </TableRow>
          ) : isError ? (
            <TableRow>
              <TableCell colSpan={7} className="p-2">
                <SectionErrorState
                  title="Erro ao carregar vendas"
                  description="Nao foi possivel carregar os registros de vendas."
                  onRetry={onRetry}
                />
              </TableCell>
            </TableRow>
          ) : sales.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="p-2">
                <EmptyState title="Nenhuma venda encontrada." />
              </TableCell>
            </TableRow>
          ) : (
            sales.map(sale => (
              <TableRow key={sale.id}>
                <TableCell className="font-medium">
                  {sale.product.sku}
                </TableCell>
                <TableCell>{sale.store?.name ?? '—'}</TableCell>
                <TableCell>{sale.stock.title}</TableCell>
                <TableCell>{sale.quantity}</TableCell>
                <TableCell>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(sale.total_price / 100)}
                </TableCell>
                <TableCell>
                  {format(
                    addMinutes(
                      new Date(sale.sale_date),
                      new Date(sale.sale_date).getTimezoneOffset()
                    ),
                    'dd/MM/yyyy'
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onView(sale)}
                    >
                      <Eye className="size-4 mr-1" />
                      Ver
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(sale)}
                    >
                      <Pencil className="size-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onDelete(sale)}
                    >
                      <Trash2 className="size-4 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              disabled={currentPage <= 1}
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            />
          </PaginationItem>
          <PaginationItem>
            <span className="px-3 text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </span>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              disabled={currentPage >= totalPages}
              onClick={() =>
                onPageChange(Math.min(totalPages, currentPage + 1))
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
