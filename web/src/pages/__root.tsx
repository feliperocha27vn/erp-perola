import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Toaster } from 'sonner'
import { AppErrorPage } from './-components/app/app-error-page'
import { NotFoundPage } from './-components/app/not-found-page'

export const Route = createRootRoute({
  errorComponent: ({ error }) => (
    <AppErrorPage
      message={
        error instanceof Error ? error.message : 'Erro inesperado da aplicacao.'
      }
    />
  ),
  notFoundComponent: NotFoundPage,
  component: () => (
    <div className="min-h-screen selection:bg-primary/30">
      <Toaster position="top-right" expand={false} richColors />
      <main className="px-4 py-8 md:px-8 lg:px-12 max-w-7xl mx-auto">
        <Outlet />
      </main>
    </div>
  ),
})
