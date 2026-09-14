import type {
	AlertNotificationRepository,
	AlertState,
	AlertSubject,
	NewAlertNotification,
} from "../../repositories/alert-notification-repository.js"
import {
	type FetchFullReplenishmentAlertsUseCase,
	MARKETPLACE_PARAMS,
} from "../reports/fetch-full-replenishment-alerts.js"
import type { FetchRestockAlertsUseCase, RestockAlertItem } from "../reports/fetch-restock-alerts.js"

/** Quanto tempo uma notificacao lida ou resolvida continua no sininho. */
export const NOTIFICATION_HISTORY_DAYS = 30

const DAY_MS = 24 * 60 * 60 * 1000

type RestockAlertsSource = Pick<FetchRestockAlertsUseCase, "execute">
type FullAlertsSource = Pick<FetchFullReplenishmentAlertsUseCase, "execute">
type FullAlertsReport = Awaited<ReturnType<FullAlertsSource["execute"]>>

interface EvaluateAlertNotificationsUseCaseResponse {
	/** true quando esta foi a primeira avaliacao e so gravou o estado. */
	baseline: boolean
	created: number
	resolved: number
}

/**
 * Compara o que os alertas dizem agora com o ultimo estado conhecido de cada
 * sujeito e transforma a diferenca em notificacoes.
 *
 * Nao ha agendador: isto roda quando o sininho consulta o servidor, e o sininho
 * consulta logo depois de cada lancamento e a cada minuto. Uma transicao causada
 * so pelo tempo passar e observada na consulta seguinte. Ver ADR 0011.
 */
export class EvaluateAlertNotificationsUseCase {
	constructor(
		private restockAlerts: RestockAlertsSource,
		private fullAlerts: FullAlertsSource,
		private repo: AlertNotificationRepository,
		private now: () => Date = () => new Date(),
	) {}

	async execute(): Promise<EvaluateAlertNotificationsUseCaseResponse> {
		return this.repo.runExclusive(async (repo) => {
			const at = this.now()

			// Calculado dentro da exclusao: se duas avaliacoes lessem os relatorios em
			// momentos diferentes e gravassem fora de ordem, a mais antiga desfaria a
			// mais nova e geraria uma transicao que nao aconteceu.
			const [restock, full] = await Promise.all([
				this.restockAlerts.execute(),
				this.fullAlerts.execute(),
			])

			const subjects = collectNotifiableSubjects(restock.items, full)
			const baselineAt = await repo.findBaselineDate()
			const previous = new Map(
				(await repo.listStates()).map((state) => [state.subject_key, state]),
			)

			// Notificar o que ja estava em alerta no dia da ativacao so repetiria a
			// tabela. A linha de base grava o estado e nao emite nada.
			if (baselineAt === null) {
				await repo.saveStates(subjects.map(toState), [...previous.keys()])
				await repo.markEvaluated(at)
				return { baseline: true, created: 0, resolved: 0 }
			}

			const notifications: NewAlertNotification[] = []
			const changed: AlertState[] = []

			for (const subject of subjects) {
				const before = previous.get(subject.subject_key)

				if (!before) {
					notifications.push({ ...subject, transition: "entrou" })
					changed.push(toState(subject))
					continue
				}

				if (before.severity === subject.severity) continue

				// Melhorar (critico -> atencao) so atualiza o estado, para uma piora
				// posterior ser notada de novo.
				if (before.severity === "atencao" && subject.severity === "critico") {
					notifications.push({ ...subject, transition: "piorou" })
				}
				changed.push(toState(subject))
			}

			const current = new Set(subjects.map((subject) => subject.subject_key))
			const left = [...previous.keys()].filter((key) => !current.has(key))

			await repo.saveStates(changed, left)
			const resolved = await repo.resolveOpen(left, at)
			await repo.createNotifications(notifications, at)
			await repo.deleteReadCreatedBefore(
				new Date(at.getTime() - NOTIFICATION_HISTORY_DAYS * DAY_MS),
			)
			await repo.markEvaluated(at)

			return { baseline: false, created: notifications.length, resolved }
		})
	}
}

/**
 * O que conta como "em alerta" para notificar. Nao e o mesmo que aparecer na
 * pagina, porque gravidade significa coisas diferentes em cada alerta:
 *
 * - Reposicao: critico, ou atencao por "perto do limite". "Vendas acelerando"
 *   sozinho dispara com a primeira venda do mes de um relogio parado
 *   (`1 x 2 > 1`) e viraria um aviso por venda lancada.
 * - Abastecimento do Full: as duas gravidades. La atencao e a hora certa de
 *   enviar e critico ja e ruptura garantida.
 * - Fora do Full: ao entrar na lista.
 *
 * Estoque parado no Full nunca notifica.
 */
export function collectNotifiableSubjects(
	restock: RestockAlertItem[],
	full: Pick<FullAlertsReport, "alerts" | "missing">,
): AlertSubject[] {
	const subjects: AlertSubject[] = []

	for (const item of restock) {
		if (item.severity !== "critico" && !item.reasons.includes("perto_do_limite")) continue

		subjects.push({
			...emptySubject(),
			subject_key: `reposicao:${item.product_id}`,
			kind: "reposicao",
			severity: item.severity,
			product_id: item.product_id,
			sku: item.sku,
			physical_stock_qty: item.physical_stock_qty,
			units_30d: item.units_30d,
		})
	}

	for (const alert of full.alerts) {
		subjects.push({
			...emptySubject(),
			subject_key: `abastecimento_full:${alert.stock_id}`,
			kind: "abastecimento_full",
			severity: alert.severity,
			product_id: alert.product_id,
			sku: alert.sku,
			stock_id: alert.stock_id,
			stock_title: alert.stock_title,
			store_id: alert.store_id,
			store_name: alert.store_name,
			marketplace: alert.marketplace,
			days_of_autonomy: alert.days_of_autonomy,
			lead_time_days: MARKETPLACE_PARAMS[alert.marketplace].leadTimeDays,
		})
	}

	for (const listing of full.missing) {
		subjects.push({
			...emptySubject(),
			subject_key: `fora_do_full:${listing.product_id}:${listing.store_id}:${listing.marketplace}`,
			kind: "fora_do_full",
			severity: null,
			product_id: listing.product_id,
			sku: listing.sku,
			store_id: listing.store_id,
			store_name: listing.store_name,
			marketplace: listing.marketplace,
			account_units: listing.account_units_long,
		})
	}

	return subjects
}

function emptySubject(): Omit<AlertSubject, "subject_key" | "kind" | "severity" | "product_id" | "sku"> {
	return {
		stock_id: null,
		stock_title: null,
		store_id: null,
		store_name: null,
		marketplace: null,
		physical_stock_qty: null,
		units_30d: null,
		days_of_autonomy: null,
		lead_time_days: null,
		account_units: null,
	}
}

function toState(subject: AlertSubject): AlertState {
	return {
		subject_key: subject.subject_key,
		kind: subject.kind,
		severity: subject.severity,
	}
}
