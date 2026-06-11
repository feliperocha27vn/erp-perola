import { apiLocal } from '../axios'

export interface Product {
  id: string
  sku: string
  ean: string
  brand_id: string | null
  brand: {
    id: string
    name: string
    created_at: string
    updated_at: string
  } | null
  url_image: string | null
  created_at: string
  updated_at: string
}

export interface UpdateProductImageRequest {
  url_image: string
}

/**
 * Fetch all products from the database API
 */
export async function fetchAllProducts(): Promise<Product[]> {
  const { data } = await apiLocal.get<Product[]>('/products')
  return data
}

/**
 * Update product image URL
 */
export async function updateProductImage(
  productId: string,
  request: UpdateProductImageRequest
): Promise<Product> {
  const { data } = await apiLocal.patch<Product>(
    `/products/${productId}/image`,
    request
  )
  return data
}
