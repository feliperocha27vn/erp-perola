import { differenceInCalendarDays, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { GetNotifications200 } from '@/api/types/notificationsController/GetNotifications'

export type AlertNotification = GetNotifications200['notifications'][number]

/** Crítico e Atenção seguem a gravidade; "não está no Full" não tem gravidade, é oportunidade. */
export type NotificationTone = 'critico' | 'atencao' | 'oportunidade'

const MARKETPLACE_LABEL: Record<
  NonNullable<AlertNotification['marketplace']>,
  string
> = {
  mercado_livre: 'ML Full',
  amazon: 'Amazon FBA',
  shopee: 'Shopee',
}

export const KIND_LABEL: Record<AlertNotification['kind'], string> = {
  reposicao: 'Alerta de Reposição',
  abastecimento_full: 'Abastecimento do Full',
  fora_do_full: 'Vende e não está no Full',
}

export function notificationTone(
  notification: AlertNotification,
): NotificationTone {
  if (notification.kind === 'fora_do_full') return 'oportunidade'
  return notification.severity === 'critico' ? 'critico' : 'atencao'
}

/** O SKU e, fora da reposição, onde ele está: depósito ou conta, com o marketplace. */
export function notificationSubject(notification: AlertNotification): string {
  if (notification.kind === 'reposicao') return notification.sku

  const place =
    notification.kind === 'fora_do_full'
      ? notification.store_name
      : notification.stock_title
  const marketplace = notification.marketplace
    ? ` (${MARKETPLACE_LABEL[notification.marketplace]})`
    : ''

  return `${notification.sku} · ${place ?? 'sem conta'}${marketplace}`
}

export function notificationStatus(notification: AlertNotification): string {
  if (notification.kind === 'fora_do_full') return 'Vende e não está no Full'
  if (notification.transition === 'piorou') {
    return 'Passou de Atenção para Crítico'
  }
  return notification.severity === 'critico'
    ? 'Entrou em Crítico'
    : 'Entrou em Atenção'
}

/**
 * Os números de quando a transição aconteceu — congelados de propósito. Os de
 * agora estão na página do alerta, depois do clique.
 */
export function notificationFigures(notification: AlertNotification): string {
  if (notification.kind === 'reposicao') {
    const units = notification.units_30d ?? 0
    return `${notification.physical_stock_qty ?? 0} em estoque · ${units} vendido${units !== 1 ? 's' : ''}/30d`
  }

  if (notification.kind === 'abastecimento_full') {
    const lead = notification.lead_time_days ?? 0
    const autonomy =
      notification.days_of_autonomy === null
        ? 'sem autonomia calculada'
        : `${formatDays(notification.days_of_autonomy)} de autonomia`
    return `${autonomy} · envio leva ${lead} dia${lead !== 1 ? 's' : ''}`
  }

  const units = notification.account_units ?? 0
  return `${notification.store_name ?? 'A conta'} vendeu ${units} em 90d sem depósito full`
}

/** A chave da linha na página do alerta — a mesma do `data-highlight-key` de lá. */
export function notificationRowKey(notification: AlertNotification): string {
  if (notification.kind === 'reposicao') return notification.product_id
  if (notification.kind === 'abastecimento_full') {
    return notification.stock_id ?? ''
  }
  return `${notification.product_id}::${notification.store_id}::${notification.marketplace}`
}

/** "hoje 9h12", "ontem 9h12", "seg 9h12" na última semana, "02/09 9h12" antes disso. */
export function formatNotificationTime(iso: string, now = new Date()): string {
  const date = new Date(iso)
  const days = differenceInCalendarDays(now, date)
  const time = format(date, "H'h'mm")

  if (days <= 0) return `hoje ${time}`
  if (days === 1) return `ontem ${time}`
  if (days < 7) return `${format(date, 'EEE', { locale: ptBR })} ${time}`
  return `${format(date, 'dd/MM')} ${time}`
}

function formatDays(days: number): string {
  const value =
    days < 10 ? days.toFixed(1).replace('.', ',') : String(Math.round(days))
  return `${value} dia${value === '1' || value === '1,0' ? '' : 's'}`
}
