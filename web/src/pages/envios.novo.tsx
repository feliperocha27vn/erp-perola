import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { ArrowLeft, Check, ChevronsUpDown, Package, Plus, Save, Send, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useGetShipmentAccounts } from '@/api/hooks/shipmentAccountsController/useGetShipmentAccounts'
import { usePostShipmentAccounts } from '@/api/hooks/shipmentAccountsController/usePostShipmentAccounts'
import { usePostShipments } from '@/api/hooks/shipmentsController/usePostShipments'
import { usePostShipmentsByIdConfirm } from '@/api/hooks/shipmentsController/usePostShipmentsByIdConfirm'
import { useGetProductsProductIdStocks } from '@/api/hooks/stocksController/useGetProductsProductIdStocks'
import { useGetProducts } from '@/api/hooks/productsController/useGetProducts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { queryClient } from '@/lib/react-query'

const searchSchema = z.object({ shipmentId: z.string().optional() })

export const Route = createFileRoute('/envios/novo')({
  component: EnviosNovoPage,
  validateSearch: searchSchema,
})

interface ShipmentItemState {
  key: number
  product_id: string
  product_sku: string
  quantity: number
  source_stock_id: string
  destination_stock_id: string
  product_search: string
}

function emptyItem(key: number): ShipmentItemState {
  return {
    key,
    product_id: '',
    product_sku: '',
    quantity: 1,
    source_stock_id: '',
    destination_stock_id: '',
    product_search: '',
  }
}

