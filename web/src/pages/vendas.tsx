import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import type { DateRange } from 'react-day-picker'
import { toast } from 'sonner'
import { useGetProducts } from '@/api/hooks/productsController/useGetProducts'
import { useDeleteSalesId } from '@/api/hooks/salesController/useDeleteSalesId'
import { useGetSales } from '@/api/hooks/salesController/useGetSales'
import { usePatchSalesId } from '@/api/hooks/salesController/usePatchSalesId'
import { usePostSales } from '@/api/hooks/salesController/usePostSales'
import { queryClient } from '@/lib/react-query'
import {
  type ProductItem,
  type SaleFormValues,
  type SaleItem,
  SalesManager,
} from './-components/sales-manager'
import {
  formatCentsToInput,
  getPrefilledSalePriceInput,
  parseCurrencyToCents,
  toDateOnly,
  toIsoRangeEnd,
  toIsoRangeStart,
} from './-components/sales-manager/formatters'

export const Route = createFileRoute('/vendas')({
  component: VendasPage,
})

function emptyForm(): SaleFormValues {
  return {
    product_id: '',
    stock_id: '',
    store_id: '',
    channel: 'Mercado Livre',
    quantity: '1',
    sale_price: '0',
    sale_date: new Date().toISOString().slice(0, 10),
  }
}

