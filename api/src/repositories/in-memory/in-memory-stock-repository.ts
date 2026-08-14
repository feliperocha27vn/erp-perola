import type { ProductStock } from "../product-repository.js"
import type {
	CreateStockInput,
	StockRepository,
	UpdateStockInput,
} from "../stock-repository.js"

export class InMemoryStockRepository implements StockRepository {
	public stocks: ProductStock[] = []

	async findByProductId(productId: string): Promise<ProductStock[]> {
		return this.stocks.filter((stock) => stock.product_id === productId)
	}

	async getById(stockId: string): Promise<ProductStock | null> {
		return this.stocks.find((stock) => stock.id === stockId) ?? null
	}

	async create(data: CreateStockInput): Promise<ProductStock> {
		const stock: ProductStock = {
			id: crypto.randomUUID(),
			product_id: data.product_id,
			title: data.title,
			qtde: data.qtde,
			full: data.full,
			marketplace: data.marketplace ?? null,
			store_id: data.store_id ?? null,
			created_at: new Date(),
			updated_at: new Date(),
		}

		this.stocks.push(stock)
		return stock
	}

	async update(
		stockId: string,
		data: UpdateStockInput,
	): Promise<ProductStock | null> {
		const stock = await this.getById(stockId)

		if (!stock) {
			return null
		}

		if (data.title !== undefined) stock.title = data.title
		if (data.qtde !== undefined) stock.qtde = data.qtde
		if (data.full !== undefined) stock.full = data.full
		if (data.marketplace !== undefined) stock.marketplace = data.marketplace
		if (data.store_id !== undefined) stock.store_id = data.store_id

		stock.updated_at = new Date()

		return stock
	}

	async delete(stockId: string): Promise<void> {
		this.stocks = this.stocks.filter((stock) => stock.id !== stockId)
	}
}
