import { Link } from '@tanstack/react-router'
import { Home, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageErrorState } from '@/components/ui/page-error-state'

type AppErrorPageProps = {
  message?: string
}

export function AppErrorPage({ message }: AppErrorPageProps) {
  return (
    <div className="space-y-6">
      <PageErrorState
        title="Falha inesperada"
        description={message || 'Ocorreu um erro ao renderizar esta pagina.'}
        actionLabel="Recarregar pagina"
        onRetry={() => window.location.reload()}
      />

      <div className="flex items-center justify-center gap-3">
        <Button asChild variant="outline" type="button">
          <Link to="/">
            <Home className="size-4" />
            Voltar ao dashboard
          </Link>
        </Button>
        <Button onClick={() => window.location.reload()} type="button">
          <RotateCcw className="size-4" />
          Tentar novamente
        </Button>
      </div>
    </div>
  )
}
