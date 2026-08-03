import type {
	BrandSalesCount,
	CreateSaleInput,
	FetchCurrentMonthSalesMetricsReply,
	FetchLastMonthSalesMetricsReply,
	FetchMonthlySalesPaceMetricsReply,
	FindManySalesFilters,
	FindManySalesReply,
	Sale,
	SaleRepository,
	UpdateSaleInput,
} from "../sale-repository.js"

export class InMemorySaleRepository implements SaleRepository {
	public sales: Sale[] = []

	async findMany(filters: FindManySalesFilters): Promise<FindManySalesReply> {
		let items = this.sales

		if (filters.startDate) {
			const startDate = filters.startDate
			items = items.filter((sale) => sale.sale_date >= startDate)
		}

		if (filters.endDate) {
			const endDate = filters.endDate
			items = items.filter((sale) => sale.sale_date <= endDate)
		}

		if (filters.brandId) {
			items = items.filter((sale) => sale.product.brand_id === filters.brandId)
		}

		if (filters.storeId) {
			items = items.filter((sale) => sale.store_id === filters.storeId)
		}

		const totalCount = items.length
		const paginatedItems = items.slice(
			filters.offset,
			filters.offset + filters.limit,
		)

		const brandCounts: BrandSalesCount[] = []

		return {
			items: paginatedItems,
			totalCount,
			brandCounts,
		}
	}

	async fetchMonthlySalesPaceMetrics(): Promise<FetchMonthlySalesPaceMetricsReply> {
		return {
			items: [],
			current_month_total_cents: 0,
			last_month_total_cents: 0,
		}
	}

	async fetchLastMonthSalesMetrics(): Promise<FetchLastMonthSalesMetricsReply> {
		return {
			total_cents: 0,
		}
	}

	async fetchCurrentMonthSalesMetrics(): Promise<FetchCurrentMonthSalesMetricsReply> {
		return {
			total_cents: 0,
		}
	}

	async getById(id: string): Promise<Sale | null> {
		return this.sales.find((sale) => sale.id === id) ?? null
	}

	async create(data: CreateSaleInput): Promise<Sale> {
		const sale = await this.makeSale(data)
		this.sales.push(sale)
		return sale
	}

	async update(id: string, data: UpdateSaleInput): Promise<Sale | null> {
		const sale = await this.getById(id)

		if (!sale) {
			return null
		}

		if (data.quantity !== undefined) sale.quantity = data.quantity
		if (data.sale_price !== undefined) sale.sale_price = data.sale_price
		if (data.total_price !== undefined) sale.total_price = data.total_price
		if (data.channel !== undefined) sale.channel = data.channel
		if (data.sale_date !== undefined) sale.sale_date = data.sale_date
		if (data.store_id !== undefined) sale.store_id = data.store_id

		sale.updated_at = new Date()

		return sale
	}

	async delete(id: string): Promise<void> {
		this.sales = this.sales.filter((sale) => sale.id !== id)
	}

	async createInTransaction(data: CreateSaleInput): Promise<Sale> {
		return this.create(data)
	}

	async deleteInTransaction(id: string): Promise<void> {
		return this.delete(id)
	}

	async updateInTransaction(
		id: string,
		data: UpdateSaleInput,
	): Promise<Sale | null> {
		return this.update(id, data)
	}

	private async makeSale(data: CreateSaleInput): Promise<Sale> {
		const now = new Date()

		return {
			id: crypto.randomUUID(),
			product_id: data.product_id,
			stock_id: data.stock_id,
			store_id: data.store_id ?? null,
			quantity: data.quantity,
			sale_price: data.sale_price,
			total_price: data.total_price,
			channel: data.channel,
			sale_date: data.sale_date,
			created_at: now,
			updated_at: now,
			product: {
				id: data.product_id,
				sku: "",
				ean: "",
				brand_id: null,
				url_image: null,
				created_at: now,
				updated_at: now,
			},
			stock: {
				id: data.stock_id,
				product_id: data.product_id,
				title: "",
				qtde: 0,
				full: false,
				created_at: now,
				updated_at: now,
			},
			store: null,
		}
	}
}
