import {
	createRootRouteWithContext,
	Outlet,
	redirect,
	useRouterState,
} from '@tanstack/react-router'
import { Toaster } from 'sonner'
import { cn } from '@/lib/utils'
import { AppErrorPage } from './-components/app/app-error-page'
import { NotFoundPage } from './-components/app/not-found-page'
import { ALERT_TOASTER_ID } from './-components/notifications/alert-toast'
import { NotificationBell } from './-components/notifications/notification-bell'
import type { QueryClient } from '@tanstack/react-query'

interface RouterContext {
	isAuthenticated: boolean
	queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
	beforeLoad: async ({ location }) => {
		if (location.pathname === '/login') return

		try {
			const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')
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
	component: RootLayout,
})

function RootLayout() {
	const pathname = useRouterState({ select: state => state.location.pathname })
	const showBell = pathname !== '/login'

	return (
		<div className="min-h-screen selection:bg-primary/30">
			{/* Confirmações do dia a dia: no topo, abaixo do sininho para não cobri-lo. */}
			<Toaster
				position="top-right"
				expand={false}
				richColors
				offset={{ top: 80, right: 24 }}
				mobileOffset={{ top: 72 }}
			/>
			{/* Alertas: embaixo, separados das confirmações. */}
			<Toaster id={ALERT_TOASTER_ID} position="bottom-right" visibleToasts={4} />

			{showBell && (
				// Fica no fluxo para não cobrir o cabeçalho das páginas, e gruda no topo
				// ao rolar. Só o botão recebe clique; a faixa transparente deixa passar.
				<div className="pointer-events-none sticky top-0 z-40 mx-auto flex max-w-7xl justify-end px-4 pt-4 md:px-8 lg:px-12">
					<NotificationBell className="pointer-events-auto" />
				</div>
			)}

			<main
				className={cn(
					'px-4 pb-8 md:px-8 lg:px-12 max-w-7xl mx-auto',
					showBell ? 'pt-2' : 'pt-8',
				)}
			>
				<Outlet />
			</main>
		</div>
	)
}
