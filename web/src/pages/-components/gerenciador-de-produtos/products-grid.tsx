import { ProductCard } from './product-card'
import { ProductCardSkeleton } from './product-card-skeleton'
import type { ProductItem } from './types'

type ProductsGridProps = {
  products: ProductItem[]
  isLoading?: boolean
  editingId: string | null
  imageUrl: string
  isSaving: boolean
  onStartEditing: (productId: string, currentUrl: string | null) => void
  onCancelEditing: () => void
  onSaveImage: (productId: string) => void
  onImageUrlChange: (value: string) => void
  onOpenStock: (product: ProductItem) => void
  onOpenDetails: (product: ProductItem) => void
  onOpenIdentityEdit: (product: ProductItem) => void
  onOpenSalePrice: (product: ProductItem) => void
  onDelete: (product: ProductItem) => void
}

export function ProductsGrid({
  products,
  isLoading = false,
  editingId,
  imageUrl,
  isSaving,
  onStartEditing,
  onCancelEditing,
  onSaveImage,
  onImageUrlChange,
  onOpenStock,
  onOpenDetails,
  onOpenIdentityEdit,
  onOpenSalePrice,
  onDelete,
}: ProductsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from(
          { length: 6 },
          (_, i) => `product-card-grid-skeleton-${i}`
        ).map(id => (
          <ProductCardSkeleton key={id} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map(product => {
        const isEditing = editingId === product.id

        return (
          <ProductCard.Root key={product.id}>
            <ProductCard.Header
              product={product}
              onStartEditing={onStartEditing}
              onOpenStock={onOpenStock}
              onOpenDetails={onOpenDetails}
              onOpenIdentityEdit={onOpenIdentityEdit}
              onOpenSalePrice={onOpenSalePrice}
              onDelete={onDelete}
            />
            <ProductCard.Image imageUrl={product.url_image} alt={product.sku} />

            {isEditing ? (
              <ProductCard.EditForm
                imageUrl={imageUrl}
                isSaving={isSaving}
                onImageUrlChange={onImageUrlChange}
                onSave={() => onSaveImage(product.id)}
                onCancel={onCancelEditing}
              />
            ) : null}

            <ProductCard.SalesDashboard
              productId={product.id}
              productSku={product.sku}
            />
          </ProductCard.Root>
        )
      })}
    </div>
  )
}
