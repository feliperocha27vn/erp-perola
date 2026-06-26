export interface ShipmentAccountRow {
	id: string
	name: string
	created_at: Date
	updated_at: Date
}

export interface ShipmentAccountRepository {
	list(): Promise<ShipmentAccountRow[]>
	getById(id: string): Promise<ShipmentAccountRow | null>
	getByName(name: string): Promise<ShipmentAccountRow | null>
	create(data: { name: string }): Promise<ShipmentAccountRow>
	update(id: string, data: { name: string }): Promise<ShipmentAccountRow | null>
	delete(id: string): Promise<void>
}