function ItemRow({
  item,
  index,
  onChange,
  onRemove,
}: {
  item: ShipmentItemState
  index: number
  onChange: (key: number, patch: Partial<ShipmentItemState>) => void
  onRemove: (key: number) => void
}) {
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const { data: productsData, isLoading: isProductsLoading } = useGetProducts(
    { search: debouncedSearch || undefined, pageIndex: '0' },
    { query: { enabled: popoverOpen } },
  )
  const products = productsData?.items ?? []

  const { data: stocksData } = useGetProductsProductIdStocks(item.product_id, {
    query: { enabled: !!item.product_id },
  })
  const allStocks = stocksData?.stocks ?? []
  const sourceStocks = allStocks.filter((s) => !s.full)
  const destinationStocks = allStocks.filter((s) => s.full)

  return (
    <div className="flex items-center gap-2 h-[60px] px-6 border-b border-border last:border-b-0 even:bg-muted/30">
      <span className="w-8 text-xs text-muted-foreground font-mono tabular-nums">{index + 1}</span>

      {/* SKU / Product combobox */}
      <div className="flex-1">
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={popoverOpen}
              className="w-full h-9 justify-between font-mono text-xs px-3"
            >
              <span className={cn(!item.product_sku && 'text-muted-foreground font-sans')}>
                {item.product_sku || 'Buscar produto…'}
              </span>
              <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 border-border bg-popover" align="start">
            <Command className="bg-transparent">
              <CommandInput
                placeholder="Buscar por SKU ou EAN…"
                value={searchInput}
                onValueChange={setSearchInput}
              />
              <CommandList className="max-h-60 overflow-y-auto">
                <CommandEmpty>
                  {isProductsLoading ? 'Buscando…' : 'Nenhum produto encontrado.'}
                </CommandEmpty>
                <CommandGroup>
                  {products.map((p) => (
                    <CommandItem
                      key={p.id}
                      value={p.id}
                      keywords={[p.sku, p.ean, p.brand?.name ?? '']}
                      onSelect={() => {
                        onChange(item.key, {
                          product_id: p.id,
                          product_sku: p.sku,
                          source_stock_id: '',
                          destination_stock_id: '',
                        })
                        setSearchInput('')
                        setPopoverOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4 shrink-0',
                          item.product_id === p.id ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      <div>
                        <p className="font-mono text-xs font-semibold">{p.sku}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-56">
                          {p.technical_title ?? p.ean}
                        </p>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Quantity */}
      <div className="w-20">
        <Input
          type="number"
          min={1}
          value={item.quantity}
          onChange={(e) => onChange(item.key, { quantity: Math.max(1, Number(e.target.value)) })}
          className="h-9 text-center font-mono text-sm"
        />
      </div>

      {/* Source stock */}
      <div className="w-52">
        <select
          value={item.source_stock_id}
          disabled={!item.product_id}
          onChange={(e) => onChange(item.key, { source_stock_id: e.target.value })}
          className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">
            {item.product_id ? 'Selecionar origem…' : 'Selecione um produto'}
          </option>
          {sourceStocks.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title} ({s.qtde} unid.)
            </option>
          ))}
        </select>
      </div>

      {/* Destination stock */}
      <div className="w-48">
        <select
          value={item.destination_stock_id}
          disabled={!item.product_id}
          onChange={(e) => onChange(item.key, { destination_stock_id: e.target.value })}
          className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">
            {item.product_id ? 'Selecionar destino…' : 'Selecione um produto'}
          </option>
          {destinationStocks.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </div>

      {/* Remove */}
      <button
        type="button"
        onClick={() => onRemove(item.key)}
        className="flex items-center justify-center w-7 h-7 rounded-full border border-border bg-background hover:border-destructive hover:text-destructive transition-colors text-muted-foreground shrink-0"
      >
        <X size={12} />
      </button>
    </div>
  )
}

let nextKey = 1

function EnviosNovoPage() {
  const navigate = useNavigate()
  const { data: accountsData } = useGetShipmentAccounts()
  const accounts = accountsData?.accounts ?? []

  const [accountId, setAccountId] = useState('')
  const [newAccountDialog, setNewAccountDialog] = useState(false)
  const [newAccountName, setNewAccountName] = useState('')

  const createAccountMutation = usePostShipmentAccounts({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: [{ url: '/shipment-accounts' }] })
        setAccountId(data.account.id)
        setNewAccountName('')
        setNewAccountDialog(false)
        toast.success(`Conta "${data.account.name}" criada.`)
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error ?? 'Erro ao criar conta.'
        toast.error(msg)
      },
    },
  })
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<ShipmentItemState[]>([emptyItem(nextKey++)])

  const handleItemChange = useCallback((key: number, patch: Partial<ShipmentItemState>) => {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)))
  }, [])

  const handleRemove = useCallback((key: number) => {
    setItems((prev) => prev.filter((i) => i.key !== key))
  }, [])

  const addItem = () => setItems((prev) => [...prev, emptyItem(nextKey++)])

  const buildPayload = () => {
    const validItems = items.filter(
      (i) => i.product_id && i.source_stock_id && i.destination_stock_id && i.quantity > 0,
    )
    if (!accountId) {
      toast.error('Selecione a conta de destino.')
      return null
    }
    if (validItems.length === 0) {
      toast.error('Adicione pelo menos um item com produto, estoque de origem e destino preenchidos.')
      return null
    }
    return {
      account_id: accountId,
      date: new Date(date + 'T12:00:00').toISOString(),
      notes: notes.trim() || null,
      items: validItems.map((i) => ({
        product_id: i.product_id,
        quantity: i.quantity,
        source_stock_id: i.source_stock_id,
        destination_stock_id: i.destination_stock_id,
      })),
    }
  }

  const createMutation = usePostShipments()
  const confirmMutation = usePostShipmentsByIdConfirm()

  const handleSaveDraft = async () => {
    const payload = buildPayload()
    if (!payload) return
    try {
      await createMutation.mutateAsync({ data: payload })
      toast.success('Rascunho salvo com sucesso.')
      queryClient.invalidateQueries({ queryKey: [{ url: '/shipments' }] })
      navigate({ to: '/envios' })
    } catch {
      toast.error('Erro ao salvar rascunho.')
    }
  }

  const handleConfirm = async () => {
    const payload = buildPayload()
    if (!payload) return
    try {
      const res = await createMutation.mutateAsync({ data: payload })
      await confirmMutation.mutateAsync({ id: res.shipment.id })
      toast.success('Envio confirmado! Estoque atualizado.')
      queryClient.invalidateQueries({ queryKey: [{ url: '/shipments' }] })
      navigate({ to: '/envios' })
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Erro ao confirmar envio.'
      toast.error(msg)
    }
  }

  const isPending = createMutation.isPending || confirmMutation.isPending

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate({ to: '/envios' })}
          className="flex items-center justify-center w-9 h-9 rounded-full border border-border bg-card text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            ENVIOS
          </p>
          <h1 className="text-4xl font-display font-extrabold text-foreground">Novo Envio</h1>
        </div>
      </div>

      {/* Dialog criar conta */}
      <Dialog open={newAccountDialog} onOpenChange={setNewAccountDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nova conta FBA</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Ex: Amazon BR Principal"
            value={newAccountName}
            onChange={(e) => setNewAccountName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newAccountName.trim()) {
                createAccountMutation.mutate({ data: { name: newAccountName.trim() } })
              }
            }}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewAccountDialog(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!newAccountName.trim() || createAccountMutation.isPending}
              onClick={() =>
                createAccountMutation.mutate({ data: { name: newAccountName.trim() } })
              }
            >
              Criar conta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Meta card */}
      <div className="flex flex-wrap items-end gap-6 rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-1.5 w-72">
          <label className="text-sm font-medium text-foreground">Conta de destino</label>
          <div className="flex gap-2">
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="flex-1 h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Selecionar conta…</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              title="Criar nova conta"
              onClick={() => setNewAccountDialog(true)}
              className="flex items-center justify-center w-11 h-11 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:border-primary transition-colors shrink-0"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 w-48">
          <label className="text-sm font-medium text-foreground">Data do envio</label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-11"
          />
        </div>

        <div className="flex flex-col gap-1.5 flex-1 min-w-60">
          <label className="text-sm font-medium text-foreground">Observação (opcional)</label>
          <Input
            placeholder="Ex: Reposição Black Friday"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="h-11"
          />
        </div>
      </div>

      {/* Items card */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Card header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <Package size={18} className="text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground">Itens do envio</p>
              <p className="text-xs text-muted-foreground">
                Adicione os produtos e quantidades a enviar
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={addItem} className="gap-1.5">
            <Plus size={14} />
            Adicionar item
          </Button>
        </div>

        {/* Column headers */}
        <div className="flex items-center h-11 px-6 bg-muted border-b border-border gap-2">
          <span className="w-8 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            #
          </span>
          <span className="flex-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            SKU / PRODUTO
          </span>
          <span className="w-20 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            QTDE
          </span>
          <span className="w-52 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            ORIGEM (qtde atual)
          </span>
          <span className="w-48 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            DESTINO FBA
          </span>
          <span className="w-7" />
        </div>

        {/* Item rows */}
        {items.map((item, idx) => (
          <ItemRow
            key={item.key}
            item={item}
            index={idx}
            onChange={handleItemChange}
            onRemove={handleRemove}
          />
        ))}

        {items.length === 0 && (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">
            Nenhum item adicionado.{' '}
            <button type="button" className="underline text-primary" onClick={addItem}>
              Adicionar item
            </button>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" onClick={handleSaveDraft} disabled={isPending} className="gap-2">
          <Save size={16} />
          Salvar rascunho
        </Button>
        <Button onClick={handleConfirm} disabled={isPending} className="gap-2">
          <Send size={16} />
          Confirmar envio
        </Button>
      </div>
    </div>
  )
}
