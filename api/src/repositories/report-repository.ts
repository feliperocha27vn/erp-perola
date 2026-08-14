export interface StockEntry {
	id: string
	title: string
	qtde: number
}

export interface StockReportRow {
	productId: string
	sku: string
	stocks: StockEntry[]
	total: number
}

export interface StockReportRepository {
	fetchStockReport(brandId: string | null): Promise<StockReportRow[]>
}

export interface SalesReportRow {
	sale_date: Date
	sku: string
	store_name: string | null
	channel: string
	stock_title: string
	quantity: number
	sale_price: number
	total_price: number
}

export interface SalesReportRepository {
	fetchSalesReport(startDate: Date, endDate: Date): Promise<SalesReportRow[]>
}

export interface AbcReportRawRow {
	store_name: string | null
	sku: string
	total_revenue: number
	qty_sales: number
	qty_units: number
}

export interface StockTotalRow {
	sku: string
	stock_qty: number
}

export interface Units90dRow {
	store_name: string | null
	sku: string
	units_90d: number
}

export interface AbcReportRepository {
	fetchAbcReport(startDate: Date, endDate: Date): Promise<AbcReportRawRow[]>
	fetchStockTotals(): Promise<StockTotalRow[]>
	fetchUnits90dByStore(): Promise<Units90dRow[]>
}

export interface RestockAlertProductRow {
	product_id: string
	sku: string
	brand_name: string | null
	physical_stock_qty: number
}

export interface RestockAlertSalesRow {
	product_id: string
	units_15d: number
	units_30d: number
}

export interface RestockAlertRepository {
	fetchRestockAlertProducts(): Promise<RestockAlertProductRow[]>
	fetchRestockAlertSalesPace(): Promise<RestockAlertSalesRow[]>
}

export type Marketplace = "mercado_livre" | "amazon" | "shopee"

/** Um deposito full de um produto, com o que esta disponivel para venda la. */
export interface FullStockRow {
	product_id: string
	sku: string
	brand_name: string | null
	stock_id: string
	stock_title: string
	marketplace: Marketplace
	qtde: number
}

/**
 * Saida de um deposito full na janela, junto do numero de dias em que aquele
 * deposito de fato tinha estoque — o denominador do Ritmo de Saida.
 */
export interface FullStockDemandRow {
	stock_id: string
	units_window: number
	days_with_stock: number
}

/** Um deposito fisico do produto — uma origem possivel de envio. */
export interface PhysicalDepositRow {
	stock_id: string
	stock_title: string
	qtde: number
}

/**
 * Suprimento fisico do produto: fonte do abastecimento e base da reserva.
 *
 * Todos os depositos proprios entram, nao so o maior: um envio pode ter itens
 * saindo de origens diferentes, entao o que pode ser abastecido e a soma — a
 * mesma leitura de Estoque Fisico que o Alerta de Reposicao usa.
 */
export interface PhysicalSupplyRow {
	product_id: string
	/** Unidades vendidas direto do fisico na janela. Base da reserva. */
	units_window: number
	deposits: PhysicalDepositRow[]
}

/** Unidades ja comprometidas com um deposito full (rascunho ou em transito). */
export interface InTransitRow {
	destination_stock_id: string
	quantity: number
}

/**
 * Unidades presas num envio em rascunho: ja prometidas a um destino, mas ainda
 * contadas no saldo da origem, porque o rascunho nao debita estoque.
 */
export interface DraftedSourceRow {
	source_stock_id: string
	quantity: number
}

export interface FullReplenishmentRepository {
	fetchFullStocks(): Promise<FullStockRow[]>
	fetchFullStockDemand(windowDays: number): Promise<FullStockDemandRow[]>
	fetchPhysicalSupply(windowDays: number): Promise<PhysicalSupplyRow[]>
	fetchInTransitQuantities(): Promise<InTransitRow[]>
	fetchDraftedSourceCommitments(): Promise<DraftedSourceRow[]>
}
