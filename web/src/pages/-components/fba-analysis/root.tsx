import type { ReactNode } from 'react'

type FbaAnalysisRootProps = {
  children: ReactNode
}

export function FbaAnalysisRoot({ children }: FbaAnalysisRootProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {children}
    </div>
  )
}
