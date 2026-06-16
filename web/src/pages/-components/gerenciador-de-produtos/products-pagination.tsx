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
      <div className="flex items-center justify-between gap-2">
        <Button
          onClick={onPrev}
          disabled={page === 0}
          variant="outline"
          size="sm"
          className="rounded-xl shrink-0"
          type="button"
          aria-label="Página anterior"
        >
          <ChevronLeft className="size-4 sm:mr-2" />
          <span className="hidden sm:inline">Anterior</span>
        </Button>

        <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2 shrink-0">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Página {page + 1} de {totalPages}
          </span>
        </div>

        <Button
          onClick={onNext}
          disabled={page >= totalPages - 1}
          variant="outline"
          size="sm"
          className="rounded-xl shrink-0"
          type="button"
          aria-label="Próxima página"
        >
          <span className="hidden sm:inline">Próxima</span>
          <ChevronRight className="size-4 sm:ml-2" />
        </Button>
      </div>
    </div>
  )
}
