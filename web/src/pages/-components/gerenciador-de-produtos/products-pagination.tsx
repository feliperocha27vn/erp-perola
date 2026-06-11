import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ProductsPaginationProps = {
  page: number
  totalPages: number
  onPrev: () => void
  onNext: () => void
}

export function ProductsPagination({
  page,
  totalPages,
  onPrev,
  onNext,
}: ProductsPaginationProps) {
  if (totalPages <= 1) {
    return null
  }

  return (
    <div className="glass-card p-6 rounded-2xl">
      <div className="flex items-center justify-between">
        <Button
          onClick={onPrev}
          disabled={page === 0}
          variant="outline"
          size="sm"
          className="rounded-xl"
          type="button"
        >
          <ChevronLeft className="size-4 mr-2" />
          Anterior
        </Button>

        <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2">
          <span className="text-sm text-muted-foreground">
            Página {page + 1} de {totalPages}
          </span>
        </div>

        <Button
          onClick={onNext}
          disabled={page >= totalPages - 1}
          variant="outline"
          size="sm"
          className="rounded-xl"
          type="button"
        >
          Próxima
          <ChevronRight className="size-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
