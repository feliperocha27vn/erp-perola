import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Bell, BellOff, BellRing, CheckCheck } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { toast } from 'sonner'
import {
  getNotificationsQueryKey,
  useGetNotifications,
} from '@/api/hooks/notificationsController/useGetNotifications'
import { usePatchNotificationsByIdRead } from '@/api/hooks/notificationsController/usePatchNotificationsByIdRead'
import { usePostNotificationsReadAll } from '@/api/hooks/notificationsController/usePostNotificationsReadAll'
import type { GetNotifications200 } from '@/api/types/notificationsController/GetNotifications'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { showAlertToast } from './alert-toast'
import {
  type AlertNotification,
  formatNotificationTime,
  KIND_LABEL,
  notificationFigures,
  notificationRowKey,
  notificationStatus,
  notificationSubject,
  notificationTone,
} from './notification-copy'
import { TONE_TEXT, ToneIcon } from './notification-tone'

/**
 * A consulta do sininho é o que avalia as transições no servidor. De minuto em
 * minuto ela pega o que mudou só pelo tempo passar e o que foi lançado em outro
 * aparelho. Um lançamento feito aqui não espera: reconsulta na hora (ver
 * `mutationCache` em `lib/react-query`).
 */
const POLL_INTERVAL_MS = 60_000

function formatCount(count: number): string {
  return count > 99 ? '99+' : String(count)
}

