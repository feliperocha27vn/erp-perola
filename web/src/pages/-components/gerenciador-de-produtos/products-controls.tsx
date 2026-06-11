import { Select } from '@base-ui/react/select'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BrandItem } from './types'

type Filter = 'all' | 'without'

export type BrandFilter = 'ALL' | string

type ProductsControlsProps = {
  searchQuery?: string
  filter: Filter
  productsWithoutImage: number
  totalProducts: number
  brands: BrandItem[]
  isBrandsLoading: boolean
  onSearchChange: (value?: string) => void
  onSearchEnter: (value?: string) => void
  onFilterChange: (filter: Filter) => void
  brandFilter: BrandFilter
  onBrandChange: (brand: BrandFilter) => void
}

export function ProductsControls({
  searchQuery,
  filter,
  productsWithoutImage,
  totalProducts,
  brands,
  isBrandsLoading,
  onSearchChange,
  onSearchEnter,
  onFilterChange,
  brandFilter,
  onBrandChange,
}: ProductsControlsProps) {
  return (
    <div className="glass-card p-6 rounded-2xl space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
        <input
          type="text"
          placeholder="Buscar por SKU ou EAN..."
          value={searchQuery || ''}
          onChange={e => onSearchChange(e.target.value || undefined)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              onSearchEnter(e.currentTarget.value || undefined)
            }
          }}
          className="w-full rounded-xl border border-input bg-background py-3 pl-10 pr-4 text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="flex gap-3">
        <Button
          onClick={() => onFilterChange('without')}
          variant={filter === 'without' ? 'default' : 'outline'}
          className="rounded-xl"
          type="button"
        >
          Sem Imagem ({productsWithoutImage})
        </Button>
        <Button
          onClick={() => onFilterChange('all')}
          variant={filter === 'all' ? 'default' : 'outline'}
          className="rounded-xl"
          type="button"
        >
          Todos ({totalProducts})
        </Button>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Filtrar por marca</p>
        <Select.Root
          value={brandFilter}
          onValueChange={value => onBrandChange(value || 'ALL')}
        >
          <Select.Trigger className="flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20">
            <Select.Value
              placeholder={isBrandsLoading ? 'Carregando marcas...' : 'Todas'}
            />
            <Select.Icon className="text-muted-foreground">▾</Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner sideOffset={8} className="z-50 outline-none">
              <Select.Popup className="min-w-[var(--anchor-width)] rounded-xl border border-border bg-popover p-1 shadow-md">
                <Select.List className="max-h-64 overflow-auto">
                  <Select.Item
                    value="ALL"
                    className="cursor-pointer rounded-md px-3 py-2 text-sm text-foreground data-[highlighted]:bg-secondary"
                  >
                    <Select.ItemText>Todas</Select.ItemText>
                  </Select.Item>
                  {brands.map(brand => (
                    <Select.Item
                      key={brand.id}
                      value={brand.name}
                      className="cursor-pointer rounded-md px-3 py-2 text-sm text-foreground data-[highlighted]:bg-secondary"
                    >
                      <Select.ItemText>{brand.name}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.List>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      </div>
    </div>
  )
}
