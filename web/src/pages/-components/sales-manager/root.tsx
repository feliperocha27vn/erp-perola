import type { ReactNode } from 'react'

type SalesManagerRootProps = {
  children: ReactNode
}

export function SalesManagerRoot({ children }: SalesManagerRootProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {children}
    </div>
  )
}
