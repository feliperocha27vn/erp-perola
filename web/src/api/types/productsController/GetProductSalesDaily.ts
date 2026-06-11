export type GetProductSalesDailyPathParams = {
  id: string
}

export type SalesDailyEntry = {
  date: string
  units: number
}

export type SalesDailyPeriod = {
  period: 15 | 30 | 60 | 90
  total_units: number
  days: SalesDailyEntry[]
}

export type SalesDailyStore = {
  store_id: string | null
  store_name: string
  periods: SalesDailyPeriod[]
}

export type GetProductSalesDaily200 = {
  stores: SalesDailyStore[]
}

export type GetProductSalesDailyQueryResponse = GetProductSalesDaily200

export type GetProductSalesDailyQuery = {
  Response: GetProductSalesDaily200
  PathParams: GetProductSalesDailyPathParams
  Errors: unknown
}
