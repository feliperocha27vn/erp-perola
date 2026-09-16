import {
	createRootRouteWithContext,
	Outlet,
	redirect,
	useRouterState,
} from '@tanstack/react-router'
import { Toaster } from 'sonner'
import { AppErrorPage } from './-components/app/app-error-page'
import { NotFoundPage } from './-components/app/not-found-page'
import { AppSidebar } from './-components/navigation/app-sidebar'
import { AppTopBar } from './-components/navigation/app-top-bar'
import { ALERT_TOASTER_ID } from './-components/notifications/alert-toast'
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
	const isLogin = pathname === '/login'

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

			{isLogin ? (
				<main className="px-4 pt-8 pb-8 md:px-8 lg:px-12 max-w-7xl mx-auto">
					<Outlet />
				</main>
			) : (
				<div className="lg:flex">
					<AppSidebar />
					<div className="min-w-0 flex-1">
						<AppTopBar />
						<main className="px-4 pt-6 pb-8 md:px-8 lg:px-12 lg:pt-2 max-w-7xl mx-auto">
							<Outlet />
						</main>
					</div>
				</div>
			)}
		</div>
	)
}
