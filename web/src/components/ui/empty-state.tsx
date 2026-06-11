import type { LucideIcon } from 'lucide-react'

type EmptyStateProps = {
  title: string
  description?: string
  icon?: LucideIcon
  className?: string
}

export function EmptyState({
  title,
  description,
  icon: Icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={[
        'rounded-2xl border border-border bg-card p-8 text-center',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {Icon ? (
        <div className="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="size-5" />
        </div>
      ) : null}
      <h3 className="text-lg font-display font-semibold text-foreground">
        {title}
      </h3>
      {description ? (
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  )
}
