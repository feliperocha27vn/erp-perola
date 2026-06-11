import { createFileRoute } from '@tanstack/react-router'
import { Building2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useDeleteBrandsId } from '@/api/hooks/brandsController/useDeleteBrandsId'
import { useGetBrands } from '@/api/hooks/brandsController/useGetBrands'
import { usePatchBrandsId } from '@/api/hooks/brandsController/usePatchBrandsId'
import { usePostBrands } from '@/api/hooks/brandsController/usePostBrands'
import { queryClient } from '@/lib/react-query'
import { type Brand, BrandManager } from './-components/brand-manager'

export const Route = createFileRoute('/marcas')({
  component: MarcasPage,
})

function MarcasPage() {
  const { data, isLoading, isError, refetch } = useGetBrands()
  const [createOpen, setCreateOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [createName, setCreateName] = useState('')
  const [renameName, setRenameName] = useState('')
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)

  const brands = useMemo(() => data?.brands ?? [], [data?.brands])

  const invalidateBrands = () => {
    queryClient.invalidateQueries({ queryKey: [{ url: '/brands' }] })
    queryClient.invalidateQueries({ queryKey: [{ url: '/products' }] })
  }

  const createMutation = usePostBrands({
    mutation: {
      onSuccess: () => {
        toast.success('Marca criada com sucesso!')
        setCreateName('')
        setCreateOpen(false)
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
        setRenameOpen(false)
        setSelectedBrand(null)
        setRenameName('')
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
        setDeleteOpen(false)
        setSelectedBrand(null)
        invalidateBrands()
      },
      onError: () => {
        toast.error('Erro ao excluir marca.')
      },
    },
  })

  const handleCreate = () => {
    const name = createName.trim()
    if (!name) {
      toast.error('Informe o nome da marca.')
      return
    }

    createMutation.mutate({ data: { name } })
  }

  const handleRename = () => {
    const name = renameName.trim()
    if (!name) {
      toast.error('Informe o nome da marca.')
      return
    }

    if (!selectedBrand) {
      return
    }

    updateMutation.mutate({ id: selectedBrand.id, data: { name } })
  }

  const handleDelete = () => {
    if (!selectedBrand) {
      return
    }

    deleteMutation.mutate({ id: selectedBrand.id })
  }

  return (
    <BrandManager.Root>
      <BrandManager.Header onOpenCreate={() => setCreateOpen(true)} />

      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Building2 className="size-5" />
          <p className="text-sm">
            Gerencie e organize as marcas do catálogo de produtos.
          </p>
        </div>
      </div>

      <BrandManager.Table
        brands={brands}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        onAlterar={brand => {
          setSelectedBrand(brand)
          setRenameName(brand.name)
          setRenameOpen(true)
        }}
        onExcluir={brand => {
          setSelectedBrand(brand)
          setDeleteOpen(true)
        }}
      />

      <BrandManager.CreateDialog
        open={createOpen}
        value={createName}
        isPending={createMutation.isPending}
        onOpenChange={setCreateOpen}
        onChange={setCreateName}
        onSubmit={handleCreate}
      />

      <BrandManager.RenameDialog
        open={renameOpen}
        value={renameName}
        isPending={updateMutation.isPending}
        onOpenChange={setRenameOpen}
        onChange={setRenameName}
        onSubmit={handleRename}
      />

      <BrandManager.DeleteDialog
        open={deleteOpen}
        isPending={deleteMutation.isPending}
        brandName={selectedBrand?.name ?? ''}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
      />
    </BrandManager.Root>
  )
}
