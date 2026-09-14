import { ArrowRight, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  type AlertNotification,
  KIND_LABEL,
  notificationFigures,
  notificationStatus,
  notificationSubject,
  notificationTone,
} from './notification-copy'
import { TONE_ACCENT, TONE_TEXT, ToneIcon } from './notification-tone'

/** Toaster dos alertas: canto inferior direito, separado das confirmações do dia a dia. */
export const ALERT_TOASTER_ID = 'alertas'

/** Atenção e "não está no Full" podem esperar o fim do lançamento — o sininho guarda de qualquer jeito. */
const DISMISS_AFTER_MS = 8000

/**
 * Crítico fica na tela até ser fechado ou clicado. Vendas são lançadas olhando
 * para a nota, não para a tela, e esse é o único caso que vale interromper o
 * lançamento. Fechar não marca como lida; clicar sim.
 */
export function showAlertToast(
  notification: AlertNotification,
  onOpen: (notification: AlertNotification) => void,
) {
  const tone = notificationTone(notification)

  toast.custom(
    id => (
      <AlertToastCard
        notification={notification}
        onOpen={() => {
          toast.dismiss(id)
          onOpen(notification)
        }}
        onClose={() => toast.dismiss(id)}
      />
    ),
    {
      id: notification.id,
      toasterId: ALERT_TOASTER_ID,
      duration:
        tone === 'critico' ? Number.POSITIVE_INFINITY : DISMISS_AFTER_MS,
    },
  )
}

function AlertToastCard({
  notification,
  onOpen,
  onClose,
}: {
  notification: AlertNotification
  onOpen: () => void
  onClose: () => void
}) {
  const tone = notificationTone(notification)

  return (
    <div
      role="alert"
      className={cn(
        'relative w-full rounded-xl border border-border border-l-4 bg-card shadow-lg',
        TONE_ACCENT[tone],
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-start gap-3 p-4 pr-10 text-left"
      >
        <ToneIcon tone={tone} />
        <span className="min-w-0 flex-1 space-y-0.5">
          <span className="block text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            {KIND_LABEL[notification.kind]}
          </span>
          <span className="block truncate font-mono text-sm font-semibold text-foreground">
            {notificationSubject(notification)}
          </span>
          <span className={cn('block text-sm font-semibold', TONE_TEXT[tone])}>
            {notificationStatus(notification)}
          </span>
          <span className="block text-xs text-muted-foreground">
            {notificationFigures(notification)}
          </span>
          <span className="flex items-center gap-1 pt-1 text-xs font-semibold text-primary">
            Ver no relatório
            <ArrowRight className="size-3" />
          </span>
        </span>
      </button>
      <button
        type="button"
        aria-label="Fechar alerta"
        onClick={onClose}
        className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
