import { createRouter, RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider, queryClient } from './lib/react-query'
import './index.css'

import { routeTree } from './routeTree.gen'

const router = createRouter({
	routeTree,
	defaultPreload: 'intent',
	context: {
		isAuthenticated: false,
		queryClient,
	},
})

declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router
	}
}

const rootElement = document.getElementById('root')

if (!rootElement) {
	throw new Error('Root element not found')
}

createRoot(rootElement).render(
	<StrictMode>
		<QueryClientProvider>
			<RouterProvider router={router} />
		</QueryClientProvider>
	</StrictMode>,
)