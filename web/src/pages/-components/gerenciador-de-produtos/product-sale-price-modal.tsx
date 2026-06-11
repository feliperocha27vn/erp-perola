import { useEffect, useId, useMemo, useState } from 'react'
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

export type ProductSalePriceForm = {
  sale_price_cents: number
}

type ProductSalePriceModalProps = {
  open: boolean
  product: ProductItem | null
  isSaving: boolean
  onClose: () => void
  onSave: (form: ProductSalePriceForm) => Promise<void>
}

function formatCentsToBrl(cents: number | null): string {
  const value = cents ?? 0
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value / 100)
}

function parseBrlToCents(raw: string): number | null {
  const digits = raw.replace(/\D/g, '')

  if (!digits) {
    return null
  }

  const cents = Number(digits)

  if (!Number.isFinite(cents) || cents <= 0) {
    return null
  }

  return cents
}

function formatInputFromCents(cents: number | null): string {
  return formatCentsToBrl(cents)
}

function calculateDiscountCents(baseCents: number, multiplier: number): number {
  return Math.trunc(baseCents * multiplier)
}

export function ProductSalePriceModal({
  open,
  product,
  isSaving,
  onClose,
  onSave,
}: ProductSalePriceModalProps) {
  const [rawInput, setRawInput] = useState('')
  const baseId = useId()
  const salePriceInputId = `${baseId}-sale-price`

  useEffect(() => {
    if (!open || !product) {
      return
    }

    setRawInput(formatInputFromCents(product.sale_price_cents ?? null))
  }, [open, product])

  const parsedCents = useMemo(() => parseBrlToCents(rawInput), [rawInput])

  const price20 = useMemo(() => {
    if (!parsedCents) {
      return 0
    }

    return calculateDiscountCents(parsedCents, 1.25)
  }, [parsedCents])

  const price40 = useMemo(() => {
    if (!parsedCents) {
      return 0
    }

    return calculateDiscountCents(parsedCents, 1.667)
  }, [parsedCents])

  const handleSave = async () => {
    if (!parsedCents) {
      toast.error('Informe um preço de venda válido.')
      return
    }

    await onSave({ sale_price_cents: parsedCents })
  }

  const handleChangeInput = (value: string) => {
    const cents = parseBrlToCents(value)

    if (!cents) {
      setRawInput(value)
      return
    }

    setRawInput(formatInputFromCents(cents))
  }

  return (
    <Dialog open={open} onOpenChange={next => !next && onClose()}>
      <DialogContent className="border-border bg-card text-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Preço de venda</DialogTitle>
          <DialogDescription>
            {product
              ? `${product.sku} — EAN: ${product.ean}`
              : 'Produto não selecionado'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={salePriceInputId}>Preço de venda</Label>
            <Input
              id={salePriceInputId}
              inputMode="numeric"
              placeholder="R$ 0,00"
              value={rawInput}
              onChange={e => handleChangeInput(e.target.value)}
            />
          </div>

          <div className="space-y-2 rounded-xl border border-border p-3">
            <p className="text-xs text-muted-foreground">
              Preço para 20% de desconto
            </p>
            <p className="text-base font-semibold text-foreground">
              {formatCentsToBrl(price20)}
            </p>
          </div>

          <div className="space-y-2 rounded-xl border border-border p-3">
            <p className="text-xs text-muted-foreground">
              Preço para 40% de desconto
            </p>
            <p className="text-base font-semibold text-foreground">
              {formatCentsToBrl(price40)}
            </p>
          </div>
        </div>

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
