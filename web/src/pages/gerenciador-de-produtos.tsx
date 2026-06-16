import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { Package, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { useGetBrands } from '@/api/hooks/brandsController/useGetBrands'
import { useGetProducts } from '@/api/hooks/productsController/useGetProducts'
import { usePatchProductsId } from '@/api/hooks/productsController/usePatchProductsId'
import { usePatchProductsIdImage } from '@/api/hooks/productsController/usePatchProductsIdImage'
import { usePostProducts } from '@/api/hooks/productsController/usePostProducts'
import type { PatchProductsIdImageMutationResponse } from '@/api/types/productsController/PatchProductsIdImage'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { SectionErrorState } from '@/components/ui/section-error-state'
import { queryClient } from '@/lib/react-query'
import { BrandManagerModal } from './-components/gerenciador-de-produtos/brand-manager-modal'
import { ProductsPageHeader } from './-components/gerenciador-de-produtos/page-header'
import {
  ProductDetailsModal,
  type ProductTechnicalDetailsForm,
} from './-components/gerenciador-de-produtos/product-details-modal'
import {
  type ProductIdentityForm,
  ProductIdentityModal,
} from './-components/gerenciador-de-produtos/product-identity-modal'
import {
  type ProductSalePriceForm,
  ProductSalePriceModal,
} from './-components/gerenciador-de-produtos/product-sale-price-modal'
import { ProductsControls } from './-components/gerenciador-de-produtos/products-controls'
import { ProductsGrid } from './-components/gerenciador-de-produtos/products-grid'
import { ProductsPagination } from './-components/gerenciador-de-produtos/products-pagination'
import { ProductsStats } from './-components/gerenciador-de-produtos/products-stats'
import { ProductsStatsSkeleton } from './-components/gerenciador-de-produtos/products-stats-skeleton'
import { StockManagerModal } from './-components/gerenciador-de-produtos/stock-manager-modal'
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
  return {
    sku: '',
    ean: '',
    brand_id: '',
    url_site: '',
  }
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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false)
  const [isStockModalOpen, setIsStockModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false)
  const [isSalePriceModalOpen, setIsSalePriceModalOpen] = useState(false)
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false)
  const [stockTarget, setStockTarget] = useState<ProductItem | null>(null)
  const [detailsTarget, setDetailsTarget] = useState<ProductItem | null>(null)
  const [identityTarget, setIdentityTarget] = useState<ProductItem | null>(null)
  const [salePriceTarget, setSalePriceTarget] = useState<ProductItem | null>(
    null
  )
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

  const updateProductsImageCache = (
    updatedProduct: PatchProductsIdImageMutationResponse['product']
  ) => {
    queryClient.setQueriesData({ queryKey: [{ url: '/products' }] }, old => {
      if (!old || typeof old !== 'object' || !('items' in old)) {
        return old
      }

      const current = old as {
        items: Array<{ id: string; url_image: string | null }>
      }

      return {
        ...current,
        items: current.items.map(item =>
          item.id === updatedProduct.id
            ? { ...item, url_image: updatedProduct.url_image }
            : item
        ),
      }
    })
  }

  const updateImageMutation = usePatchProductsIdImage({
    mutation: {
      onSuccess: (data: PatchProductsIdImageMutationResponse) => {
        updateProductsImageCache(data.product)
        queryClient.invalidateQueries({
          queryKey: [{ url: '/products' }],
        })
        queryClient.refetchQueries({
          queryKey: [{ url: '/products' }],
          type: 'active',
        })
        setEditingId(null)
        setImageUrl('')
        toast.success('Imagem atualizada com sucesso!')
      },
      onError: (error: unknown) => {
        console.error('Erro ao salvar imagem:', error)
        toast.error('Erro ao salvar imagem. Tente novamente.')
        setEditingId(null)
      },
    },
  })

  const normalizedSearch = searchQuery?.trim() || undefined

  const { data, isLoading, error } = useGetProducts({
    pageIndex: String(page),
    search: normalizedSearch,
    withoutImage: filter === 'without' ? 'true' : undefined,
    brandId: brandQuery,
  })

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

  const { data: brandsData, isLoading: isBrandsLoading } = useGetBrands()

  const updateProductMutation = usePatchProductsId({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [{ url: '/products' }] })
      },
    },
  })

  const updateSearchParams = (updates: Partial<UploadImagensSearch>) => {
    navigate({
      search: prev => ({ ...prev, ...updates }),
    })
  }

  const applySearchNow = (value?: string) => {
    const trimmedSearch = value?.trim() || undefined
    updateSearchParams({ search: trimmedSearch, page: 0 })
  }

  const handleCreateProduct = () => {
    const sku = createProductForm.sku.trim()
    const ean = createProductForm.ean.trim()
    const brandId = createProductForm.brand_id.trim()
    const urlSite = createProductForm.url_site.trim()

    if (!sku) {
      toast.error('Informe o SKU.')
      return
    }

    if (!ean) {
      toast.error('Informe o EAN.')
      return
    }

    if (!brandId) {
      toast.error('Selecione a marca.')
      return
    }

    createProductMutation.mutate({
      data: {
        sku,
        ean,
        brand_id: brandId,
        url_image: urlSite || undefined,
      },
    })
  }

  const handleSaveImage = async (productId: string) => {
    if (!imageUrl.trim()) {
      toast.error('Por favor, insira uma URL válida')
      return
    }

    if (!editingId || editingId !== productId) {
      toast.error('Produto em edicao invalido. Tente novamente.')
      return
    }

    try {
      await updateImageMutation.mutateAsync({
        id: productId,
        data: { url_image: imageUrl },
      })
    } catch {}
  }

  const handleSaveDetails = async (details: ProductTechnicalDetailsForm) => {
    if (!detailsTarget) {
      return
    }

    try {
      await updateProductMutation.mutateAsync({
        id: detailsTarget.id,
        data: {
          technical_title: details.technical_title,
          technical_subtitle: details.technical_subtitle,
          technical_analysis: details.technical_analysis,
          technical_movement: details.technical_movement,
          technical_case_and_crystal: details.technical_case_and_crystal,
          technical_specific_functionality:
            details.technical_specific_functionality,
          technical_dial_and_luminosity: details.technical_dial_and_luminosity,
          technical_bracelet_construction:
            details.technical_bracelet_construction,
          technical_table: details.technical_table,
        },
      })

      toast.success('Detalhes técnicos salvos com sucesso!')
    } catch {
      toast.error('Erro ao salvar detalhes técnicos.')
    }
  }

  const handleSaveIdentity = async (identity: ProductIdentityForm) => {
    if (!identityTarget) {
      return
    }

    const sku = identity.sku.trim()
    const ean = identity.ean.trim()

    if (!sku) {
      toast.error('Informe o SKU.')
      return
    }

    if (!ean) {
      toast.error('Informe o EAN.')
      return
    }

    try {
      await updateProductMutation.mutateAsync({
        id: identityTarget.id,
        data: {
          sku,
          ean,
        },
      })

      toast.success('SKU e EAN atualizados com sucesso!')
      setIsIdentityModalOpen(false)
      setIdentityTarget(null)
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error || 'Erro ao atualizar SKU e EAN.'
      )
    }
  }

  const handleSaveSalePrice = async (payload: ProductSalePriceForm) => {
    if (!salePriceTarget) {
      return
    }

    if (
      !Number.isInteger(payload.sale_price_cents) ||
      payload.sale_price_cents <= 0
    ) {
      toast.error('Informe um preço de venda válido.')
      return
    }

    try {
      await updateProductMutation.mutateAsync({
        id: salePriceTarget.id,
        data: {
          sale_price_cents: payload.sale_price_cents,
        },
      })

      toast.success('Preço de venda atualizado com sucesso!')
      setIsSalePriceModalOpen(false)
      setSalePriceTarget(null)
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error || 'Erro ao atualizar preço de venda.'
      )
    }
  }

  const startEditing = (productId: string, currentUrl: string | null) => {
    setEditingId(productId)
    setImageUrl(currentUrl || '')
  }

  const cancelEditing = () => {
    setEditingId(null)
    setImageUrl('')
  }

  const items = Array.isArray(data?.items) ? data.items : []
  const brands = brandsData?.brands ?? []

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
        editingId={editingId}
        imageUrl={imageUrl}
        isSaving={updateImageMutation.isPending}
        onStartEditing={startEditing}
        onCancelEditing={cancelEditing}
        onSaveImage={handleSaveImage}
        onImageUrlChange={setImageUrl}
        onOpenStock={product => {
          setStockTarget(product)
          setIsStockModalOpen(true)
        }}
        onOpenDetails={product => {
          setDetailsTarget(product)
          setIsDetailsModalOpen(true)
        }}
        onOpenIdentityEdit={product => {
          setIdentityTarget(product)
          setIsIdentityModalOpen(true)
        }}
        onOpenSalePrice={product => {
          setSalePriceTarget(product)
          setIsSalePriceModalOpen(true)
        }}
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

      <StockManagerModal
        open={isStockModalOpen}
        product={stockTarget}
        onClose={() => setIsStockModalOpen(false)}
      />

      <ProductDetailsModal
        open={isDetailsModalOpen}
        product={detailsTarget}
        isSaving={updateProductMutation.isPending}
        onSave={handleSaveDetails}
        onClose={() => {
          setIsDetailsModalOpen(false)
          setDetailsTarget(null)
        }}
      />

      <ProductIdentityModal
        open={isIdentityModalOpen}
        product={identityTarget}
        isSaving={updateProductMutation.isPending}
        onSave={handleSaveIdentity}
        onClose={() => {
          setIsIdentityModalOpen(false)
          setIdentityTarget(null)
        }}
      />

      <ProductSalePriceModal
        open={isSalePriceModalOpen}
        product={salePriceTarget}
        isSaving={updateProductMutation.isPending}
        onSave={handleSaveSalePrice}
        onClose={() => {
          setIsSalePriceModalOpen(false)
          setSalePriceTarget(null)
        }}
      />

      <BrandManagerModal
        open={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
      />

      <CreateProductDialog
        open={isCreateProductOpen}
        onOpenChange={open => {
          setIsCreateProductOpen(open)
          if (!open) {
            setCreateProductForm(emptyCreateProductForm())
          }
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
