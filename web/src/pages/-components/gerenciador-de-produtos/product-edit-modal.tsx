import { Switch } from '@base-ui/react/switch'
import { Copy, History, PackagePlus, Plus, Trash2, Warehouse } from 'lucide-react'
import { useEffect, useId, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useGetProductsProductIdStockEntries } from '@/api/hooks/stockEntriesController/useGetProductsProductIdStockEntries'
import { usePostStocksStockIdEntries } from '@/api/hooks/stockEntriesController/usePostStocksStockIdEntries'
import { usePatchProductsId } from '@/api/hooks/productsController/usePatchProductsId'
import { useDeleteStocksStockId } from '@/api/hooks/stocksController/useDeleteStocksStockId'
import { useGetProductsProductIdStocks } from '@/api/hooks/stocksController/useGetProductsProductIdStocks'
import { usePatchStocksStockId } from '@/api/hooks/stocksController/usePatchStocksStockId'
import { usePostProductsProductIdStocks } from '@/api/hooks/stocksController/usePostProductsProductIdStocks'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { queryClient } from '@/lib/react-query'
import {
  parseDeveloperDetailsJson,
  type ProductTechnicalDetailsForm,
} from './product-details-json-parser'
import type { ProductItem, ProductStockItem } from './types'

// ─── BRL helpers ─────────────────────────────────────────────────────────────

function formatCentsToBrl(cents: number | null): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format((cents ?? 0) / 100)
}

function parseBrlToCents(raw: string): number | null {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return null
  const cents = Number(digits)
  if (!Number.isFinite(cents) || cents <= 0) return null
  return cents
}

// ─── Stock helpers ────────────────────────────────────────────────────────────

type EditableStock = { title: string; qtde: string; full: boolean }

function normalizeStockForm(s: { title: string; qtde: number; full: boolean }): EditableStock {
  return { title: s.title, qtde: String(s.qtde), full: s.full }
}

function parseQtde(v: string): number | null {
  const n = Number(v)
  return Number.isNaN(n) || n < 0 ? null : n
}

// ─── Technical details form type ─────────────────────────────────────────────

type TechnicalForm = ProductTechnicalDetailsForm

