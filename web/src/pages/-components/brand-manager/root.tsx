import type { ReactNode } from 'react'

type BrandManagerRootProps = {
  children: ReactNode
}

export function BrandManagerRoot({ children }: BrandManagerRootProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {children}
    </div>
  )
}
