import { Link } from '@tanstack/react-router'
import { Home, SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

export function NotFoundPage() {
  return (
    <div className="space-y-6">
      <EmptyState
        title="Pagina nao encontrada"
        description="O caminho informado nao existe ou foi movido."
        icon={SearchX}
      />

      <div className="flex justify-center">
        <Button asChild type="button">
          <Link to="/">
            <Home className="size-4" />
            Ir para o dashboard
          </Link>
        </Button>
      </div>
    </div>
  )
}
