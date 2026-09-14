import { and, asc, count, desc, eq, gte, inArray, isNotNull, isNull, lt, or, sql } from "drizzle-orm"
import type { PgDatabase } from "drizzle-orm/pg-core"
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js"
import { db } from "../../db/connection.js"
import { alertMonitor, alertNotifications, alertStates } from "../../db/schema.js"
import type {
	AlertNotification,
	AlertNotificationRepository,
	AlertState,
	NewAlertNotification,
} from "../alert-notification-repository.js"

/**
 * Chave do advisory lock que serializa as avaliacoes. O numero em si nao importa,
 * so precisa ser o mesmo em todo lugar e nao colidir com outro lock do banco.
 */
const EVALUATION_LOCK_KEY = 7_230_411

const MONITOR_ID = 1

/** O banco ou uma transacao aberta — os metodos rodam igual nos dois. */
type Executor = PgDatabase<PostgresJsQueryResultHKT>

export class DrizzleAlertNotificationRepository implements AlertNotificationRepository {
	constructor(private executor: Executor = db) {}

	async runExclusive<T>(work: (repo: AlertNotificationRepository) => Promise<T>): Promise<T> {
		return db.transaction(async (tx) => {
			// Liberado sozinho no fim da transacao. Uma segunda aba que chegue no meio
			// espera aqui e le o estado ja gravado pela primeira.
			await tx.execute(sql`select pg_advisory_xact_lock(${EVALUATION_LOCK_KEY}::bigint)`)
			return work(new DrizzleAlertNotificationRepository(tx))
		})
	}

	async findBaselineDate(): Promise<Date | null> {
		const [row] = await this.executor
			.select({ baseline_at: alertMonitor.baseline_at })
			.from(alertMonitor)
			.where(eq(alertMonitor.id, MONITOR_ID))
			.limit(1)

		return row?.baseline_at ?? null
	}

	async markEvaluated(at: Date): Promise<void> {
		await this.executor
			.insert(alertMonitor)
			.values({ id: MONITOR_ID, baseline_at: at, last_evaluated_at: at })
			.onConflictDoUpdate({
				target: alertMonitor.id,
				set: { last_evaluated_at: at },
			})
	}

	async listStates(): Promise<AlertState[]> {
		return this.executor
			.select({
				subject_key: alertStates.subject_key,
				kind: alertStates.kind,
				severity: alertStates.severity,
			})
			.from(alertStates)
	}

	async saveStates(changed: AlertState[], removedKeys: string[]): Promise<void> {
		if (removedKeys.length > 0) {
			await this.executor
				.delete(alertStates)
				.where(inArray(alertStates.subject_key, removedKeys))
		}

		if (changed.length > 0) {
			await this.executor
				.insert(alertStates)
				.values(changed.map((state) => ({ ...state, updated_at: new Date() })))
				.onConflictDoUpdate({
					target: alertStates.subject_key,
					set: {
						kind: sql`excluded.kind`,
						severity: sql`excluded.severity`,
						updated_at: sql`excluded.updated_at`,
					},
				})
		}
	}

	async createNotifications(notifications: NewAlertNotification[], at: Date): Promise<void> {
		if (notifications.length === 0) return

		await this.executor.insert(alertNotifications).values(
			notifications.map((notification) => ({
				subject_key: notification.subject_key,
				kind: notification.kind,
				transition: notification.transition,
				severity: notification.severity,
				product_id: notification.product_id,
				sku: notification.sku,
				stock_id: notification.stock_id,
				stock_title: notification.stock_title,
				store_id: notification.store_id,
				store_name: notification.store_name,
				marketplace: notification.marketplace,
				physical_stock_qty: notification.physical_stock_qty,
				units_30d: notification.units_30d,
				days_of_autonomy: notification.days_of_autonomy,
				lead_time_days: notification.lead_time_days,
				account_units: notification.account_units,
				created_at: at,
			})),
		)
	}

	async resolveOpen(subjectKeys: string[], at: Date): Promise<number> {
		if (subjectKeys.length === 0) return 0

		const rows = await this.executor
			.update(alertNotifications)
			.set({
				resolved_at: at,
				read_at: sql`coalesce(${alertNotifications.read_at}, ${at.toISOString()}::timestamp)`,
			})
			.where(
				and(
					inArray(alertNotifications.subject_key, subjectKeys),
					isNull(alertNotifications.resolved_at),
				),
			)
			.returning({ id: alertNotifications.id })

		return rows.length
	}

	async deleteReadCreatedBefore(cutoff: Date): Promise<number> {
		const rows = await this.executor
			.delete(alertNotifications)
			.where(
				and(isNotNull(alertNotifications.read_at), lt(alertNotifications.created_at, cutoff)),
			)
			.returning({ id: alertNotifications.id })

		return rows.length
	}

	async listVisible(cutoff: Date): Promise<AlertNotification[]> {
		const rows = await this.executor
			.select()
			.from(alertNotifications)
			.where(
				or(isNull(alertNotifications.read_at), gte(alertNotifications.created_at, cutoff)),
			)
			// Enum ordena pela declaracao: critico antes de atencao, sem gravidade por ultimo.
			.orderBy(
				desc(alertNotifications.created_at),
				asc(alertNotifications.severity),
				asc(alertNotifications.sku),
			)

		return rows.map(toNotification)
	}

	async countUnread(): Promise<number> {
		const [row] = await this.executor
			.select({ value: count() })
			.from(alertNotifications)
			.where(isNull(alertNotifications.read_at))

		return Number(row?.value ?? 0)
	}

	async markRead(id: string, at: Date): Promise<boolean> {
		const rows = await this.executor
			.update(alertNotifications)
			.set({
				read_at: sql`coalesce(${alertNotifications.read_at}, ${at.toISOString()}::timestamp)`,
			})
			.where(eq(alertNotifications.id, id))
			.returning({ id: alertNotifications.id })

		return rows.length > 0
	}

	async markAllRead(at: Date): Promise<number> {
		const rows = await this.executor
			.update(alertNotifications)
			.set({ read_at: at })
			.where(isNull(alertNotifications.read_at))
			.returning({ id: alertNotifications.id })

		return rows.length
	}
}

function toNotification(row: typeof alertNotifications.$inferSelect): AlertNotification {
	return {
		id: row.id,
		subject_key: row.subject_key,
		kind: row.kind,
		transition: row.transition,
		severity: row.severity,
		product_id: row.product_id,
		sku: row.sku,
		stock_id: row.stock_id,
		stock_title: row.stock_title,
		store_id: row.store_id,
		store_name: row.store_name,
		marketplace: row.marketplace,
		physical_stock_qty: row.physical_stock_qty,
		units_30d: row.units_30d,
		days_of_autonomy: row.days_of_autonomy,
		lead_time_days: row.lead_time_days,
		account_units: row.account_units,
		created_at: row.created_at,
		read_at: row.read_at,
		resolved_at: row.resolved_at,
	}
}
