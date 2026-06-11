import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

type SectionErrorStateProps = {
  title?: string
  description?: string
  actionLabel?: string
  onRetry?: () => void
  className?: string
}

export function SectionErrorState({
  title = 'Falha ao carregar dados',
  description = 'Tente novamente em alguns instantes.',
  actionLabel = 'Recarregar',
  onRetry,
  className,
}: SectionErrorStateProps) {
  return (
    <div
      className={['rounded-xl border border-border bg-card p-5', className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex flex-col items-start gap-2 text-left">
        <div className="inline-flex size-9 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-4" />
        </div>
        <h3 className="text-base font-medium text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
        {onRetry ? (
          <Button
            onClick={onRetry}
            variant="outline"
            size="sm"
            className="mt-1"
            type="button"
          >
            <RotateCcw className="size-4" />
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
