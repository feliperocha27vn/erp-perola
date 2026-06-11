import type { GetBrandsQueryResponse } from '@/api/types/brandsController/GetBrands'
import type { GetProductsQueryResponse } from '@/api/types/productsController/GetProducts'

export type ProductItem = GetProductsQueryResponse['items'][number]

export type ProductStockItem = ProductItem['stocks'][number]

export type BrandItem = GetBrandsQueryResponse['brands'][number]
