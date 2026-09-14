import type { Marketplace } from "./report-repository.js"

/**
 * De qual lista o sujeito saiu.
 * - `reposicao`: Alerta de Reposicao, sujeito e o produto.
 * - `abastecimento_full`: Alerta de Abastecimento do Full, sujeito e o par produto x deposito full.
 * - `fora_do_full`: SKU que vende e nao esta no Full, sujeito e produto x conta x marketplace.
 */
export type AlertKind = "reposicao" | "abastecimento_full" | "fora_do_full"

export type AlertSeverity = "critico" | "atencao"

/** `entrou` na condicao notificavel, ou `piorou` de atencao para critico dentro dela. */
export type AlertTransition = "entrou" | "piorou"

/** Ultimo estado conhecido de um sujeito. Sem ele nao ha como saber que algo "entrou". */
export interface AlertState {
	subject_key: string
	kind: AlertKind
	/** Nulo em `fora_do_full`, que nao tem gravidade. */
	severity: AlertSeverity | null
}

/**
 * Um sujeito em condicao notificavel agora, com os numeros que definem o alerta
 * dele. Cada tipo preenche so os seus; os outros ficam nulos.
 */
export interface AlertSubject extends AlertState {
	product_id: string
	sku: string
	stock_id: string | null
	stock_title: string | null
	store_id: string | null
	store_name: string | null
	marketplace: Marketplace | null
	/** Reposicao: estoque fisico. */
	physical_stock_qty: number | null
	/** Reposicao: unidades vendidas em 30 dias. */
	units_30d: number | null
	/** Abastecimento do Full: autonomia do disponivel. */
	days_of_autonomy: number | null
	/** Abastecimento do Full: lead time do marketplace. */
	lead_time_days: number | null
	/** Fora do Full: o que a conta vendeu no canal na janela longa. */
	account_units: number | null
}

export interface NewAlertNotification extends AlertSubject {
	transition: AlertTransition
}

/** Os numeros ficam congelados no momento da transicao — e o registro de um evento. */
export interface AlertNotification extends NewAlertNotification {
	id: string
	created_at: Date
	read_at: Date | null
	resolved_at: Date | null
}

export interface AlertNotificationRepository {
	/**
	 * Roda `work` com exclusao mutua entre avaliacoes. Duas abas consultando o
	 * sininho ao mesmo tempo leriam o mesmo estado anterior e criariam a mesma
	 * notificacao duas vezes.
	 */
	runExclusive<T>(work: (repo: AlertNotificationRepository) => Promise<T>): Promise<T>
	/** Quando a linha de base foi gravada. Nulo antes da primeira avaliacao. */
	findBaselineDate(): Promise<Date | null>
	/** Registra a avaliacao; na primeira vez, grava tambem a linha de base. */
	markEvaluated(at: Date): Promise<void>
	listStates(): Promise<AlertState[]>
	saveStates(changed: AlertState[], removedKeys: string[]): Promise<void>
	createNotifications(notifications: NewAlertNotification[], at: Date): Promise<void>
	/** Resolve e marca como lidas as notificacoes em aberto destes sujeitos. */
	resolveOpen(subjectKeys: string[], at: Date): Promise<number>
	deleteReadCreatedBefore(cutoff: Date): Promise<number>
	/** Nao lidas sempre; lidas so as criadas a partir de `cutoff`. Mais novas primeiro. */
	listVisible(cutoff: Date): Promise<AlertNotification[]>
	countUnread(): Promise<number>
	/** false quando a notificacao nao existe. Uma ja lida mantem a data original. */
	markRead(id: string, at: Date): Promise<boolean>
	markAllRead(at: Date): Promise<number>
}
