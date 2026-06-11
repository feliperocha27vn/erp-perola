import { Skeleton } from '@/components/ui/skeleton'

export function BrandManagerTableSkeleton() {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 px-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-24 justify-self-end" />
      </div>
      {Array.from({ length: 6 }, (_, i) => `brand-row-skeleton-${i}`).map(
        id => (
          <Skeleton key={id} className="h-12 w-full rounded-lg" />
        )
      )}
    </div>
  )
}
