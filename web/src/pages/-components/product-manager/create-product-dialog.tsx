import { Select } from '@base-ui/react/select'
import { type ReactNode, useId } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type BrandOption = {
  id: string
  name: string
}

type CreateProductFormValues = {
  sku: string
  ean: string
  brand_id: string
  url_site: string
}

type CreateProductDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  values: CreateProductFormValues
  brands: BrandOption[]
  isBrandsLoading: boolean
  isPending: boolean
  onValuesChange: (next: Partial<CreateProductFormValues>) => void
  onSubmit: () => void
}

function CreateProductDialogRoot({
  open,
  onOpenChange,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent className="border-border bg-card text-foreground">
        {children}
      </DialogContent>
    </Dialog>
  )
}

function CreateProductDialogHeader() {
  return (
    <DialogHeader>
      <DialogTitle>Criar Produto</DialogTitle>
    </DialogHeader>
  )
}

function CreateProductDialogFields({
  values,
  onValuesChange,
  brands,
  isBrandsLoading,
}: {
  values: CreateProductFormValues
  onValuesChange: (next: Partial<CreateProductFormValues>) => void
  brands: BrandOption[]
  isBrandsLoading: boolean
}) {
  const baseId = useId()
  const skuId = `${baseId}-sku`
  const eanId = `${baseId}-ean`
  const urlSiteId = `${baseId}-url-site`

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor={skuId}>SKU</Label>
        <Input
          id={skuId}
          value={values.sku}
          onChange={e => onValuesChange({ sku: e.target.value })}
          placeholder="Digite o SKU"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={eanId}>EAN</Label>
        <Input
          id={eanId}
          value={values.ean}
          onChange={e => onValuesChange({ ean: e.target.value })}
          placeholder="Digite o EAN"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={urlSiteId}>URL do site</Label>
        <Input
          id={urlSiteId}
          value={values.url_site}
          onChange={e => onValuesChange({ url_site: e.target.value })}
          placeholder="https://site.com/produto"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Marca</Label>
        <Select.Root
          value={values.brand_id}
          onValueChange={value => onValuesChange({ brand_id: value || '' })}
        >
          <Select.Trigger
            className="w-full flex h-10 items-center justify-between rounded-xl border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            onPointerDown={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}
          >
            <span className={cn(!values.brand_id && 'text-muted-foreground')}>
              {values.brand_id
                ? (brands.find(brand => brand.id === values.brand_id)?.name ??
                  'Selecione a marca')
                : isBrandsLoading
                  ? 'Carregando marcas...'
                  : 'Selecione a marca'}
            </span>
            <Select.Icon className="text-muted-foreground">▾</Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner
              sideOffset={4}
              className="z-[9999] outline-none"
              onPointerDown={e => e.stopPropagation()}
              onClick={e => e.stopPropagation()}
            >
              <Select.Popup
                className="min-w-[var(--anchor-width)] max-h-[300px] rounded-xl border border-border bg-popover p-1 shadow-lg"
                onPointerDown={e => e.stopPropagation()}
                onClick={e => e.stopPropagation()}
              >
                <Select.List className="max-h-[300px] overflow-auto">
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
      </div>
    </div>
  )
}

function CreateProductDialogActions({
  isPending,
  onSubmit,
}: {
  isPending: boolean
  onSubmit: () => void
}) {
  return (
    <DialogFooter>
      <Button type="button" onClick={onSubmit} disabled={isPending}>
        {isPending ? 'Criando...' : 'Criar Produto'}
      </Button>
    </DialogFooter>
  )
}

const CreateProductDialogCompound = {
  Root: CreateProductDialogRoot,
  Header: CreateProductDialogHeader,
  Fields: CreateProductDialogFields,
  Actions: CreateProductDialogActions,
}

export function CreateProductDialog({
  open,
  onOpenChange,
  values,
  brands,
  isBrandsLoading,
  isPending,
  onValuesChange,
  onSubmit,
}: CreateProductDialogProps) {
  return (
    <CreateProductDialogCompound.Root open={open} onOpenChange={onOpenChange}>
      <CreateProductDialogCompound.Header />
      <CreateProductDialogCompound.Fields
        values={values}
        onValuesChange={onValuesChange}
        brands={brands}
        isBrandsLoading={isBrandsLoading}
      />
      <CreateProductDialogCompound.Actions
        isPending={isPending}
        onSubmit={onSubmit}
      />
    </CreateProductDialogCompound.Root>
  )
}
