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

/**
 * rascunho    -> planejado, nenhum estoque mexeu
 * em_transito -> despachado, origem debitada, destino ainda NAO creditado
 * recebido    -> deu entrada no CD, destino creditado
 *
 * O estado intermediario existe para que qtde de um estoque full signifique
 * "disponivel para venda", e nao "ja despachei" — ver ADR 0006.
 */
export type ShipmentStatus = "rascunho" | "em_transito" | "recebido"

export interface ShipmentRow {
	id: string
	account_id: string
	date: Date
	notes: string | null
	status: ShipmentStatus
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
	updateStatus(id: string, status: ShipmentStatus): Promise<ShipmentRow | null>
	delete(id: string): Promise<void>
}
