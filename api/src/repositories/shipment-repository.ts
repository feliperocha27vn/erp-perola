export interface ShipmentItemInput {
	product_id: string
	quantity: number
	source_stock_id: string
	destination_stock_id: string
}

export interface ShipmentItemRow {
	id: string
	shipment_id: string
	product_id: string
	quantity: number
	source_stock_id: string
	destination_stock_id: string
	created_at: Date
}

export interface ShipmentItemDetail {
	id: string
	shipment_id: string
	product_id: string
	sku: string
	quantity: number
	source_stock_id: string
	source_stock_title: string
	destination_stock_id: string
	destination_stock_title: string
	created_at: Date
}

export interface ShipmentRow {
	id: string
	account_id: string
	date: Date
	notes: string | null
	status: "rascunho" | "confirmado"
	created_at: Date
	updated_at: Date
}

export interface ShipmentWithDetails extends ShipmentRow {
	account_name: string
	item_count: number
}

export interface ShipmentWithItems extends ShipmentRow {
	account_name: string
	items: ShipmentItemRow[]
}

export interface ShipmentWithItemDetails extends ShipmentRow {
	account_name: string
	items: ShipmentItemDetail[]
}

export interface CreateShipmentInput {
	account_id: string
	date: Date
	notes: string | null
	items: ShipmentItemInput[]
}

export interface UpdateShipmentInput {
	account_id?: string
	date?: Date
	notes?: string | null
	items?: ShipmentItemInput[]
}

export interface ShipmentRepository {
	list(): Promise<ShipmentWithDetails[]>
	getById(id: string): Promise<ShipmentWithItemDetails | null>
	create(data: CreateShipmentInput): Promise<ShipmentWithItems>
	update(id: string, data: UpdateShipmentInput): Promise<ShipmentWithItemDetails | null>
	updateStatus(id: string, status: "rascunho" | "confirmado"): Promise<ShipmentRow | null>
	delete(id: string): Promise<void>
}