function buildTechnicalForm(p: ProductItem): TechnicalForm {
  return {
    technical_title: p.technical_title ?? '',
    technical_description: p.technical_description ?? '',
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Tab = 'dados' | 'estoques' | 'lancamentos' | 'detalhes'

type ProductEditModalProps = {
  open: boolean
  product: ProductItem | null
  brands: Array<{ id: string; name: string }>
  onClose: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProductEditModal({
  open,
  product,
  brands,
  onClose,
}: ProductEditModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('dados')

  // ── Dados tab state ──
  const [sku, setSku] = useState('')
  const [ean, setEan] = useState('')
  const [brandId, setBrandId] = useState('')
  const [urlImage, setUrlImage] = useState('')
  const [priceRaw, setPriceRaw] = useState('')

  // ── Detalhes tab state ──
  const [technicalForm, setTechnicalForm] = useState<TechnicalForm | null>(null)
  const [jsonOpen, setJsonOpen] = useState(false)
  const [jsonValue, setJsonValue] = useState('')

  // ── Estoques tab state ──
  const [isCreating, setIsCreating] = useState(false)
  const [editingStockId, setEditingStockId] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState<EditableStock>({ title: '', qtde: '0', full: false })
  const [editForm, setEditForm] = useState<EditableStock>({ title: '', qtde: '0', full: false })

  // ── Lançamentos tab state ──
  const [launchingStockId, setLaunchingStockId] = useState<string | null>(null)
  const [launchForm, setLaunchForm] = useState({ quantity: '', notes: '' })

  const productId = product?.id ?? ''
  const baseId = useId()

  // Populate form when modal opens
  useEffect(() => {
    if (!open || !product) return
    setSku(product.sku)
    setEan(product.ean)
    setBrandId(product.brand?.id ?? '')
    setUrlImage(product.url_image ?? '')
    setPriceRaw(formatCentsToBrl(product.sale_price_cents ?? null))
    setTechnicalForm(buildTechnicalForm(product))
    setActiveTab('dados')
    setJsonOpen(false)
    setJsonValue('')
    setIsCreating(false)
    setEditingStockId(null)
    setLaunchingStockId(null)
    setLaunchForm({ quantity: '', notes: '' })
  }, [open, product])

  // ── Mutations ──
  const patchMutation = usePatchProductsId({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [{ url: '/products' }] })
      },
    },
  })

  const invalidateStocks = () => {
    queryClient.invalidateQueries({ queryKey: [{ url: '/products' }] })
    if (productId) {
      queryClient.invalidateQueries({
        queryKey: [{ url: '/products/:productId/stocks', params: { productId } }],
      })
    }
  }

  const { data: stocksData, isLoading: isStocksLoading } = useGetProductsProductIdStocks(productId, {
    query: { enabled: open && Boolean(productId) },
  })
  const stocks = useMemo(() => stocksData?.stocks ?? [], [stocksData?.stocks])

  const { data: entriesData, isLoading: isEntriesLoading } = useGetProductsProductIdStockEntries(productId, {
    query: { enabled: open && Boolean(productId) && activeTab === 'lancamentos' },
  })
  const entries = useMemo(() => entriesData?.entries ?? [], [entriesData?.entries])

  const createEntryMutation = usePostStocksStockIdEntries({
    mutation: {
      onSuccess: () => {
        toast.success('Entrada lançada!')
        queryClient.invalidateQueries({ queryKey: [{ url: '/products' }] })
        if (productId) {
          queryClient.invalidateQueries({
            queryKey: [{ url: '/products/:productId/stocks', params: { productId } }],
          })
          queryClient.invalidateQueries({
            queryKey: [{ url: '/products/:productId/stock-entries', params: { productId } }],
          })
          queryClient.invalidateQueries({ queryKey: [{ url: '/stock-entries' }] })
        }
        setLaunchingStockId(null)
        setLaunchForm({ quantity: '', notes: '' })
      },
      onError: () => toast.error('Erro ao lançar entrada.'),
    },
  })

  const createStockMutation = usePostProductsProductIdStocks({
    mutation: {
      onSuccess: () => {
        toast.success('Estoque cadastrado!')
        invalidateStocks()
        setIsCreating(false)
        setCreateForm({ title: '', qtde: '0', full: false })
      },
      onError: () => toast.error('Erro ao cadastrar estoque.'),
    },
  })

  const updateStockMutation = usePatchStocksStockId({
    mutation: {
      onSuccess: () => {
        toast.success('Estoque atualizado!')
        invalidateStocks()
        setEditingStockId(null)
      },
      onError: () => toast.error('Erro ao atualizar estoque.'),
    },
  })

  const deleteStockMutation = useDeleteStocksStockId({
    mutation: {
      onSuccess: () => {
        toast.success('Estoque excluído!')
        invalidateStocks()
        setEditingStockId(null)
      },
      onError: () => toast.error('Erro ao excluir estoque.'),
    },
  })

  // ── Dados handlers ──
  const parsedCents = useMemo(() => parseBrlToCents(priceRaw), [priceRaw])

  const price20 = useMemo(
    () => (parsedCents ? Math.trunc(parsedCents * 1.25) : 0),
    [parsedCents]
  )
  const price40 = useMemo(
    () => (parsedCents ? Math.trunc(parsedCents * 1.667) : 0),
    [parsedCents]
  )

  const handlePriceInput = (v: string) => {
    const cents = parseBrlToCents(v)
    setPriceRaw(cents ? formatCentsToBrl(cents) : v)
  }

  const handleSaveDados = async () => {
    if (!sku.trim()) { toast.error('Informe o SKU.'); return }
    if (!ean.trim()) { toast.error('Informe o EAN.'); return }

    try {
      await patchMutation.mutateAsync({
        id: productId,
        data: {
          sku: sku.trim(),
          ean: ean.trim(),
          brand_id: brandId || undefined,
          url_image: urlImage.trim() || null,
          sale_price_cents: parsedCents ?? undefined,
        },
      })
      toast.success('Produto atualizado!')
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Erro ao salvar.')
    }
  }

  // ── Detalhes handlers ──
  const updateTechnical = <K extends keyof TechnicalForm>(k: K, v: TechnicalForm[K]) => {
    setTechnicalForm(prev => prev ? { ...prev, [k]: v } : prev)
  }

  const handleCopyField = async (label: string, value: string) => {
    if (!value.trim()) { toast.error(`${label} está vazio.`); return }
    try {
      await navigator.clipboard.writeText(value.trim())
      toast.success(`${label} copiado!`)
    } catch {
      toast.error(`Não foi possível copiar ${label}.`)
    }
  }

  const handleApplyJson = () => {
    if (!jsonValue.trim()) { toast.error('Cole um JSON para preencher.'); return }
    try {
      const parsed = parseDeveloperDetailsJson(jsonValue)
      setTechnicalForm(prev => prev ? { ...prev, ...parsed } : prev)
      toast.success('Campos preenchidos!')
      setJsonOpen(false)
      setJsonValue('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao processar JSON.')
    }
  }

  const handleSaveDetalhes = async () => {
    if (!technicalForm) return
    try {
      await patchMutation.mutateAsync({ id: productId, data: technicalForm })
      toast.success('Detalhes técnicos salvos!')
    } catch {
      toast.error('Erro ao salvar detalhes.')
    }
  }

  // ── Entry handlers ──
  const handleCreateEntry = (stockId: string) => {
    const qty = Number(launchForm.quantity)
    if (!Number.isInteger(qty) || qty < 1) {
      toast.error('Informe uma quantidade válida (mínimo 1).')
      return
    }
    createEntryMutation.mutate({
      stockId,
      data: { quantity: qty, notes: launchForm.notes.trim() || null },
    })
  }

  // ── Stock handlers ──
  const handleCreateStock = () => {
    const title = createForm.title.trim()
    const qtde = parseQtde(createForm.qtde)
    if (!title) { toast.error('Informe o nome da loja/marketplace.'); return }
    if (qtde === null) { toast.error('Informe uma quantidade válida.'); return }
    createStockMutation.mutate({ productId, data: { title, qtde, full: createForm.full } })
  }

  const handleStartEditingStock = (stock: ProductStockItem) => {
    setIsCreating(false)
    setEditingStockId(stock.id)
    setEditForm(normalizeStockForm(stock))
  }

  const handleUpdateStock = (stockId: string) => {
    const title = editForm.title.trim()
    const qtde = parseQtde(editForm.qtde)
    if (!title) { toast.error('Informe o nome da loja/marketplace.'); return }
    if (qtde === null) { toast.error('Informe uma quantidade válida.'); return }
    updateStockMutation.mutate({ stockId, data: { title, qtde, full: editForm.full } })
  }

  // ─────────────────────────────────────────────────────────────────────────────

  const tabs: { key: Tab; label: string }[] = [
    { key: 'dados', label: 'Dados' },
    { key: 'estoques', label: 'Estoques' },
    { key: 'lancamentos', label: 'Lançamentos' },
    { key: 'detalhes', label: 'Detalhes técnicos' },
  ]

  return (
    <Dialog open={open} onOpenChange={next => !next && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle>Editar produto</DialogTitle>
          <DialogDescription>
            {product?.sku} — EAN: {product?.ean}
          </DialogDescription>
        </DialogHeader>

        {/* Tab bar */}
        <div className="flex border-b border-border px-6 mt-4">
          {tabs.map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={[
                'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === t.key
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* ── Dados ── */}
          {activeTab === 'dados' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor={`${baseId}-sku`}>SKU</Label>
                  <Input
                    id={`${baseId}-sku`}
                    value={sku}
                    onChange={e => setSku(e.target.value)}
                    placeholder="SKU do produto"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`${baseId}-ean`}>EAN</Label>
                  <Input
                    id={`${baseId}-ean`}
                    value={ean}
                    onChange={e => setEan(e.target.value)}
                    placeholder="EAN do produto"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`${baseId}-brand`}>Marca</Label>
                <select
                  id={`${baseId}-brand`}
                  value={brandId}
                  onChange={e => setBrandId(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  <option value="">Sem marca</option>
                  {brands.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`${baseId}-image`}>URL da imagem</Label>
                <Input
                  id={`${baseId}-image`}
                  type="url"
                  value={urlImage}
                  onChange={e => setUrlImage(e.target.value)}
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor={`${baseId}-price`}>Preço de venda</Label>
                  <Input
                    id={`${baseId}-price`}
                    inputMode="numeric"
                    placeholder="R$ 0,00"
                    value={priceRaw}
                    onChange={e => handlePriceInput(e.target.value)}
                  />
                </div>
                {parsedCents ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border p-3 space-y-1">
                      <p className="text-xs text-muted-foreground">Preço para 20% de desconto</p>
                      <p className="text-sm font-semibold">{formatCentsToBrl(price20)}</p>
                    </div>
                    <div className="rounded-xl border border-border p-3 space-y-1">
                      <p className="text-xs text-muted-foreground">Preço para 40% de desconto</p>
                      <p className="text-sm font-semibold">{formatCentsToBrl(price40)}</p>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  onClick={handleSaveDados}
                  disabled={patchMutation.isPending}
                >
                  {patchMutation.isPending ? 'Salvando...' : 'Salvar dados'}
                </Button>
              </div>
            </div>
          )}

          {/* ── Estoques ── */}
          {activeTab === 'estoques' && (
            <div className="space-y-3">
              {isStocksLoading ? (
                <p className="text-sm text-muted-foreground">Carregando estoques...</p>
              ) : stocks.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum estoque cadastrado.</p>
              ) : (
                stocks.map(stock => {
                  const isEditing = editingStockId === stock.id
                  return (
                    <div key={stock.id} className="rounded-xl border border-border bg-secondary/40 p-4">
                      {isEditing ? (
                        <div className="space-y-3">
                          <Input
                            value={editForm.title}
                            onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                            placeholder="Loja / Marketplace"
                          />
                          <Input
                            type="number"
                            min={0}
                            value={editForm.qtde}
                            onChange={e => setEditForm(p => ({ ...p, qtde: e.target.value }))}
                            placeholder="Quantidade"
                          />
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Switch.Root
                              checked={editForm.full}
                              onCheckedChange={(checked: boolean) =>
                                setEditForm(p => ({ ...p, full: checked }))
                              }
                              className="relative h-6 w-10 rounded-full bg-white/20 data-[checked]:bg-emerald-500 transition-colors"
                            >
                              <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white transition-transform data-[checked]:translate-x-[1.2rem]" />
                            </Switch.Root>
                            <span>{editForm.full ? 'Full' : 'Normal'}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              onClick={() => handleUpdateStock(stock.id)}
                              disabled={updateStockMutation.isPending}
                              type="button"
                            >
                              {updateStockMutation.isPending ? 'Salvando...' : 'Salvar'}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setEditingStockId(null)}
                              type="button"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <Warehouse className="size-4 text-muted-foreground shrink-0" />
                              <span className="font-semibold text-foreground truncate">{stock.title}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs shrink-0">
                              <Switch.Root
                                checked={stock.full}
                                onCheckedChange={(checked: boolean) => {
                                  updateStockMutation.mutate({
                                    stockId: stock.id,
                                    data: { title: stock.title, qtde: stock.qtde, full: checked },
                                  })
                                }}
                                disabled={updateStockMutation.isPending}
                                className="relative h-6 w-10 rounded-full bg-white/20 data-[checked]:bg-emerald-500 transition-colors"
                              >
                                <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white transition-transform data-[checked]:translate-x-[1.2rem]" />
                              </Switch.Root>
                              <span className="text-muted-foreground">{stock.full ? 'Full' : 'Normal'}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm border-t border-border/60 pt-3">
                            <span className="text-muted-foreground">Quantidade</span>
                            <span className="font-semibold tabular-nums">{stock.qtde}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 pt-1">
                            <Button variant="outline" onClick={() => handleStartEditingStock(stock)} type="button">
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setEditingStockId(null)
                                setIsCreating(false)
                                setLaunchingStockId(launchingStockId === stock.id ? null : stock.id)
                                setLaunchForm({ quantity: '', notes: '' })
                              }}
                              type="button"
                              className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            >
                              <PackagePlus className="size-4 mr-1" />
                              Entrada
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => deleteStockMutation.mutate({ stockId: stock.id })}
                              disabled={deleteStockMutation.isPending}
                              type="button"
                            >
                              <Trash2 className="size-4 mr-1" />
                              Excluir
                            </Button>
                          </div>

                          {launchingStockId === stock.id && (
                            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 space-y-2">
                              <p className="text-xs font-medium text-emerald-700">Lançar entrada em {stock.title}</p>
                              <Input
                                type="number"
                                min={1}
                                placeholder="Quantidade"
                                value={launchForm.quantity}
                                onChange={e => setLaunchForm(p => ({ ...p, quantity: e.target.value }))}
                              />
                              <Input
                                placeholder="Observação (opcional)"
                                value={launchForm.notes}
                                onChange={e => setLaunchForm(p => ({ ...p, notes: e.target.value }))}
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <Button
                                  onClick={() => handleCreateEntry(stock.id)}
                                  disabled={createEntryMutation.isPending}
                                  type="button"
                                  className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                  {createEntryMutation.isPending ? 'Salvando...' : 'Confirmar'}
                                </Button>
                                <Button variant="outline" onClick={() => setLaunchingStockId(null)} type="button">
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              )}

              <div className="pt-2 border-t border-border space-y-3">
                <Button
                  onClick={() => { setEditingStockId(null); setIsCreating(true) }}
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                >
                  <Plus className="size-4 mr-2" />
                  Adicionar Nova Loja
                </Button>

                {isCreating && (
                  <div className="rounded-xl border border-border bg-secondary/40 p-4 space-y-3">
                    <Input
                      value={createForm.title}
                      onChange={e => setCreateForm(p => ({ ...p, title: e.target.value }))}
                      placeholder="Loja / Marketplace"
                    />
                    <Input
                      type="number"
                      min={0}
                      value={createForm.qtde}
                      onChange={e => setCreateForm(p => ({ ...p, qtde: e.target.value }))}
                      placeholder="Quantidade"
                    />
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Switch.Root
                        checked={createForm.full}
                        onCheckedChange={(checked: boolean) =>
                          setCreateForm(p => ({ ...p, full: checked }))
                        }
                        className="relative h-6 w-10 rounded-full bg-white/20 data-[checked]:bg-emerald-500 transition-colors"
                      >
                        <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white transition-transform data-[checked]:translate-x-[1.2rem]" />
                      </Switch.Root>
                      <span>{createForm.full ? 'Full' : 'Normal'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button onClick={handleCreateStock} disabled={createStockMutation.isPending} type="button">
                        {createStockMutation.isPending ? 'Salvando...' : 'Salvar'}
                      </Button>
                      <Button variant="outline" onClick={() => setIsCreating(false)} type="button">
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Lançamentos ── */}
          {activeTab === 'lancamentos' && (
            <div className="space-y-3">
              {isEntriesLoading ? (
                <p className="text-sm text-muted-foreground">Carregando lançamentos...</p>
              ) : entries.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
                  <History className="size-8 opacity-30" />
                  <p className="text-sm">Nenhuma entrada registrada para este produto.</p>
                  <p className="text-xs">Use o botão "Entrada" no tab Estoques para registrar.</p>
                </div>
              ) : (
                entries.map((entry) => (
                  <div key={entry.id} className="rounded-xl border border-border bg-secondary/30 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Warehouse className="size-4 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium text-foreground truncate">{entry.stock_title}</span>
                      </div>
                      <span className="text-sm font-bold text-emerald-600 tabular-nums shrink-0">+{entry.quantity}</span>
                    </div>
                    {entry.notes && (
                      <p className="mt-1.5 text-xs text-muted-foreground pl-6">{entry.notes}</p>
                    )}
                    <p className="mt-1.5 text-xs text-muted-foreground/60 pl-6">
                      {new Date(entry.created_at).toLocaleString('pt-BR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Detalhes técnicos ── */}
          {activeTab === 'detalhes' && technicalForm && (
            <div className="space-y-5">
              <section className="rounded-2xl border border-border bg-secondary/30 p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Label htmlFor={`${baseId}-technical-title`}>Título</Label>
                  <Button
                    type="button" variant="ghost" size="sm" className="h-7 px-2"
                    onClick={() => handleCopyField('Título', technicalForm.technical_title)}
                  >
                    <Copy className="size-3.5 mr-1" />Copiar
                  </Button>
                </div>
                <Input
                  id={`${baseId}-technical-title`}
                  value={technicalForm.technical_title}
                  onChange={e => updateTechnical('technical_title', e.target.value)}
                />
              </section>

              <section className="rounded-2xl border border-border bg-secondary/30 p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h4 className="text-sm font-semibold">Descrição</h4>
                  <Button
                    type="button" variant="ghost" size="sm" className="h-7 px-2"
                    onClick={() => handleCopyField('Descrição', technicalForm.technical_description)}
                  >
                    <Copy className="size-3.5 mr-1" />Copiar
                  </Button>
                </div>
                <textarea
                  value={technicalForm.technical_description}
                  onChange={e => updateTechnical('technical_description', e.target.value)}
                  placeholder="Markdown com subtítulo, análise técnica, movimento, caixa e cristal, funcionalidade, mostrador, pulseira e tabela técnica."
                  className="min-h-96 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </section>

              <section className="rounded-2xl border border-dashed border-border bg-secondary/10 p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h4 className="text-sm font-semibold text-muted-foreground">Importar via JSON</h4>
                  <Button
                    type="button" variant="ghost" size="sm"
                    onClick={() => setJsonOpen(o => !o)}
                  >
                    {jsonOpen ? 'Fechar' : 'Abrir'}
                  </Button>
                </div>
                {jsonOpen && (
                  <div className="space-y-3">
                    <textarea
                      id={`${baseId}-json`}
                      value={jsonValue}
                      onChange={e => setJsonValue(e.target.value)}
                      placeholder='Cole o JSON do desenvolvedor aqui...'
                      className="min-h-28 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <Button type="button" variant="outline" onClick={handleApplyJson}>
                      Preencher campos
                    </Button>
                  </div>
                )}
              </section>

              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  onClick={handleSaveDetalhes}
                  disabled={patchMutation.isPending}
                >
                  {patchMutation.isPending ? 'Salvando...' : 'Salvar detalhes'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
