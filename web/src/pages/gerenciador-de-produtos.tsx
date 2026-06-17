import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { Package, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { useGetBrands } from '@/api/hooks/brandsController/useGetBrands'
import { useDeleteProduct } from '@/api/hooks/productsController/useDeleteProduct'
import { useGetProducts } from '@/api/hooks/productsController/useGetProducts'
import { usePostProducts } from '@/api/hooks/productsController/usePostProducts'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { SectionErrorState } from '@/components/ui/section-error-state'
import { queryClient } from '@/lib/react-query'
import { BrandManagerModal } from './-components/gerenciador-de-produtos/brand-manager-modal'
import { ProductsPageHeader } from './-components/gerenciador-de-produtos/page-header'
import { ProductsControls } from './-components/gerenciador-de-produtos/products-controls'
import { ProductsGrid } from './-components/gerenciador-de-produtos/products-grid'
import { ProductsPagination } from './-components/gerenciador-de-produtos/products-pagination'
import { ProductsStats } from './-components/gerenciador-de-produtos/products-stats'
import { ProductsStatsSkeleton } from './-components/gerenciador-de-produtos/products-stats-skeleton'
import { ProductEditModal } from './-components/gerenciador-de-produtos/product-edit-modal'
import type { ProductItem } from './-components/gerenciador-de-produtos/types'
import { CreateProductDialog } from './-components/product-manager/create-product-dialog'

const uploadImagensSearchSchema = z.object({
  page: z.number().int().min(0).catch(0),
  filter: z.enum(['all', 'without']).catch('all'),
  search: z.string().optional(),
  brand: z.string().uuid().optional(),
})

type UploadImagensSearch = z.infer<typeof uploadImagensSearchSchema>

type CreateProductFormValues = {
  sku: string
  ean: string
  brand_id: string
  url_site: string
}

function emptyCreateProductForm(): CreateProductFormValues {
  return { sku: '', ean: '', brand_id: '', url_site: '' }
}

export const Route = createFileRoute('/gerenciador-de-produtos')({
  component: GerenciadorDeProdutos,
  validateSearch: uploadImagensSearchSchema,
})

function GerenciadorDeProdutos() {
  const navigate = useNavigate({ from: Route.fullPath })
  const {
    page,
    filter,
    search: searchQuery,
    brand: brandQuery,
  } = useSearch({ from: Route.fullPath })

  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false)
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<ProductItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ProductItem | null>(null)
  const [createProductForm, setCreateProductForm] =
    useState<CreateProductFormValues>(emptyCreateProductForm())
  const [localSearch, setLocalSearch] = useState(searchQuery || '')

  useEffect(() => {
    setLocalSearch(searchQuery || '')
  }, [searchQuery])

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmedSearch = localSearch.trim()
      if (trimmedSearch !== (searchQuery || '')) {
        navigate({
          search: prev => ({
            ...prev,
            search: trimmedSearch || undefined,
            page: 0,
          }),
        })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [localSearch, searchQuery, navigate])

  const normalizedSearch = searchQuery?.trim() || undefined

  const { data, isLoading, error } = useGetProducts({
    pageIndex: String(page),
    search: normalizedSearch,
    withoutImage: filter === 'without' ? 'true' : undefined,
    brandId: brandQuery,
  })

  const { data: brandsData, isLoading: isBrandsLoading } = useGetBrands()
  const brands = brandsData?.brands ?? []

  const createProductMutation = usePostProducts({
    mutation: {
      onSuccess: () => {
        toast.success('Produto criado com sucesso!')
        setIsCreateProductOpen(false)
        setCreateProductForm(emptyCreateProductForm())
        queryClient.invalidateQueries({ queryKey: [{ url: '/products' }] })
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.error || 'Erro ao criar produto.')
      },
    },
  })

  const deleteProductMutation = useDeleteProduct({
    mutation: {
      onSuccess: () => {
        toast.success('Produto excluído com sucesso!')
        setDeleteTarget(null)
        queryClient.invalidateQueries({ queryKey: [{ url: '/products' }] })
      },
      onError: () => {
        toast.error('Erro ao excluir produto. Tente novamente.')
      },
    },
  })

  const updateSearchParams = (updates: Partial<UploadImagensSearch>) => {
    navigate({ search: prev => ({ ...prev, ...updates }) })
  }

  const applySearchNow = (value?: string) => {
    updateSearchParams({ search: value?.trim() || undefined, page: 0 })
  }

  const handleCreateProduct = () => {
    const sku = createProductForm.sku.trim()
    const ean = createProductForm.ean.trim()
    const brandId = createProductForm.brand_id.trim()
    const urlSite = createProductForm.url_site.trim()

    if (!sku) { toast.error('Informe o SKU.'); return }
    if (!ean) { toast.error('Informe o EAN.'); return }
    if (!brandId) { toast.error('Selecione a marca.'); return }

    createProductMutation.mutate({
      data: { sku, ean, brand_id: brandId, url_image: urlSite || undefined },
    })
  }

  const items = Array.isArray(data?.items) ? data.items : []
  const productsWithoutImage = items.filter(p => !p.url_image).length
  const totalPages = Math.ceil((data?.total || 0) / 20)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <ProductsPageHeader onOpenBrands={() => setIsBrandModalOpen(true)} />

      {isLoading ? (
        <ProductsStatsSkeleton />
      ) : (
        <ProductsStats
          total={data?.total || 0}
          withoutImage={productsWithoutImage}
          page={page}
          totalPages={totalPages}
          filteredCount={items.length}
        />
      )}

      <ProductsControls
        searchQuery={localSearch}
        filter={filter}
        productsWithoutImage={productsWithoutImage}
        totalProducts={data?.total || 0}
        brands={brands}
        isBrandsLoading={isBrandsLoading}
        onSearchChange={value => setLocalSearch(value || '')}
        onSearchEnter={value => applySearchNow(value)}
        onFilterChange={nextFilter =>
          updateSearchParams({ filter: nextFilter, page: 0 })
        }
        brandFilter={brandQuery ?? 'ALL'}
        onBrandChange={value =>
          updateSearchParams({
            brand: value === 'ALL' ? undefined : value,
            page: 0,
          })
        }
      />

      <div className="flex justify-end mb-6">
        <Button
          type="button"
          onClick={() => setIsCreateProductOpen(true)}
          className="rounded-xl"
        >
          <Plus className="size-4 mr-2" />
          Criar Produto
        </Button>
      </div>

      <ProductsGrid
        products={items}
        isLoading={isLoading}
        onEdit={product => setEditTarget(product)}
        onDelete={product => setDeleteTarget(product)}
      />

      <ProductsPagination
        page={page}
        totalPages={totalPages}
        onPrev={() => updateSearchParams({ page: Math.max(0, page - 1) })}
        onNext={() => updateSearchParams({ page: page + 1 })}
      />

      {error ? (
        <SectionErrorState
          title="Erro ao carregar produtos"
          description="Verifique sua conexao e tente novamente."
          onRetry={() =>
            queryClient.refetchQueries({ queryKey: [{ url: '/products' }] })
          }
        />
      ) : null}

      {!isLoading && !error && items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Nenhum produto encontrado"
          description={
            filter === 'without'
              ? 'Todos os produtos ja possuem imagens.'
              : 'Nao ha produtos cadastrados.'
          }
        />
      ) : null}

      <ProductEditModal
        open={!!editTarget}
        product={editTarget}
        brands={brands}
        onClose={() => setEditTarget(null)}
      />

      <Dialog
        open={!!deleteTarget}
        onOpenChange={open => { if (!open) setDeleteTarget(null) }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir produto</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o produto{' '}
              <strong>{deleteTarget?.sku}</strong>? Esta ação não pode ser
              desfeita. Os estoques associados também serão removidos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteProductMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteTarget) {
                  deleteProductMutation.mutate({ id: deleteTarget.id })
                }
              }}
              disabled={deleteProductMutation.isPending}
            >
              {deleteProductMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BrandManagerModal
        open={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
      />

      <CreateProductDialog
        open={isCreateProductOpen}
        onOpenChange={open => {
          setIsCreateProductOpen(open)
          if (!open) setCreateProductForm(emptyCreateProductForm())
        }}
        values={createProductForm}
        brands={brands.map(brand => ({ id: brand.id, name: brand.name }))}
        isBrandsLoading={isBrandsLoading}
        isPending={createProductMutation.isPending}
        onValuesChange={next =>
          setCreateProductForm(prev => ({ ...prev, ...next }))
        }
        onSubmit={handleCreateProduct}
      />
    </div>
  )
}
