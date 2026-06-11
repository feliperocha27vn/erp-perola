import type { ProductStock } from "./product-repository.js"

export interface CreateStockInput {
	product_id: string
	title: string
	qtde: number
	full: boolean
}

export interface UpdateStockInput {
	title?: string
	qtde?: number
	full?: boolean
}

export interface StockRepository {
	findByProductId(productId: string): Promise<ProductStock[]>
	getById(stockId: string): Promise<ProductStock | null>
	create(data: CreateStockInput): Promise<ProductStock>
	update(stockId: string, data: UpdateStockInput): Promise<ProductStock | null>
	delete(stockId: string): Promise<void>
}
