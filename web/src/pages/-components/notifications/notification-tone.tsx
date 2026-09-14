import { AlertTriangle, Store, Timer } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { NotificationTone } from './notification-copy'

export const TONE_TEXT: Record<NotificationTone, string> = {
  critico: 'text-destructive',
  atencao: 'text-amber-700',
  oportunidade: 'text-indigo-700',
}

export const TONE_ACCENT: Record<NotificationTone, string> = {
  critico: 'border-l-destructive',
  atencao: 'border-l-amber-500',
  oportunidade: 'border-l-indigo-500',
}

const TONE_ICON_BOX: Record<NotificationTone, string> = {
  critico: 'bg-destructive/10 text-destructive',
  atencao: 'bg-amber-100 text-amber-700',
  oportunidade: 'bg-indigo-50 text-indigo-700',
}

/** Mesmos ícones dos selos das páginas: triângulo no Crítico, timer na Atenção do Full. */
export function ToneIcon({
  tone,
  className,
}: {
  tone: NotificationTone
  className?: string
}) {
  const Icon =
    tone === 'critico' ? AlertTriangle : tone === 'atencao' ? Timer : Store

  return (
    <span
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-lg',
        TONE_ICON_BOX[tone],
        className,
      )}
    >
      <Icon className="size-4" />
    </span>
  )
}
