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
	/** Conta dona do deposito. Nulo enquanto ninguem tiver associado. */
	store_id: string | null
	store_name: string | null
}

/**
 * Quanto uma conta vendeu de um produto num canal, somando todos os depositos
 * que despacharam — inclusive o galpao.
 *
 * E a demanda que o full daquela conta enfrentaria se estivesse abastecido. O
 * numero por deposito (`FullStockDemandRow`) nao serve para isso: um full vazio
 * vende zero por nao ter o que vender, nao por falta de procura.
 */
export interface AccountChannelDemandRow {
	product_id: string
	sku: string
	brand_name: string | null
	store_id: string
	store_name: string
	marketplace: Marketplace
	/** Unidades na janela longa — a base. */
	units_long: number
	/** Unidades na janela curta — o que denuncia aceleracao. */
	units_short: number
}

/** Uma conta que ja opera full num canal, com o padrao de titulo que ela usa. */
export interface AccountChannelRow {
	store_id: string
	store_name: string
	marketplace: Marketplace
	/** Titulo de um full existente da conta, base para nomear um novo. */
	sample_stock_title: string
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
	/**
	 * Unidades vendidas pelo canal Direto na janela, saindo de deposito proprio.
	 * Base da reserva — venda de marketplace despachada do galpao nao entra, ver
	 * `fetchPhysicalSupply`.
	 */
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
	fetchAccountChannelDemand(
		longDays: number,
		shortDays: number,
	): Promise<AccountChannelDemandRow[]>
	fetchAccountsOperatingFull(): Promise<AccountChannelRow[]>
	fetchPhysicalSupply(windowDays: number): Promise<PhysicalSupplyRow[]>
	fetchInTransitQuantities(): Promise<InTransitRow[]>
	fetchDraftedSourceCommitments(): Promise<DraftedSourceRow[]>
}
