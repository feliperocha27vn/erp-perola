import {
  MutationCache,
  QueryClient,
  QueryClientProvider as TanstackQueryClientProvider,
} from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { getNotificationsQueryKey } from '@/api/hooks/notificationsController/useGetNotifications'

const queryClient: QueryClient = new QueryClient({
  // Todo lançamento pode mudar um alerta. Reconsultar o sininho logo depois de
  // qualquer escrita é o que faz o toast aparecer na hora, em vez de esperar a
  // consulta de minuto em minuto. Ver ADR 0011.
  mutationCache: new MutationCache({
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: getNotificationsQueryKey(),
      })
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      gcTime: 1000 * 60 * 10,
      retry: 3,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
})

interface QueryClientProviderProps {
  children: ReactNode
}

export function QueryClientProvider({ children }: QueryClientProviderProps) {
  return (
    <TanstackQueryClientProvider client={queryClient}>
      {children}
    </TanstackQueryClientProvider>
  )
}

export { queryClient }
