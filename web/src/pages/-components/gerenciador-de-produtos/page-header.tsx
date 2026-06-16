import { BackToDashboardButton } from '@/components/back-to-dashboard-button'
import { Button } from '@/components/ui/button'

type ProductsPageHeaderProps = {
  onOpenBrands: () => void
}

export function ProductsPageHeader({ onOpenBrands }: ProductsPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <BackToDashboardButton />
        <div className="space-y-1">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            Sistema de Controle
          </h2>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-foreground">
            Gerenciador de Produtos
          </h1>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={onOpenBrands}
        className="rounded-xl w-full md:w-auto"
      >
        Gerenciar Marcas
      </Button>
    </div>
  )
}
