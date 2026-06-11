import { Select } from '@base-ui/react/select'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import { useGetBrands } from '@/api/hooks/brandsController/useGetBrands'
import { useGetStores } from '@/api/hooks/storesController/useGetStores'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

type SalesManagerFiltersProps = {
  date?: DateRange
  brandId?: string
  storeId?: string
  onDateChange: (value: DateRange | undefined) => void
  onBrandChange: (value: string | undefined) => void
  onStoreChange: (value: string | undefined) => void
  onClear: () => void
}

export function SalesManagerFilters({
  date,
  brandId,
  storeId,
  onDateChange,
  onBrandChange,
  onStoreChange,
  onClear,
}: SalesManagerFiltersProps) {
  const { data: brandsData } = useGetBrands()
  const { data: storesData } = useGetStores()
  const brands = brandsData?.brands ?? []
  const stores = storesData?.stores ?? []
  const selectedBrand = brands.find(b => b.id === brandId)
  const selectedStore = stores.find(s => s.id === storeId)

  return (
    <div className="glass-card p-6 rounded-2xl space-y-3">
      <p className="text-sm text-muted-foreground">Filtros</p>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start px-2.5 text-left font-normal',
                !date?.from && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="size-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, 'dd/MM/yyyy', { locale: ptBR })} -{' '}
                    {format(date.to, 'dd/MM/yyyy', { locale: ptBR })}
                  </>
                ) : (
                  format(date.from, 'dd/MM/yyyy', { locale: ptBR })
                )
              ) : (
                <span>Selecione o período</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 bg-popover border border-border z-50 shadow-md"
            align="start"
          >
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={onDateChange}
              numberOfMonths={2}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>

        <Select.Root
          value={brandId ?? ''}
          onValueChange={value => onBrandChange(value || undefined)}
        >
          <Select.Trigger className="w-full flex h-10 items-center justify-between rounded-xl border border-input bg-background px-3 text-sm text-foreground">
            <span className={cn(!selectedBrand && 'text-muted-foreground')}>
              {selectedBrand ? selectedBrand.name : 'Todas as marcas'}
            </span>
            <Select.Icon className="text-muted-foreground">▾</Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner sideOffset={8} className="z-50 outline-none">
              <Select.Popup className="min-w-[var(--anchor-width)] rounded-xl border border-border bg-popover p-1 shadow-lg">
                <Select.List className="max-h-64 overflow-auto">
                  <Select.Item
                    value=""
                    className="cursor-pointer rounded-md px-3 py-2 text-sm text-muted-foreground data-[highlighted]:bg-secondary"
                  >
                    <Select.ItemText>Todas as marcas</Select.ItemText>
                  </Select.Item>
                  {brands.map(brand => (
                    <Select.Item
                      key={brand.id}
                      value={brand.id}
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

        <Select.Root
          value={storeId ?? ''}
          onValueChange={value => onStoreChange(value || undefined)}
        >
          <Select.Trigger className="w-full flex h-10 items-center justify-between rounded-xl border border-input bg-background px-3 text-sm text-foreground">
            <span className={cn(!selectedStore && 'text-muted-foreground')}>
              {selectedStore ? selectedStore.name : 'Todas as lojas'}
            </span>
            <Select.Icon className="text-muted-foreground">▾</Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner sideOffset={8} className="z-50 outline-none">
              <Select.Popup className="min-w-[var(--anchor-width)] rounded-xl border border-border bg-popover p-1 shadow-lg">
                <Select.List className="max-h-64 overflow-auto">
                  <Select.Item
                    value=""
                    className="cursor-pointer rounded-md px-3 py-2 text-sm text-muted-foreground data-[highlighted]:bg-secondary"
                  >
                    <Select.ItemText>Todas as lojas</Select.ItemText>
                  </Select.Item>
                  {stores.map(store => (
                    <Select.Item
                      key={store.id}
                      value={store.id}
                      className="cursor-pointer rounded-md px-3 py-2 text-sm text-foreground data-[highlighted]:bg-secondary"
                    >
                      <Select.ItemText>{store.name}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.List>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>

        <Button type="button" variant="outline" onClick={onClear}>
          Limpar filtros
        </Button>
      </div>
    </div>
  )
}
