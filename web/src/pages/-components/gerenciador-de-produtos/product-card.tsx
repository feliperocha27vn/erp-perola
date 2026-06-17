import { Check, Copy, MoreHorizontal, Trash2, Warehouse, X, Zap } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ProductSalesDashboardModal } from './product-sales-dashboard-modal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { ProductImage } from './product-image'
import type { ProductItem } from './types'

type RootProps = {
  children: ReactNode
}

function Root({ children }: RootProps) {
  return <div className="glass-card p-6 rounded-2xl space-y-4">{children}</div>
}

type HeaderProps = {
  product: ProductItem
  onStartEditing: (productId: string, currentUrl: string | null) => void
  onOpenStock: (product: ProductItem) => void
  onOpenDetails: (product: ProductItem) => void
  onOpenIdentityEdit: (product: ProductItem) => void
  onOpenSalePrice: (product: ProductItem) => void
  onDelete: (product: ProductItem) => void
}

function Header({
  product,
  onStartEditing,
  onOpenStock,
  onOpenDetails,
  onOpenIdentityEdit,
  onOpenSalePrice,
  onDelete,
}: HeaderProps) {
  const handleCopySku = async () => {
    try {
      await navigator.clipboard.writeText(product.sku)
      toast.success('SKU copiado para a área de transferência!')
    } catch {
      toast.error('Não foi possível copiar o SKU.')
    }
  }

  const handleCopyEan = async () => {
    try {
      await navigator.clipboard.writeText(product.ean)
      toast.success('EAN copiado para a área de transferência!')
    } catch {
      toast.error('Não foi possível copiar o EAN.')
    }
  }

  const totalStock = product.stocks.reduce((acc, stock) => acc + stock.qtde, 0)

  return (
    <div className="flex justify-between items-start">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="font-display font-semibold text-lg text-foreground">
            {product.sku}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground"
            onClick={handleCopySku}
            title="Copiar SKU"
            aria-label="Copiar SKU"
            type="button"
          >
            <Copy className="size-3.5" />
          </Button>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span>EAN: {product.ean}</span>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground"
            onClick={handleCopyEan}
            title="Copiar EAN"
            aria-label="Copiar EAN"
            type="button"
          >
            <Copy className="size-3.5" />
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          <p>{product.brand?.name ?? 'Sem marca'}</p>
        </div>
        <div className="pt-2">
          {product.stocks.length === 0 ? (
            <span className="text-xs text-muted-foreground flex items-center gap-1.5 py-1">
              <Warehouse className="size-3.5" />
              Sem estoque
            </span>
          ) : (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-xs rounded-lg flex items-center gap-1.5 hover:bg-accent cursor-pointer transition-colors"
                >
                  <Warehouse className="size-3.5 text-muted-foreground" />
                  <span>
                    Estoque:{' '}
                    <strong className="font-semibold text-foreground">
                      {totalStock}
                    </strong>{' '}
                    {totalStock === 1 ? 'unid.' : 'unids.'}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" align="start">
                <div className="space-y-2">
                  <h4 className="font-medium text-xs text-muted-foreground px-1 uppercase tracking-wider">
                    Distribuição de Estoque
                  </h4>
                  <div className="divide-y divide-border/60">
                    {product.stocks.map(stock => (
                      <div
                        key={stock.id}
                        className="flex items-center justify-between py-1.5 text-xs first:pt-0 last:pb-0"
                      >
                        <div className="flex items-center gap-2">
                          {stock.full ? (
                            <Zap className="size-3.5 text-amber-500 fill-amber-500/20" />
                          ) : (
                            <Warehouse className="size-3.5 text-muted-foreground" />
                          )}
                          <span className="font-medium text-foreground">
                            {stock.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {stock.full && (
                            <span className="text-[9px] text-green-600 font-semibold bg-green-500/10 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                              Full
                            </span>
                          )}
                          <span className="font-semibold tabular-nums text-foreground">
                            {stock.qtde}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div
          className={`w-2.5 h-2.5 rounded-full ${product.url_image ? 'bg-primary' : 'bg-[#A76A3A]'}`}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-muted-foreground"
              aria-label="Abrir ações do produto"
              type="button"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem
              onSelect={() => onStartEditing(product.id, product.url_image)}
            >
              {product.url_image ? 'Editar imagem' : 'Adicionar imagem'}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onOpenIdentityEdit(product)}>
              Editar SKU/EAN
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onOpenSalePrice(product)}>
              Preço de venda
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onOpenDetails(product)}>
              Detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onOpenStock(product)}>
              Gerenciar estoques
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>Editar marca</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => onDelete(product)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="size-4 mr-2" />
              Excluir produto
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

type ImageProps = {
  imageUrl: string | null
  alt: string
}

function Image({ imageUrl, alt }: ImageProps) {
  return <ProductImage imageUrl={imageUrl} alt={alt} />
}

type EditFormProps = {
  imageUrl: string
  isSaving: boolean
  onImageUrlChange: (value: string) => void
  onSave: () => void
  onCancel: () => void
}

function EditForm({
  imageUrl,
  isSaving,
  onImageUrlChange,
  onSave,
  onCancel,
}: EditFormProps) {
  return (
    <div className="space-y-3">
      <input
        type="url"
        value={imageUrl}
        onChange={e => onImageUrlChange(e.target.value)}
        placeholder="https://exemplo.com/imagem.jpg"
        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
      />

      <div className="flex gap-2">
        <Button
          onClick={onSave}
          size="sm"
          className="flex-1 rounded-xl"
          disabled={isSaving}
          type="button"
        >
          <Check className="size-4 mr-2" />
          {isSaving ? 'Salvando...' : 'Salvar'}
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          size="sm"
          className="rounded-xl"
          disabled={isSaving}
          type="button"
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  )
}

const VELOCITY_PERIODS = [
  { label: '15d', key: 'units_15d' },
  { label: '30d', key: 'units_30d' },
  { label: '60d', key: 'units_60d' },
  { label: '90d', key: 'units_90d' },
] as const

type VelocityData = {
  units_15d: number
  units_30d: number
  units_60d: number
  units_90d: number
}

type VelocityProps = {
  data?: VelocityData | null
  isLoading?: boolean
}

function Velocity({ data, isLoading }: VelocityProps) {
  return (
    <div className="grid grid-cols-4 gap-2 pt-3 border-t border-border/60">
      {VELOCITY_PERIODS.map(({ label, key }) => (
        <div key={label} className="flex flex-col items-center gap-0.5">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          {isLoading || !data ? (
            <Skeleton className="h-4 w-7" />
          ) : (
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {data[key]}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

type SalesDashboardProps = {
  productId: string
  productSku: string
}

function SalesDashboard({ productId, productSku }: SalesDashboardProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-border py-2 text-xs font-medium text-muted-foreground hover:border-primary/60 hover:text-primary transition-colors"
      >
        Ver detalhes
      </button>
      <ProductSalesDashboardModal
        open={open}
        onOpenChange={setOpen}
        productId={productId}
        productSku={productSku}
      />
    </>
  )
}

export const ProductCard = {
  Root,
  Header,
  Image,
  EditForm,
  Velocity,
  SalesDashboard,
}
