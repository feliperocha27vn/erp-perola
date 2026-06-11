import { Switch } from '@base-ui/react/switch'
import { Modal } from '@mui/base/Modal'
import { Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useDeleteStocksStockId } from '@/api/hooks/stocksController/useDeleteStocksStockId'
import { useGetProductsProductIdStocks } from '@/api/hooks/stocksController/useGetProductsProductIdStocks'
import { usePatchStocksStockId } from '@/api/hooks/stocksController/usePatchStocksStockId'
import { usePostProductsProductIdStocks } from '@/api/hooks/stocksController/usePostProductsProductIdStocks'
import { Button } from '@/components/ui/button'
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
    <Modal open={open} onClose={handleClose}>
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 px-4 py-6 overflow-y-auto">
        <div className="glass-card w-full max-w-3xl rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Gerenciar Estoques
              </h2>
              <p className="text-sm text-muted-foreground">
                {product?.sku} — EAN: {product?.ean}
              </p>
            </div>
            <Button variant="outline" onClick={handleClose} type="button">
              Fechar
            </Button>
          </div>

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
                    className="rounded-xl border border-border bg-secondary/40 p-4 space-y-3"
                  >
                    {isEditing ? (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
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
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                        <div className="rounded-lg border border-border px-3 py-2 text-sm text-foreground">
                          {stock.title}
                        </div>
                        <div className="rounded-lg border border-border px-3 py-2 text-sm text-foreground">
                          {stock.qtde}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                          <span>{stock.full ? 'Full' : 'Normal'}</span>
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
              <div className="rounded-xl border border-border bg-secondary/40 p-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
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
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
