import { Skeleton } from '@/components/ui/skeleton'

export function SalesManagerTableSkeleton() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-6 gap-2 px-2">
        {Array.from({ length: 6 }, (_, i) => `sales-head-skeleton-${i}`).map(
          id => (
            <Skeleton key={id} className="h-4 w-full" />
          )
        )}
      </div>

      <div className="space-y-2">
        {Array.from({ length: 8 }, (_, i) => `sales-row-skeleton-${i}`).map(
          id => (
            <Skeleton key={id} className="h-11 w-full rounded-lg" />
          )
        )}
      </div>
    </div>
  )
}
