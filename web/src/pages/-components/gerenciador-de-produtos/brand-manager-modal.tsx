import { Modal } from '@mui/base/Modal'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useDeleteBrandsId } from '@/api/hooks/brandsController/useDeleteBrandsId'
import { useGetBrands } from '@/api/hooks/brandsController/useGetBrands'
import { usePatchBrandsId } from '@/api/hooks/brandsController/usePatchBrandsId'
import { usePostBrands } from '@/api/hooks/brandsController/usePostBrands'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { queryClient } from '@/lib/react-query'
import type { BrandItem } from './types'

type BrandManagerModalProps = {
  open: boolean
  onClose: () => void
}

type BrandManagerRootProps = {
  children: React.ReactNode
}

function BrandManagerRoot({ children }: BrandManagerRootProps) {
  return (
    <div className="glass-card w-full max-w-2xl rounded-2xl p-6 space-y-4">
      {children}
    </div>
  )
}

type BrandManagerHeaderProps = {
  onClose: () => void
}

function BrandManagerHeader({ onClose }: BrandManagerHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl font-bold text-foreground">Gerenciar Marcas</h2>
        <p className="text-sm text-muted-foreground">
          Adicionar, editar e excluir marcas
        </p>
      </div>
      <Button variant="outline" onClick={onClose} type="button">
        Fechar
      </Button>
    </div>
  )
}

type BrandManagerCreateProps = {
  value: string
  isPending: boolean
  onChange: (value: string) => void
  onCreate: () => void
}

function BrandManagerCreate({
  value,
  isPending,
  onChange,
  onCreate,
}: BrandManagerCreateProps) {
  return (
    <div className="rounded-xl border border-border bg-secondary/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-foreground">Nova Marca</p>
      </div>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Nome da marca"
        />
        <Button onClick={onCreate} disabled={isPending} type="button">
          <Plus className="size-4 mr-1" />
          {isPending ? 'Salvando...' : 'Adicionar'}
        </Button>
      </div>
    </div>
  )
}

type BrandManagerListProps = {
  brands: BrandItem[]
  editingId: string | null
  editingName: string
  isUpdating: boolean
  isDeleting: boolean
  onStartEdit: (brand: BrandItem) => void
  onChangeEditName: (value: string) => void
  onCancelEdit: () => void
  onSaveEdit: (id: string) => void
  onDelete: (id: string) => void
}

function BrandManagerList({
  brands,
  editingId,
  editingName,
  isUpdating,
  isDeleting,
  onStartEdit,
  onChangeEditName,
  onCancelEdit,
  onSaveEdit,
  onDelete,
}: BrandManagerListProps) {
  return (
    <div className="space-y-2">
      {brands.map(brand => {
        const isEditing = editingId === brand.id

        return (
          <div
            key={brand.id}
            className="rounded-xl border border-border bg-secondary/40 p-3"
          >
            {isEditing ? (
              <div className="flex gap-2">
                <Input
                  value={editingName}
                  onChange={e => onChangeEditName(e.target.value)}
                  placeholder="Nome da marca"
                />
                <Button
                  type="button"
                  onClick={() => onSaveEdit(brand.id)}
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Salvando...' : 'Salvar'}
                </Button>
                <Button type="button" variant="outline" onClick={onCancelEdit}>
                  Cancelar
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <p className="text-foreground text-sm">{brand.name}</p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onStartEdit(brand)}
                  >
                    <Pencil className="size-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onDelete(brand.id)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="size-4 mr-1" />
                    Excluir
                  </Button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

const BrandManager = {
  Root: BrandManagerRoot,
  Header: BrandManagerHeader,
  Create: BrandManagerCreate,
  List: BrandManagerList,
}

export function BrandManagerModal({ open, onClose }: BrandManagerModalProps) {
  const { data, isLoading } = useGetBrands({
    query: {
      enabled: open,
    },
  })

  const [newBrandName, setNewBrandName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const brands = useMemo(() => data?.brands ?? [], [data?.brands])

  const invalidateBrands = () => {
    queryClient.invalidateQueries({ queryKey: [{ url: '/brands' }] })
    queryClient.invalidateQueries({ queryKey: [{ url: '/products' }] })
  }

  const createMutation = usePostBrands({
    mutation: {
      onSuccess: () => {
        toast.success('Marca criada com sucesso!')
        setNewBrandName('')
        invalidateBrands()
      },
      onError: () => {
        toast.error('Erro ao criar marca.')
      },
    },
  })

  const updateMutation = usePatchBrandsId({
    mutation: {
      onSuccess: () => {
        toast.success('Marca atualizada com sucesso!')
        setEditingId(null)
        setEditingName('')
        invalidateBrands()
      },
      onError: () => {
        toast.error('Erro ao atualizar marca.')
      },
    },
  })

  const deleteMutation = useDeleteBrandsId({
    mutation: {
      onSuccess: () => {
        toast.success('Marca excluída com sucesso!')
        invalidateBrands()
      },
      onError: () => {
        toast.error('Erro ao excluir marca.')
      },
    },
  })

  const handleCreate = () => {
    const name = newBrandName.trim()
    if (!name) {
      toast.error('Informe o nome da marca.')
      return
    }

    createMutation.mutate({ data: { name } })
  }

  const handleSaveEdit = (id: string) => {
    const name = editingName.trim()
    if (!name) {
      toast.error('Informe o nome da marca.')
      return
    }

    updateMutation.mutate({ id, data: { name } })
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 px-4">
        <BrandManager.Root>
          <BrandManager.Header onClose={onClose} />

          <BrandManager.Create
            value={newBrandName}
            isPending={createMutation.isPending}
            onChange={setNewBrandName}
            onCreate={handleCreate}
          />

          {isLoading ? (
            <p className="text-sm text-muted-foreground">
              Carregando marcas...
            </p>
          ) : brands.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma marca cadastrada.
            </p>
          ) : (
            <BrandManager.List
              brands={brands}
              editingId={editingId}
              editingName={editingName}
              isUpdating={updateMutation.isPending}
              isDeleting={deleteMutation.isPending}
              onStartEdit={brand => {
                setEditingId(brand.id)
                setEditingName(brand.name)
              }}
              onChangeEditName={setEditingName}
              onCancelEdit={() => {
                setEditingId(null)
                setEditingName('')
              }}
              onSaveEdit={handleSaveEdit}
              onDelete={id => deleteMutation.mutate({ id })}
            />
          )}
        </BrandManager.Root>
      </div>
    </Modal>
  )
}
