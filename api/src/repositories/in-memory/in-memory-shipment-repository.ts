import type {
	CreateShipmentInput,
	ShipmentItemDetail,
	ShipmentItemRow,
	ShipmentRepository,
	ShipmentRow,
	ShipmentStatus,
	ShipmentWithDetails,
	ShipmentWithItemDetails,
	ShipmentWithItems,
	UpdateShipmentInput,
} from "../shipment-repository.js"

export class InMemoryShipmentRepository implements ShipmentRepository {
	public shipments: ShipmentRow[] = []
	public items: ShipmentItemRow[] = []
	public accountNames: Map<string, string> = new Map()

	async list(): Promise<ShipmentWithDetails[]> {
		return [...this.shipments]
			.sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
			.map((s) => ({
				...s,
				account_name: this.accountNames.get(s.account_id) ?? "",
				item_count: this.items.filter((i) => i.shipment_id === s.id).length,
			}))
	}

	async getById(id: string): Promise<ShipmentWithItemDetails | null> {
		const shipment = this.shipments.find((s) => s.id === id)
		if (!shipment) return null
		const items: ShipmentItemDetail[] = this.items
			.filter((i) => i.shipment_id === id)
			.map((i) => ({
				...i,
				sku: "",
				source_stock_title: "",
				destination_stock_title: "",
			}))
		return {
			...shipment,
			account_name: this.accountNames.get(shipment.account_id) ?? "",
			items,
		}
	}

	async create(data: CreateShipmentInput): Promise<ShipmentWithItems> {
		const shipment: ShipmentRow = {
			id: crypto.randomUUID(),
			account_id: data.account_id,
			date: data.date,
			notes: data.notes,
			status: "rascunho",
			created_at: new Date(),
			updated_at: new Date(),
		}
		this.shipments.push(shipment)

		const createdItems: ShipmentItemRow[] = data.items.map((item) => {
			const row: ShipmentItemRow = {
				id: crypto.randomUUID(),
				shipment_id: shipment.id,
				product_id: item.product_id,
				quantity: item.quantity,
				source_stock_id: item.source_stock_id,
				destination_stock_id: item.destination_stock_id,
				created_at: new Date(),
			}
			this.items.push(row)
			return row
		})

		return {
			...shipment,
			account_name: this.accountNames.get(shipment.account_id) ?? "",
			items: createdItems,
		}
	}

	async update(id: string, data: UpdateShipmentInput): Promise<ShipmentWithItemDetails | null> {
		const index = this.shipments.findIndex((s) => s.id === id)
		if (index === -1) return null

		this.shipments[index] = {
			...this.shipments[index],
			...(data.account_id !== undefined && { account_id: data.account_id }),
			...(data.date !== undefined && { date: data.date }),
			...(data.notes !== undefined && { notes: data.notes }),
			updated_at: new Date(),
		}

		if (data.items !== undefined) {
			this.items = this.items.filter((i) => i.shipment_id !== id)
			for (const item of data.items) {
				this.items.push({
					id: crypto.randomUUID(),
					shipment_id: id,
					product_id: item.product_id,
					quantity: item.quantity,
					source_stock_id: item.source_stock_id,
					destination_stock_id: item.destination_stock_id,
					created_at: new Date(),
				})
			}
		}

		return this.getById(id)
	}

	async updateStatus(id: string, status: ShipmentStatus): Promise<ShipmentRow | null> {
		const index = this.shipments.findIndex((s) => s.id === id)
		if (index === -1) return null
		this.shipments[index] = { ...this.shipments[index], status, updated_at: new Date() }
		return this.shipments[index]
	}

	async delete(id: string): Promise<void> {
		this.shipments = this.shipments.filter((s) => s.id !== id)
		this.items = this.items.filter((i) => i.shipment_id !== id)
	}
}