function VendasPage() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  })
  const [brandId, setBrandId] = useState<string | undefined>(undefined)
  const [storeId, setStoreId] = useState<string | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState(1)
  const [limit] = useState(10)
  const [selectedSale, setSelectedSale] = useState<SaleItem | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const [createForm, setCreateForm] = useState<SaleFormValues>(emptyForm())
  const [editForm, setEditForm] = useState<SaleFormValues>(emptyForm())
  const [productSearchQuery, setProductSearchQuery] = useState('')
  const [debouncedProductSearchQuery, setDebouncedProductSearchQuery] =
    useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedProductSearchQuery(productSearchQuery.trim())
    }, 400)

    return () => clearTimeout(timer)
  }, [productSearchQuery])

  const salesQueryParams = {
    startDate: toIsoRangeStart(date?.from),
    endDate: toIsoRangeEnd(date?.to),
    brandId,
    storeId,
    page: currentPage,
    limit,
  }

  const { data: productsData, isLoading: isProductsLoading } = useGetProducts({
    pageIndex: '0',
    search: debouncedProductSearchQuery || undefined,
  })
  const {
    data: salesData,
    isLoading: isSalesLoading,
    isError: isSalesError,
    refetch: refetchSales,
  } = useGetSales(salesQueryParams)

  const products = useMemo(
    () => productsData?.items ?? [],
    [productsData?.items]
  )
  const sales = useMemo(() => salesData?.items ?? [], [salesData?.items])
  const brandCounts = useMemo(
    () => salesData?.brandCounts ?? [],
    [salesData?.brandCounts]
  )
  const totalPages = salesData?.totalPages ?? 1

  const selectedCreateProduct = products.find(
    product => product.id === createForm.product_id
  )
  const selectedCreateProductStocks = selectedCreateProduct?.stocks ?? []

  const selectedEditProduct = products.find(
    product => product.id === editForm.product_id
  )
  const selectedEditProductStocks = selectedEditProduct?.stocks ?? []

  const invalidateSales = () => {
    queryClient.invalidateQueries({ queryKey: [{ url: '/sales' }] })
    queryClient.invalidateQueries({ queryKey: [{ url: '/products' }] })
    queryClient.invalidateQueries({
      queryKey: [{ url: '/dashboard/monthly-sales' }],
    })
    if (selectedCreateProduct?.id) {
      queryClient.invalidateQueries({
        queryKey: [
          {
            url: '/products/:productId/stocks',
            params: { productId: selectedCreateProduct.id },
          },
        ],
      })
    }
  }

  const createMutation = usePostSales({
    mutation: {
      onSuccess: () => {
        toast.success('Venda criada com sucesso!')
        setCreateOpen(false)
        setCreateForm(emptyForm())
        setProductSearchQuery('')
        invalidateSales()
      },
      onError: error => {
        toast.error(error.response?.data?.error || 'Erro ao criar venda.')
      },
    },
  })

  const updateMutation = usePatchSalesId({
    mutation: {
      onSuccess: () => {
        toast.success('Venda atualizada com sucesso!')
        setEditOpen(false)
        setSelectedSale(null)
        setEditForm(emptyForm())
        setProductSearchQuery('')
        invalidateSales()
      },
      onError: error => {
        toast.error(error.response?.data?.error || 'Erro ao atualizar venda.')
      },
    },
  })

  const deleteMutation = useDeleteSalesId({
    mutation: {
      onSuccess: () => {
        toast.success('Venda excluída com sucesso!')
        setDeleteOpen(false)
        setSelectedSale(null)
        invalidateSales()
      },
      onError: error => {
        toast.error(error.response?.data?.error || 'Erro ao excluir venda.')
      },
    },
  })

  const handleCreate = () => {
    const quantity = Number(createForm.quantity)
    const salePrice = parseCurrencyToCents(createForm.sale_price)

    if (!createForm.product_id || !createForm.stock_id) {
      toast.error('Selecione produto e estoque.')
      return
    }

    if (!createForm.store_id) {
      toast.error('Selecione a loja.')
      return
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      toast.error('Quantidade inválida.')
      return
    }

    if (!Number.isInteger(salePrice) || salePrice < 0) {
      toast.error('Valor inválido.')
      return
    }

    if (!createForm.sale_date) {
      toast.error('Informe a data da venda.')
      return
    }

    const saleDate = toDateOnly(createForm.sale_date)

    if (!saleDate) {
      toast.error('Data inválida.')
      return
    }

    createMutation.mutate({
      data: {
        product_id: createForm.product_id,
        stock_id: createForm.stock_id,
        store_id: createForm.store_id || null,
        channel: createForm.channel,
        quantity,
        sale_price: salePrice,
        sale_date: saleDate as unknown as any,
      },
    })
  }

  const handleUpdate = () => {
    if (!selectedSale) {
      return
    }

    const quantity = Number(editForm.quantity)
    const salePrice = parseCurrencyToCents(editForm.sale_price)

    if (!Number.isInteger(quantity) || quantity <= 0) {
      toast.error('Quantidade inválida.')
      return
    }

    if (!Number.isInteger(salePrice) || salePrice < 0) {
      toast.error('Valor inválido.')
      return
    }

    if (!editForm.sale_date) {
      toast.error('Informe a data da venda.')
      return
    }

    const saleDate = toDateOnly(editForm.sale_date)

    if (!saleDate) {
      toast.error('Data inválida.')
      return
    }

    updateMutation.mutate({
      id: selectedSale.id,
      data: {
        quantity,
        sale_price: salePrice,
        channel: editForm.channel,
        sale_date: saleDate as unknown as any,
        store_id: editForm.store_id || null,
      },
    })
  }

  const handleDelete = () => {
    if (!selectedSale) {
      return
    }

    deleteMutation.mutate({ id: selectedSale.id })
  }

  const handleCreateProductSelect = (productId: string) => {
    const selectedProduct = products.find(product => product.id === productId)

    setCreateForm(prev => ({
      ...prev,
      product_id: productId,
      stock_id: '',
      sale_price: getPrefilledSalePriceInput(
        selectedProduct?.sale_price_cents,
        prev.sale_price
      ),
    }))
  }

  const handleEditProductSelect = (productId: string) => {
    setEditForm(prev => ({
      ...prev,
      product_id: productId,
      stock_id: '',
    }))
  }

  const openEdit = (sale: SaleItem) => {
    setSelectedSale(sale)
    setEditForm({
      product_id: sale.product_id,
      stock_id: sale.stock_id,
      store_id: sale.store_id ?? '',
      channel: sale.channel === 'Direto' ? 'Mercado Livre' : sale.channel,
      quantity: String(sale.quantity),
      sale_price: formatCentsToInput(sale.sale_price),
      sale_date: sale.sale_date.slice(0, 10),
    })
    setEditOpen(true)
  }

  return (
    <SalesManager.Root>
      <SalesManager.Header onOpenCreate={() => setCreateOpen(true)} />

      <SalesManager.Filters
        date={date}
        brandId={brandId}
        storeId={storeId}
        onDateChange={value => {
          setDate(value)
          setCurrentPage(1)
        }}
        onBrandChange={value => {
          setBrandId(value)
          setCurrentPage(1)
        }}
        onStoreChange={value => {
          setStoreId(value)
          setCurrentPage(1)
        }}
        onClear={() => {
          setDate(undefined)
          setBrandId(undefined)
          setStoreId(undefined)
          setCurrentPage(1)
        }}
      />

      <SalesManager.BrandBreakdown
        items={brandCounts}
        isLoading={isSalesLoading}
        selectedBrandId={brandId}
        onSelectBrand={value => {
          setBrandId(value)
          setCurrentPage(1)
        }}
      />

      <SalesManager.Table
        sales={sales}
        isLoading={isSalesLoading}
        isError={isSalesError}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onView={sale => {
          setSelectedSale(sale)
          setViewOpen(true)
        }}
        onEdit={openEdit}
        onDelete={sale => {
          setSelectedSale(sale)
          setDeleteOpen(true)
        }}
        onRetry={() => refetchSales()}
      />

      <SalesManager.SaleFormDialog
        open={createOpen}
        title="Criar venda"
        submitLabel="Criar venda"
        values={createForm}
        products={products as ProductItem[]}
        selectedProductStocks={selectedCreateProductStocks}
        productSearchQuery={productSearchQuery}
        isProductsLoading={isProductsLoading}
        isPending={createMutation.isPending}
        onOpenChange={open => {
          setCreateOpen(open)
          if (!open) {
            setProductSearchQuery('')
          }
        }}
        onProductSearchChange={setProductSearchQuery}
        onProductSelect={handleCreateProductSelect}
        onValuesChange={next => setCreateForm(prev => ({ ...prev, ...next }))}
        onSubmit={handleCreate}
      />

      <SalesManager.SaleFormDialog
        open={editOpen}
        title="Editar venda"
        submitLabel="Salvar alterações"
        values={editForm}
        products={products as ProductItem[]}
        selectedProductStocks={selectedEditProductStocks}
        productSearchQuery={productSearchQuery}
        isProductsLoading={isProductsLoading}
        isPending={updateMutation.isPending}
        onOpenChange={open => {
          setEditOpen(open)
          if (!open) {
            setProductSearchQuery('')
          }
        }}
        onProductSearchChange={setProductSearchQuery}
        onProductSelect={handleEditProductSelect}
        onValuesChange={next => setEditForm(prev => ({ ...prev, ...next }))}
        onSubmit={handleUpdate}
      />

      <SalesManager.ViewDialog
        open={viewOpen}
        sale={selectedSale}
        onOpenChange={setViewOpen}
      />

      <SalesManager.DeleteDialog
        open={deleteOpen}
        sale={selectedSale}
        isPending={deleteMutation.isPending}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
      />
    </SalesManager.Root>
  )
}