export function NotificationBell({ className }: { className?: string }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  const { data } = useGetNotifications({
    query: {
      refetchInterval: POLL_INTERVAL_MS,
      refetchIntervalInBackground: true,
      staleTime: 0,
    },
  })
  const markRead = usePatchNotificationsByIdRead()
  const markAllRead = usePostNotificationsReadAll()

  const notifications = data?.notifications ?? []
  const unread = data?.unread_count ?? 0

  /** O contador cai no clique, sem esperar a volta do servidor. */
  const setReadLocally = useCallback(
    (matches: (notification: AlertNotification) => boolean) => {
      const readAt = new Date().toISOString()

      queryClient.setQueryData<GetNotifications200>(
        getNotificationsQueryKey(),
        current => {
          if (!current) return current

          let changed = 0
          const next = current.notifications.map(notification => {
            if (notification.read_at !== null || !matches(notification)) {
              return notification
            }
            changed += 1
            return { ...notification, read_at: readAt }
          })

          return {
            unread_count: Math.max(0, current.unread_count - changed),
            notifications: next,
          }
        },
      )
    },
    [queryClient],
  )

  /** Ids que viraram toast nesta sessão, para fechar o toast quando a notificação for lida ou resolvida. */
  const toasted = useRef(new Set<string>())

  function openNotification(notification: AlertNotification) {
    setOpen(false)
    toast.dismiss(notification.id)
    toasted.current.delete(notification.id)

    if (notification.read_at === null) {
      setReadLocally(item => item.id === notification.id)
      markRead.mutate({ id: notification.id })
    }

    const resolved = notification.resolved_at !== null
    if (resolved) {
      toast.info(`${notification.sku} não está mais em alerta.`)
    }
    const destaque = resolved ? undefined : notificationRowKey(notification)

    if (notification.kind === 'reposicao') {
      navigate({
        to: '/alertas-de-reposicao',
        search: { brand: undefined, destaque },
      })
    } else {
      navigate({ to: '/abastecimento-do-full', search: { destaque } })
    }
  }

  // O toast guarda o handler do momento em que foi criado; o ref aponta sempre para o atual.
  const openRef = useRef(openNotification)
  useLayoutEffect(() => {
    openRef.current = openNotification
  })

  const knownIds = useRef<Set<string> | null>(null)

  useEffect(() => {
    if (!data) return

    // A primeira resposta da sessão traz o que aconteceu enquanto ninguém olhava.
    // Isso só sobe o contador — toast é para o que surge com o app já aberto.
    if (knownIds.current === null) {
      knownIds.current = new Set(data.notifications.map(n => n.id))
      return
    }

    const known = knownIds.current
    const fresh = data.notifications.filter(n => !known.has(n.id))
    for (const notification of fresh) known.add(notification.id)

    // A lista vem da mais nova para a mais antiga; exibir ao contrário deixa a mais nova na frente da pilha.
    for (const notification of [...fresh].reverse()) {
      if (notification.read_at !== null || notification.resolved_at !== null) {
        continue
      }
      toasted.current.add(notification.id)
      showAlertToast(notification, item => openRef.current(item))
    }

    // Um Crítico que se resolveu (ou foi lido em outra aba) não fica preso na tela.
    for (const notification of data.notifications) {
      if (notification.read_at !== null && toasted.current.has(notification.id)) {
        toast.dismiss(notification.id)
        toasted.current.delete(notification.id)
      }
    }
  }, [data])

  // Contador no título da aba, para ser visto com o app em segundo plano.
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\+?\)\s*/, '')
    document.title = unread > 0 ? `(${formatCount(unread)}) ${base}` : base
    return () => {
      document.title = base
    }
  }, [unread])

  function handleMarkAllRead() {
    setReadLocally(() => true)
    for (const id of toasted.current) toast.dismiss(id)
    toasted.current.clear()
    markAllRead.mutate()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={
            unread > 0
              ? `Notificações: ${unread} não lida${unread !== 1 ? 's' : ''}`
              : 'Notificações'
          }
          className={cn(
            'glass-card relative flex size-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary',
            className,
          )}
        >
          {unread > 0 ? (
            <BellRing className="size-5 text-primary" />
          ) : (
            <Bell className="size-5" />
          )}
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-bold tabular-nums text-white">
              {formatCount(unread)}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[calc(100vw-2rem)] max-w-[26rem] overflow-hidden rounded-2xl p-0"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <p className="font-display font-bold text-foreground">
              Notificações
            </p>
            <p className="text-xs text-muted-foreground">
              {unread > 0
                ? `${unread} não lida${unread !== 1 ? 's' : ''}`
                : 'Nada pendente'}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 text-xs"
            disabled={unread === 0}
            onClick={handleMarkAllRead}
          >
            <CheckCheck className="size-4" />
            Marcar todas como lidas
          </Button>
        </div>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
            <BellOff className="size-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Nenhuma notificação nos últimos 30 dias.
            </p>
            <p className="text-xs text-muted-foreground">
              Quando um produto entrar em alerta, ele aparece aqui.
            </p>
          </div>
        ) : (
          <ul className="max-h-[min(70vh,32rem)] divide-y divide-border overflow-y-auto">
            {notifications.map(notification => (
              <li key={notification.id}>
                <NotificationItem
                  notification={notification}
                  onOpen={() => openNotification(notification)}
                />
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}

function NotificationItem({
  notification,
  onOpen,
}: {
  notification: AlertNotification
  onOpen: () => void
}) {
  const tone = notificationTone(notification)
  const isUnread = notification.read_at === null

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/60',
        isUnread && 'bg-primary/5',
      )}
    >
      <ToneIcon tone={tone} />
      <span className="min-w-0 flex-1 space-y-0.5">
        <span className="flex items-start justify-between gap-2">
          <span
            className={cn(
              'truncate font-mono text-sm text-foreground',
              isUnread ? 'font-bold' : 'font-medium',
            )}
          >
            {notificationSubject(notification)}
          </span>
          {isUnread && (
            <span
              role="img"
              aria-label="Não lida"
              className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
            />
          )}
        </span>
        <span className={cn('block text-sm font-medium', TONE_TEXT[tone])}>
          {notificationStatus(notification)}
        </span>
        <span className="block text-xs text-muted-foreground">
          {notificationFigures(notification)}
        </span>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-0.5 text-[11px] text-muted-foreground">
          <span>{KIND_LABEL[notification.kind]}</span>
          <span aria-hidden>·</span>
          <span className="tabular-nums">
            {formatNotificationTime(notification.created_at)}
          </span>
          {notification.resolved_at !== null && (
            <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700">
              resolvido
            </span>
          )}
        </span>
      </span>
    </button>
  )
}
