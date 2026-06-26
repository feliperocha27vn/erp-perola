import type { ShipmentAccountRepository, ShipmentAccountRow } from "../shipment-account-repository.js"

export class InMemoryShipmentAccountRepository implements ShipmentAccountRepository {
	public items: ShipmentAccountRow[] = []

	async list() {
		return [...this.items].sort((a, b) => a.name.localeCompare(b.name))
	}

	async getById(id: string) {
		return this.items.find((a) => a.id === id) ?? null
	}

	async getByName(name: string) {
		return this.items.find((a) => a.name === name) ?? null
	}

	async create(data: { name: string }) {
		const account: ShipmentAccountRow = {
			id: crypto.randomUUID(),
			name: data.name,
			created_at: new Date(),
			updated_at: new Date(),
		}
		this.items.push(account)
		return account
	}

	async update(id: string, data: { name: string }) {
		const index = this.items.findIndex((a) => a.id === id)
		if (index === -1) return null
		this.items[index] = { ...this.items[index], ...data, updated_at: new Date() }
		return this.items[index]
	}

	async delete(id: string) {
		this.items = this.items.filter((a) => a.id !== id)
	}
}
