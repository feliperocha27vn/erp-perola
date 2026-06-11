import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

type PageErrorStateProps = {
  title?: string
  description?: string
  actionLabel?: string
  onRetry?: () => void
}

export function PageErrorState({
  title = 'Algo deu errado',
  description = 'Nao foi possivel carregar esta pagina no momento.',
  actionLabel = 'Tentar novamente',
  onRetry,
}: PageErrorStateProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-8 md:p-10">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 text-center">
        <div className="inline-flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-5" />
        </div>
        <h2 className="text-2xl font-display font-semibold text-foreground">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{description}</p>
        {onRetry ? (
          <Button onClick={onRetry} className="mt-2" type="button">
            <RotateCcw className="size-4" />
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
