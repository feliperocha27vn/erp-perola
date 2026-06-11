import { useEffect, useId, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ProductItem } from './types'

export type ProductIdentityForm = {
  sku: string
  ean: string
}

type ProductIdentityModalProps = {
  open: boolean
  product: ProductItem | null
  isSaving: boolean
  onClose: () => void
  onSave: (identity: ProductIdentityForm) => Promise<void>
}

function buildFormFromProduct(product: ProductItem): ProductIdentityForm {
  return {
    sku: product.sku ?? '',
    ean: product.ean ?? '',
  }
}

export function ProductIdentityModal({
  open,
  product,
  isSaving,
  onClose,
  onSave,
}: ProductIdentityModalProps) {
  const [form, setForm] = useState<ProductIdentityForm | null>(null)
  const baseId = useId()
  const skuId = `${baseId}-sku`
  const eanId = `${baseId}-ean`

  useEffect(() => {
    if (!open || !product) {
      return
    }

    setForm(buildFormFromProduct(product))
  }, [open, product])

  const handleSave = async () => {
    if (!form) {
      return
    }

    const sku = form.sku.trim()
    const ean = form.ean.trim()

    if (!sku) {
      toast.error('Informe o SKU.')
      return
    }

    if (!ean) {
      toast.error('Informe o EAN.')
      return
    }

    await onSave({ sku, ean })
  }

  return (
    <Dialog open={open} onOpenChange={next => !next && onClose()}>
      <DialogContent className="border-border bg-card text-foreground">
        <DialogHeader>
          <DialogTitle>Editar SKU e EAN</DialogTitle>
          <DialogDescription>
            {product
              ? `${product.sku} — EAN: ${product.ean}`
              : 'Produto não selecionado'}
          </DialogDescription>
        </DialogHeader>

        {!form || !product ? null : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor={skuId}>SKU</Label>
              <Input
                id={skuId}
                value={form.sku}
                onChange={e =>
                  setForm(prev =>
                    prev ? { ...prev, sku: e.target.value } : prev
                  )
                }
                placeholder="Digite o SKU"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={eanId}>EAN</Label>
              <Input
                id={eanId}
                value={form.ean}
                onChange={e =>
                  setForm(prev =>
                    prev ? { ...prev, ean: e.target.value } : prev
                  )
                }
                placeholder="Digite o EAN"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
