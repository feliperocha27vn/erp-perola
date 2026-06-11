import { Skeleton } from '@/components/ui/skeleton'

export function ProductsStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }, (_, i) => `products-stat-skeleton-${i}`).map(
        id => (
          <div key={id} className="glass-card rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        )
      )}
    </div>
  )
}
