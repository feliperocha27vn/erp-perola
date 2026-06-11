import { Check, Package, Plus } from 'lucide-react'

type ProductsStatsProps = {
  total: number
  withoutImage: number
  page: number
  totalPages: number
  filteredCount: number
}

export function ProductsStats({
  total,
  withoutImage,
  page,
  totalPages,
  filteredCount,
}: ProductsStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="glass-card p-6 rounded-2xl space-y-2">
        <div className="flex justify-between items-center text-muted-foreground">
          <span className="text-sm">Total de Produtos</span>
          <Package className="size-4" />
        </div>
        <div className="text-3xl font-display font-bold text-foreground">
          {total}
        </div>
        <div className="text-xs text-muted-foreground font-medium">
          Catálogo completo
        </div>
      </div>

      <div className="glass-card p-6 rounded-2xl space-y-2">
        <div className="flex justify-between items-center text-muted-foreground">
          <span className="text-sm">Sem Imagem</span>
          <Plus className="size-4" />
        </div>
        <div className="text-3xl font-display font-bold text-primary">
          {withoutImage}
        </div>
        <div className="text-xs text-muted-foreground font-medium">
          Aguardando upload
        </div>
      </div>

      <div className="glass-card p-6 rounded-2xl space-y-2">
        <div className="flex justify-between items-center text-muted-foreground">
          <span className="text-sm">Página Atual</span>
          <Check className="size-4" />
        </div>
        <div className="text-3xl font-display font-bold text-primary">
          {page + 1} / {totalPages || 1}
        </div>
        <div className="text-xs text-muted-foreground font-medium">
          {filteredCount} produtos
        </div>
      </div>
    </div>
  )
}
