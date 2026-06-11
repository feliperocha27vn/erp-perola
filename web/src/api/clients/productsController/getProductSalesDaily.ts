import fetch from "@/lib/kubb-axios-client"
import type { Client, RequestConfig, ResponseErrorConfig } from "@/lib/kubb-axios-client"
import type {
  GetProductSalesDailyPathParams,
  GetProductSalesDailyQueryResponse,
} from "../../types/productsController/GetProductSalesDaily.ts"

export async function getProductSalesDaily(
  id: GetProductSalesDailyPathParams["id"],
  config: Partial<RequestConfig> & { client?: Client } = {},
) {
  const { client: request = fetch, ...requestConfig } = config
  const res = await request<
    GetProductSalesDailyQueryResponse,
    ResponseErrorConfig<Error>,
    unknown
  >({
    method: "GET",
    url: `/products/${id}/sales-daily`,
    ...requestConfig,
  })
  return res.data
}
