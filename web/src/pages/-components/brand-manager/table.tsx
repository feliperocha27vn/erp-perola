import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { SectionErrorState } from '@/components/ui/section-error-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { BrandManagerTableSkeleton } from './table-skeleton'
import type { Brand } from './types'

type BrandManagerTableProps = {
  brands: Brand[]
  isLoading: boolean
  isError?: boolean
  onAlterar: (brand: Brand) => void
  onExcluir: (brand: Brand) => void
  onRetry?: () => void
}

export function BrandManagerTable({
  brands,
  isLoading,
  isError = false,
  onAlterar,
  onExcluir,
  onRetry,
}: BrandManagerTableProps) {
  return (
    <div className="glass-card rounded-2xl p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome da Marca</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={2} className="p-2">
                <BrandManagerTableSkeleton />
              </TableCell>
            </TableRow>
          ) : isError ? (
            <TableRow>
              <TableCell colSpan={2} className="p-2">
                <SectionErrorState
                  title="Erro ao carregar marcas"
                  description="Nao foi possivel obter a lista de marcas."
                  onRetry={onRetry}
                />
              </TableCell>
            </TableRow>
          ) : brands.length === 0 ? (
            <TableRow>
              <TableCell colSpan={2} className="p-2">
                <EmptyState title="Nenhuma marca encontrada." />
              </TableCell>
            </TableRow>
          ) : (
            brands.map(brand => (
              <TableRow key={brand.id}>
                <TableCell className="font-medium">{brand.name}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onAlterar(brand)}
                    >
                      Alterar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onExcluir(brand)}
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
    </div>
  )
}
