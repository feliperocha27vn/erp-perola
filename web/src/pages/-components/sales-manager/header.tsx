import { BackToDashboardButton } from '@/components/back-to-dashboard-button'
import { Button } from '@/components/ui/button'

type SalesManagerHeaderProps = {
  onOpenCreate: () => void
}

export function SalesManagerHeader({ onOpenCreate }: SalesManagerHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <BackToDashboardButton />
        <h1 className="text-4xl md:text-5xl font-display font-extrabold text-foreground">
          Gerenciador de vendas
        </h1>
      </div>
      <Button type="button" className="rounded-xl" onClick={onOpenCreate}>
        Criar venda
      </Button>
    </div>
  )
}
