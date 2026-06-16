import { Switch } from '@base-ui/react/switch'
import { Plus, Trash2, Warehouse } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useDeleteStocksStockId } from '@/api/hooks/stocksController/useDeleteStocksStockId'
import { useGetProductsProductIdStocks } from '@/api/hooks/stocksController/useGetProductsProductIdStocks'
import { usePatchStocksStockId } from '@/api/hooks/stocksController/usePatchStocksStockId'
import { usePostProductsProductIdStocks } from '@/api/hooks/stocksController/usePostProductsProductIdStocks'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { queryClient } from '@/lib/react-query'
import type { ProductItem, ProductStockItem } from './types'

type EditableStock = {
  title: string
  qtde: string
  full: boolean
}

type StockManagerModalProps = {
  open: boolean
  product: ProductItem | null
  onClose: () => void
}

function normalizeStockForm(stock: {
  title: string
  qtde: number
  full: boolean
}): EditableStock {
  return {
    title: stock.title,
    qtde: String(stock.qtde),
    full: stock.full,
  }
}

function parseQtde(value: string): number | null {
  const parsed = Number(value)
  if (Number.isNaN(parsed) || parsed < 0) return null
  return parsed
}

export function StockManagerModal({
  open,
  product,
  onClose,
}: StockManagerModalProps) {
  const productId = product?.id ?? ''

  const { data, isLoading } = useGetProductsProductIdStocks(productId, {
    query: {
      enabled: open && Boolean(productId),
    },
  })

  const [isCreating, setIsCreating] = useState(false)
  const [editingStockId, setEditingStockId] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState<EditableStock>({
    title: '',
    qtde: '0',
    full: false,
  })
  const [editForm, setEditForm] = useState<EditableStock>({
    title: '',
    qtde: '0',
    full: false,
  })

  const stocks = useMemo(() => data?.stocks ?? [], [data?.stocks])

  const resetState = () => {
    setIsCreating(false)
    setEditingStockId(null)
    setCreateForm({ title: '', qtde: '0', full: false })
    setEditForm({ title: '', qtde: '0', full: false })
  }

  const invalidateStocks = () => {
    queryClient.invalidateQueries({ queryKey: [{ url: '/products' }] })
    if (productId) {
      queryClient.invalidateQueries({
        queryKey: [
          {
            url: '/products/:productId/stocks',
            params: { productId },
          },
        ],
      })
    }
  }

  const createMutation = usePostProductsProductIdStocks({
    mutation: {
      onSuccess: () => {
        toast.success('Estoque cadastrado com sucesso!')
        invalidateStocks()
        setIsCreating(false)
        setCreateForm({ title: '', qtde: '0', full: false })
      },
      onError: () => {
        toast.error('Erro ao cadastrar estoque.')
      },
    },
  })

  const updateMutation = usePatchStocksStockId({
    mutation: {
      onSuccess: () => {
        toast.success('Estoque atualizado com sucesso!')
        invalidateStocks()
        setEditingStockId(null)
        setEditForm({ title: '', qtde: '0', full: false })
      },
      onError: () => {
        toast.error('Erro ao atualizar estoque.')
      },
    },
  })

  const deleteMutation = useDeleteStocksStockId({
    mutation: {
      onSuccess: () => {
        toast.success('Estoque excluído com sucesso!')
        invalidateStocks()
        if (editingStockId) {
          setEditingStockId(null)
          setEditForm({ title: '', qtde: '0', full: false })
        }
      },
      onError: () => {
        toast.error('Erro ao excluir estoque.')
      },
    },
  })

  const handleClose = () => {
    resetState()
    onClose()
  }

  const handleCreate = () => {
    const title = createForm.title.trim()
    const qtde = parseQtde(createForm.qtde)

    if (!title) {
      toast.error('Informe o nome da loja/marketplace.')
      return
    }

    if (qtde === null) {
      toast.error('Informe uma quantidade válida.')
      return
    }

    createMutation.mutate({
      productId,
      data: {
        title,
        qtde,
        full: createForm.full,
      },
    })
  }

  const handleStartEditing = (stock: ProductStockItem) => {
    setIsCreating(false)
    setEditingStockId(stock.id)
    setEditForm(normalizeStockForm(stock))
  }

  const handleUpdate = (stockId: string) => {
    const title = editForm.title.trim()
    const qtde = parseQtde(editForm.qtde)

    if (!title) {
      toast.error('Informe o nome da loja/marketplace.')
      return
    }

    if (qtde === null) {
      toast.error('Informe uma quantidade válida.')
      return
    }

    if (stockId !== editingStockId) {
      toast.error('Estoque em edição inválido.')
      return
    }

    updateMutation.mutate({
      stockId,
      data: {
        title,
        qtde,
        full: editForm.full,
      },
    })
  }

  const handleDelete = (stockId: string) => {
    deleteMutation.mutate({ stockId })
  }

  return (
    <Dialog open={open} onOpenChange={next => !next && handleClose()}>
      <DialogContent className="max-w-3xl md:max-w-4xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Estoques</DialogTitle>
          <DialogDescription>
            {product?.sku} — EAN: {product?.ean}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">
              Carregando estoques...
            </p>
          ) : stocks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum estoque cadastrado.
            </p>
          ) : (
            stocks.map(stock => {
              const isEditing = editingStockId === stock.id

              return (
                <div
                  key={stock.id}
                  className="rounded-xl border border-border bg-secondary/40 p-4"
                >
                  {isEditing ? (
                    <>
                      {/* Mobile: campos empilhados em card */}
                      <div className="space-y-3 md:hidden">
                        <Input
                          value={editForm.title}
                          onChange={e =>
                            setEditForm(prev => ({
                              ...prev,
                              title: e.target.value,
                            }))
                          }
                          placeholder="Loja / Marketplace"
                        />
                        <Input
                          type="number"
                          min={0}
                          value={editForm.qtde}
                          onChange={e =>
                            setEditForm(prev => ({
                              ...prev,
                              qtde: e.target.value,
                            }))
                          }
                          placeholder="Quantidade"
                        />
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Switch.Root
                            checked={editForm.full}
                            onCheckedChange={(checked: boolean) =>
                              setEditForm(prev => ({ ...prev, full: checked }))
                            }
                            className="relative h-6 w-10 rounded-full bg-white/20 data-[checked]:bg-emerald-500 transition-colors"
                          >
                            <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white transition-transform data-[checked]:translate-x-[1.2rem]" />
                          </Switch.Root>
                          <span>{editForm.full ? 'Full' : 'Normal'}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            onClick={() => handleUpdate(stock.id)}
                            disabled={updateMutation.isPending}
                            type="button"
                          >
                            {updateMutation.isPending
                              ? 'Salvando...'
                              : 'Salvar'}
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

                      {/* Desktop: layout original em 4 colunas */}
                      <div className="hidden md:grid md:grid-cols-[1fr_1fr_auto_auto] md:gap-3 md:items-center">
                        <Input
                          value={editForm.title}
                          onChange={e =>
                            setEditForm(prev => ({
                              ...prev,
                              title: e.target.value,
                            }))
                          }
                          placeholder="Loja / Marketplace"
                        />
                        <Input
                          type="number"
                          min={0}
                          value={editForm.qtde}
                          onChange={e =>
                            setEditForm(prev => ({
                              ...prev,
                              qtde: e.target.value,
                            }))
                          }
                          placeholder="Quantidade"
                        />
                        <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                          <Switch.Root
                            checked={editForm.full}
                            onCheckedChange={(checked: boolean) =>
                              setEditForm(prev => ({ ...prev, full: checked }))
                            }
                            className="relative h-6 w-10 rounded-full bg-white/20 data-[checked]:bg-emerald-500 transition-colors shrink-0"
                          >
                            <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white transition-transform data-[checked]:translate-x-[1.2rem]" />
                          </Switch.Root>
                          <span className="whitespace-nowrap">{editForm.full ? 'Full' : 'Normal'}</span>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button
                            onClick={() => handleUpdate(stock.id)}
                            disabled={updateMutation.isPending}
                            type="button"
                          >
                            {updateMutation.isPending
                              ? 'Salvando...'
                              : 'Salvar'}
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
                    </>
                  ) : (
                    <>
                      {/* Mobile: card vertical */}
                      <div className="space-y-3 md:hidden">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <Warehouse className="size-4 text-muted-foreground shrink-0" />
                            <span className="font-semibold text-foreground truncate">
                              {stock.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs shrink-0">
                            <Switch.Root
                              checked={stock.full}
                              onCheckedChange={(checked: boolean) => {
                                updateMutation.mutate({
                                  stockId: stock.id,
                                  data: {
                                    title: stock.title,
                                    qtde: stock.qtde,
                                    full: checked,
                                  },
                                })
                              }}
                              disabled={updateMutation.isPending}
                              className="relative h-6 w-10 rounded-full bg-white/20 data-[checked]:bg-emerald-500 transition-colors"
                            >
                              <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white transition-transform data-[checked]:translate-x-[1.2rem]" />
                            </Switch.Root>
                            <span className="text-muted-foreground">
                              {stock.full ? 'Full' : 'Normal'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm border-t border-border/60 pt-3">
                          <span className="text-muted-foreground">
                            Quantidade
                          </span>
                          <span className="font-semibold tabular-nums text-foreground">
                            {stock.qtde}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <Button
                            variant="outline"
                            onClick={() => handleStartEditing(stock)}
                            type="button"
                          >
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleDelete(stock.id)}
                            disabled={deleteMutation.isPending}
                            type="button"
                          >
                            <Trash2 className="size-4 mr-1" />
                            Excluir
                          </Button>
                        </div>
                      </div>

                      {/* Desktop: layout original em 4 colunas */}
                      <div className="hidden md:grid md:grid-cols-[1fr_1fr_auto_auto] md:gap-3 md:items-center">
                        <div className="rounded-lg border border-border px-3 py-2 text-sm text-foreground min-w-0 truncate">
                          {stock.title}
                        </div>
                        <div className="rounded-lg border border-border px-3 py-2 text-sm text-foreground">
                          {stock.qtde}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                          <Switch.Root
                            checked={stock.full}
                            onCheckedChange={(checked: boolean) => {
                              updateMutation.mutate({
                                stockId: stock.id,
                                data: {
                                  title: stock.title,
                                  qtde: stock.qtde,
                                  full: checked,
                                },
                              })
                            }}
                            disabled={updateMutation.isPending}
                            className="relative h-6 w-10 rounded-full bg-white/20 data-[checked]:bg-emerald-500 transition-colors shrink-0"
                          >
                            <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white transition-transform data-[checked]:translate-x-[1.2rem]" />
                          </Switch.Root>
                          <span className="whitespace-nowrap">{stock.full ? 'Full' : 'Normal'}</span>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            onClick={() => handleStartEditing(stock)}
                            type="button"
                          >
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleDelete(stock.id)}
                            disabled={deleteMutation.isPending}
                            type="button"
                          >
                            <Trash2 className="size-4 mr-1" />
                            Excluir
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )
            })
          )}
        </div>

        <div className="pt-2 border-t border-border space-y-3">
          <Button
            onClick={() => {
              setEditingStockId(null)
              setIsCreating(true)
            }}
            type="button"
            variant="outline"
            className="rounded-xl"
          >
            <Plus className="size-4 mr-2" />
            Adicionar Nova Loja
          </Button>

          {isCreating && (
            <div className="rounded-xl border border-border bg-secondary/40 p-4">
              {/* Mobile: campos empilhados */}
              <div className="space-y-3 md:hidden">
                <Input
                  value={createForm.title}
                  onChange={e =>
                    setCreateForm(prev => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Loja / Marketplace"
                />
                <Input
                  type="number"
                  min={0}
                  value={createForm.qtde}
                  onChange={e =>
                    setCreateForm(prev => ({ ...prev, qtde: e.target.value }))
                  }
                  placeholder="Quantidade"
                />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Switch.Root
                    checked={createForm.full}
                    onCheckedChange={(checked: boolean) =>
                      setCreateForm(prev => ({ ...prev, full: checked }))
                    }
                    className="relative h-6 w-10 rounded-full bg-white/20 data-[checked]:bg-emerald-500 transition-colors"
                  >
                    <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white transition-transform data-[checked]:translate-x-[1.2rem]" />
                  </Switch.Root>
                  <span>{createForm.full ? 'Full' : 'Normal'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={handleCreate}
                    disabled={createMutation.isPending}
                    type="button"
                  >
                    {createMutation.isPending ? 'Salvando...' : 'Salvar'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreating(false)}
                    type="button"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>

              {/* Desktop: layout original em 4 colunas */}
              <div className="hidden md:grid md:grid-cols-[1fr_1fr_auto_auto] md:gap-3 md:items-center">
                <Input
                  value={createForm.title}
                  onChange={e =>
                    setCreateForm(prev => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Loja / Marketplace"
                />
                <Input
                  type="number"
                  min={0}
                  value={createForm.qtde}
                  onChange={e =>
                    setCreateForm(prev => ({ ...prev, qtde: e.target.value }))
                  }
                  placeholder="Quantidade"
                />
                <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                  <Switch.Root
                    checked={createForm.full}
                    onCheckedChange={(checked: boolean) =>
                      setCreateForm(prev => ({ ...prev, full: checked }))
                    }
                    className="relative h-6 w-10 rounded-full bg-white/20 data-[checked]:bg-emerald-500 transition-colors shrink-0"
                  >
                    <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white transition-transform data-[checked]:translate-x-[1.2rem]" />
                  </Switch.Root>
                  <span className="whitespace-nowrap">{createForm.full ? 'Full' : 'Normal'}</span>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    onClick={handleCreate}
                    disabled={createMutation.isPending}
                    type="button"
                  >
                    {createMutation.isPending ? 'Salvando...' : 'Salvar'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreating(false)}
                    type="button"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
