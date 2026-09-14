import type {
	AlertNotification,
	AlertNotificationRepository,
	AlertState,
	NewAlertNotification,
} from "../alert-notification-repository.js"

const SEVERITY_ORDER = { critico: 0, atencao: 1 } as const

export class InMemoryAlertNotificationRepository implements AlertNotificationRepository {
	public baselineAt: Date | null = null
	public lastEvaluatedAt: Date | null = null
	public states: AlertState[] = []
	public notifications: AlertNotification[] = []
	private sequence = 0

	async runExclusive<T>(work: (repo: AlertNotificationRepository) => Promise<T>): Promise<T> {
		return work(this)
	}

	async findBaselineDate(): Promise<Date | null> {
		return this.baselineAt
	}

	async markEvaluated(at: Date): Promise<void> {
		this.baselineAt ??= at
		this.lastEvaluatedAt = at
	}

	async listStates(): Promise<AlertState[]> {
		return this.states.map((state) => ({ ...state }))
	}

	async saveStates(changed: AlertState[], removedKeys: string[]): Promise<void> {
		const removed = new Set(removedKeys)
		const byKey = new Map(
			this.states
				.filter((state) => !removed.has(state.subject_key))
				.map((state) => [state.subject_key, state]),
		)

		for (const state of changed) {
			byKey.set(state.subject_key, { ...state })
		}

		this.states = [...byKey.values()]
	}

	async createNotifications(notifications: NewAlertNotification[], at: Date): Promise<void> {
		for (const notification of notifications) {
			this.sequence += 1
			this.notifications.push({
				...notification,
				id: `notification-${this.sequence}`,
				created_at: at,
				read_at: null,
				resolved_at: null,
			})
		}
	}

	async resolveOpen(subjectKeys: string[], at: Date): Promise<number> {
		const keys = new Set(subjectKeys)
		let resolved = 0

		for (const notification of this.notifications) {
			if (!keys.has(notification.subject_key) || notification.resolved_at !== null) continue
			notification.resolved_at = at
			notification.read_at ??= at
			resolved += 1
		}

		return resolved
	}

	async deleteReadCreatedBefore(cutoff: Date): Promise<number> {
		const before = this.notifications.length
		this.notifications = this.notifications.filter(
			(notification) =>
				notification.read_at === null || notification.created_at.getTime() >= cutoff.getTime(),
		)
		return before - this.notifications.length
	}

	async listVisible(cutoff: Date): Promise<AlertNotification[]> {
		return this.notifications
			.filter(
				(notification) =>
					notification.read_at === null || notification.created_at.getTime() >= cutoff.getTime(),
			)
			.sort(
				(a, b) =>
					b.created_at.getTime() - a.created_at.getTime() ||
					severityRank(a) - severityRank(b) ||
					a.sku.localeCompare(b.sku),
			)
			.map((notification) => ({ ...notification }))
	}

	async countUnread(): Promise<number> {
		return this.notifications.filter((notification) => notification.read_at === null).length
	}

	async markRead(id: string, at: Date): Promise<boolean> {
		const notification = this.notifications.find((item) => item.id === id)
		if (!notification) return false
		notification.read_at ??= at
		return true
	}

	async markAllRead(at: Date): Promise<number> {
		let updated = 0
		for (const notification of this.notifications) {
			if (notification.read_at !== null) continue
			notification.read_at = at
			updated += 1
		}
		return updated
	}
}

function severityRank(notification: AlertNotification): number {
	return notification.severity === null ? 2 : SEVERITY_ORDER[notification.severity]
}
