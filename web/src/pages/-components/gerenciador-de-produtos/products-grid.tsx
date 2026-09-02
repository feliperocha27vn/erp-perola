import { ProductCard } from './product-card'
import { ProductCardSkeleton } from './product-card-skeleton'
import type { ProductItem } from './types'

type ProductsGridProps = {
  products: ProductItem[]
  isLoading?: boolean
  onEdit: (product: ProductItem) => void
  onDelete: (product: ProductItem) => void
}

export function ProductsGrid({
  products,
  isLoading = false,
  onEdit,
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
      {products.map(product => (
        <ProductCard.Root key={product.id}>
          <ProductCard.Header
            product={product}
            onEdit={onEdit}
            onDelete={onDelete}
          />
          <ProductCard.Image imageUrl={product.url_image} alt={product.sku} />
          <ProductCard.SalesDashboard
            productId={product.id}
            productSku={product.sku}
            stocks={product.stocks}
          />
        </ProductCard.Root>
      ))}
    </div>
  )
}
