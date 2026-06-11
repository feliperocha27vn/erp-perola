import type { GetProductsQueryResponse } from '@/api/types/productsController/GetProducts'
import type { GetSalesQueryResponse } from '@/api/types/salesController/GetSales'

export type SaleItem = GetSalesQueryResponse['items'][number]
export type ProductItem = GetProductsQueryResponse['items'][number]
export type ProductStockItem = ProductItem['stocks'][number]

export type SaleFormValues = {
  product_id: string
  stock_id: string
  store_id: string
  channel: 'Amazon' | 'Mercado Livre' | 'Shopee'
  quantity: string
  sale_price: string
  sale_date: string
}
