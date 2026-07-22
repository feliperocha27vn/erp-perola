import { Skeleton } from '@/components/ui/skeleton'

export function RecentSalesChartSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex gap-6">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-28" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
      </div>
      <Skeleton className="h-[320px] w-full rounded-xl" />
    </div>
  )
}
