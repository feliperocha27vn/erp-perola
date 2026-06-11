import { Dialog } from '@base-ui/react/dialog'
import { addMinutes, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Calendar,
  DollarSign,
  Network,
  Package,
  Receipt,
  Store,
} from 'lucide-react'
import type { SaleItem } from './types'

type SalesManagerViewDialogProps = {
  open: boolean
  sale: SaleItem | null
  onOpenChange: (open: boolean) => void
}

export function SalesManagerViewDialog({
  open,
  sale,
  onOpenChange,
}: SalesManagerViewDialogProps) {
  const saleDate = sale
    ? format(
        addMinutes(
          new Date(sale.sale_date),
          new Date(sale.sale_date).getTimezoneOffset()
        ),
        'dd/MM/yyyy',
        { locale: ptBR }
      )
    : '-'

  const totalValue = sale
    ? new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(sale.total_price / 100)
    : '-'

  const channelIcon =
    sale?.channel === 'Amazon'
      ? 'A'
      : sale?.channel === 'Mercado Livre'
        ? 'ML'
        : sale?.channel === 'Shopee'
          ? 'S'
          : 'D'

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Dialog.Popup className="w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-background p-0 shadow-xl">
            <div className="bg-gradient-to-r from-primary/10 via-secondary/60 to-transparent px-6 py-5 border-b border-border">
              <Dialog.Title className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Receipt className="size-5 text-primary" />
                Detalhes da venda
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                Visualize os dados completos da venda selecionada.
              </Dialog.Description>
            </div>

            <div className="p-6">
              <div className="overflow-hidden rounded-lg border border-border bg-card">
                <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-border">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Package className="size-4" />
                    SKU
                  </p>
                  <p className="text-sm font-medium text-foreground text-right">
                    {sale?.product.sku ?? '-'}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-border">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Network className="size-4" />
                    Canal
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-border px-1 text-[10px] font-semibold text-muted-foreground">
                      {channelIcon}
                    </span>
                    <p className="text-sm font-medium text-foreground text-right">
                      {sale?.channel ?? '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-border">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
                      <DollarSign className="size-3 text-primary" />
                    </span>
                    Valor
                  </p>
                  <p className="text-sm font-semibold text-primary text-right">
                    {totalValue}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-border">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="size-4" />
                    Data
                  </p>
                  <p className="text-sm font-medium text-foreground text-right">
                    {saleDate}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-border">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Store className="size-4" />
                    Loja
                  </p>
                  <p className="text-sm font-medium text-foreground text-right">
                    {sale?.store?.name ?? '—'}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Store className="size-4" />
                    Origem do estoque
                  </p>
                  <p className="text-sm font-medium text-foreground text-right">
                    {sale?.stock.title ?? '-'}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border flex justify-end bg-muted/20">
              <Dialog.Close className="inline-flex h-10 items-center rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
                Fechar
              </Dialog.Close>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
