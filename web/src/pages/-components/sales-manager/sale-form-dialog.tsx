import { Dialog } from '@base-ui/react/dialog'
import { Select } from '@base-ui/react/select'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon, Check, ChevronsUpDown } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useGetStores } from '@/api/hooks/storesController/useGetStores'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { ProductItem, ProductStockItem, SaleFormValues } from './types'

type SalesManagerSaleFormDialogProps = {
  open: boolean
  title: string
  submitLabel: string
  values: SaleFormValues
  products: ProductItem[]
  selectedProductStocks: ProductStockItem[]
  productSearchQuery: string
  isProductsLoading: boolean
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onProductSearchChange: (value: string) => void
  onProductSelect: (productId: string) => void
  onValuesChange: (next: Partial<SaleFormValues>) => void
  onSubmit: () => void
}

export function SalesManagerSaleFormDialog({
  open,
  title,
  submitLabel,
  values,
  products,
  selectedProductStocks,
  productSearchQuery,
  isProductsLoading,
  isPending,
  onOpenChange,
  onProductSearchChange,
  onProductSelect,
  onValuesChange,
  onSubmit,
}: SalesManagerSaleFormDialogProps) {
  const { data: storesData } = useGetStores()
  const stores = storesData?.stores ?? []

  const [productPopoverOpen, setProductPopoverOpen] = useState(false)
  const [datePopoverOpen, setDatePopoverOpen] = useState(false)

  const selectedProduct = useMemo(
    () => products.find(product => product.id === values.product_id) ?? null,
    [products, values.product_id]
  )

  const selectedStock = useMemo(
    () =>
      selectedProductStocks.find(stock => stock.id === values.stock_id) ?? null,
    [selectedProductStocks, values.stock_id]
  )

  const selectedDate = useMemo(() => {
    if (!values.sale_date) {
      return undefined
    }

    const parsed = new Date(`${values.sale_date}T00:00:00`)
    return Number.isNaN(parsed.getTime()) ? undefined : parsed
  }, [values.sale_date])

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/60" />
        <Dialog.Viewport className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Popup className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 space-y-4">
            <Dialog.Title className="text-xl font-bold text-foreground">
              {title}
            </Dialog.Title>

            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Produto</Label>
                <Popover
                  open={productPopoverOpen}
                  onOpenChange={setProductPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={productPopoverOpen}
                      className="w-full justify-between"
                    >
                      {selectedProduct
                        ? `${selectedProduct.sku} - ${selectedProduct.ean}`
                        : 'Selecione o produto'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 border-border bg-popover">
                    <Command className="bg-transparent">
                      <CommandInput
                        placeholder="Buscar por SKU ou EAN..."
                        value={productSearchQuery}
                        onValueChange={onProductSearchChange}
                      />
                      <CommandList className="max-h-[300px] overflow-y-auto">
                        <CommandEmpty>
                          {isProductsLoading
                            ? 'Buscando produtos...'
                            : 'Nenhum produto encontrado.'}
                        </CommandEmpty>
                        <CommandGroup>
                          {products.map(product => (
                            <CommandItem
                              key={product.id}
                              value={product.id}
                              keywords={[
                                product.sku,
                                product.ean,
                                product.brand?.name ?? '',
                              ]}
                              onSelect={() => {
                                onProductSelect(product.id)
                                setProductPopoverOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  values.product_id === product.id
                                    ? 'opacity-100'
                                    : 'opacity-0'
                                )}
                              />
                              {product.sku} - {product.ean}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1">
                <Label>Origem do estoque</Label>
                <Select.Root
                  value={values.stock_id}
                  onValueChange={value =>
                    onValuesChange({ stock_id: value || '' })
                  }
                >
                  <Select.Trigger className="w-full flex h-10 items-center justify-between rounded-xl border border-input bg-background px-3 text-sm text-foreground">
                    <span
                      className={cn(!selectedStock && 'text-muted-foreground')}
                    >
                      {selectedStock
                        ? `${selectedStock.title} (${selectedStock.qtde})`
                        : 'Selecione a loja'}
                    </span>
                    <Select.Icon className="text-muted-foreground">
                      ▾
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Positioner
                      sideOffset={8}
                      className="z-50 outline-none"
                    >
                      <Select.Popup className="min-w-[var(--anchor-width)] rounded-xl border border-border bg-popover p-1 shadow-lg">
                        <Select.List className="max-h-64 overflow-auto">
                          {selectedProductStocks.map(stock => (
                            <Select.Item
                              key={stock.id}
                              value={stock.id}
                              className="cursor-pointer rounded-md px-3 py-2 text-sm text-foreground data-[highlighted]:bg-secondary"
                            >
                              <Select.ItemText>{`${stock.title} (${stock.qtde})`}</Select.ItemText>
                            </Select.Item>
                          ))}
                        </Select.List>
                      </Select.Popup>
                    </Select.Positioner>
                  </Select.Portal>
                </Select.Root>
              </div>

              <div className="space-y-1">
                <Label>Loja</Label>
                <Select.Root
                  value={values.store_id}
                  onValueChange={value =>
                    onValuesChange({ store_id: value || '' })
                  }
                >
                  <Select.Trigger className="w-full flex h-10 items-center justify-between rounded-xl border border-input bg-background px-3 text-sm text-foreground">
                    <span
                      className={cn(
                        !values.store_id && 'text-muted-foreground'
                      )}
                    >
                      {stores.find(s => s.id === values.store_id)?.name ??
                        'Selecione a loja'}
                    </span>
                    <Select.Icon className="text-muted-foreground">
                      ▾
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Positioner
                      sideOffset={8}
                      className="z-50 outline-none"
                    >
                      <Select.Popup className="min-w-[var(--anchor-width)] rounded-xl border border-border bg-popover p-1 shadow-lg">
                        <Select.List className="max-h-64 overflow-auto">
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
              </div>

              <div className="space-y-1">
                <Label>Canal de venda</Label>
                <Select.Root
                  value={values.channel}
                  onValueChange={value =>
                    onValuesChange({
                      channel: (value ||
                        'Mercado Livre') as SaleFormValues['channel'],
                    })
                  }
                >
                  <Select.Trigger className="w-full flex h-10 items-center justify-between rounded-xl border border-input bg-background px-3 text-sm text-foreground">
                    <span>{values.channel || 'Selecione o canal'}</span>
                    <Select.Icon className="text-muted-foreground">
                      ▾
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Positioner
                      sideOffset={8}
                      className="z-50 outline-none"
                    >
                      <Select.Popup className="min-w-[var(--anchor-width)] rounded-xl border border-border bg-popover p-1 shadow-lg">
                        <Select.List className="max-h-64 overflow-auto">
                          {['Amazon', 'Mercado Livre', 'Shopee'].map(
                            channel => (
                              <Select.Item
                                key={channel}
                                value={channel}
                                className="cursor-pointer rounded-md px-3 py-2 text-sm text-foreground data-[highlighted]:bg-secondary"
                              >
                                <Select.ItemText>{channel}</Select.ItemText>
                              </Select.Item>
                            )
                          )}
                        </Select.List>
                      </Select.Popup>
                    </Select.Positioner>
                  </Select.Portal>
                </Select.Root>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>Quantidade</Label>
                  <Input
                    type="number"
                    min={1}
                    value={values.quantity}
                    onChange={e => onValuesChange({ quantity: e.target.value })}
                    placeholder="Quantidade"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Valor da Venda</Label>
                  <Input
                    type="text"
                    value={values.sale_price}
                    onChange={e =>
                      onValuesChange({ sale_price: e.target.value })
                    }
                    placeholder="Ex: 498,00"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Data da Venda</Label>
                  <Popover
                    open={datePopoverOpen}
                    onOpenChange={setDatePopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !selectedDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate
                          ? format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })
                          : 'Selecione a data'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 border-border bg-popover"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={date => {
                          if (date) {
                            onValuesChange({
                              sale_date: date.toISOString().slice(0, 10),
                            })
                            setDatePopoverOpen(false)
                          }
                        }}
                        className="rounded-md border-0"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Dialog.Close className="inline-flex h-10 items-center rounded-md border border-border px-3 text-sm text-foreground">
                Cancelar
              </Dialog.Close>
              <Button type="button" onClick={onSubmit} disabled={isPending}>
                {isPending ? 'Salvando...' : submitLabel}
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
