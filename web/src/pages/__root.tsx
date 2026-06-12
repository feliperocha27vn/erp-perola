import { createRootRouteWithContext, Outlet, redirect } from '@tanstack/react-router'
import { Toaster } from 'sonner'
import { AppErrorPage } from './-components/app/app-error-page'
import { NotFoundPage } from './-components/app/not-found-page'
import type { QueryClient } from '@tanstack/react-query'

interface RouterContext {
	isAuthenticated: boolean
	queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
	beforeLoad: async ({ location }) => {
		if (location.pathname === '/login') return

		try {
			const apiBase = import.meta.env.VITE_API_URL || ''
			const res = await fetch(`${apiBase}/api/auth/get-session`, {
				credentials: 'include',
			})
			if (!res.ok) {
				throw redirect({ to: '/login' })
			}
			const data = await res.json()
			if (!data?.session) {
				throw redirect({ to: '/login' })
			}
		} catch (err) {
			if (err && typeof err === 'object' && 'to' in err) throw err
			throw redirect({ to: '/login' })
		}
	},
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