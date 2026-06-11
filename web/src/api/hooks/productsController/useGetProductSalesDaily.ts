import type { QueryKey, QueryObserverOptions, UseQueryResult } from "@tanstack/react-query"
import { queryOptions, useQuery } from "@tanstack/react-query"
import { getProductSalesDaily } from "../../clients/productsController/getProductSalesDaily.ts"
import type { GetProductSalesDailyQueryResponse } from "../../types/productsController/GetProductSalesDaily.ts"

export const getProductSalesDailyQueryKey = (id: string) =>
  [{ url: `/products/${id}/sales-daily`, id }] as const

export type GetProductSalesDailyQueryKey = ReturnType<typeof getProductSalesDailyQueryKey>

export function getProductSalesDailyQueryOptions(id: string) {
  const queryKey = getProductSalesDailyQueryKey(id)
  return queryOptions<
    GetProductSalesDailyQueryResponse,
    Error,
    GetProductSalesDailyQueryResponse,
    typeof queryKey
  >({
    queryKey,
    queryFn: ({ signal }) => getProductSalesDaily(id, { signal }),
    enabled: !!id,
  })
}

export function useGetProductSalesDaily<
  TData = GetProductSalesDailyQueryResponse,
  TQueryKey extends QueryKey = GetProductSalesDailyQueryKey,
>(
  id: string,
  options: Partial<QueryObserverOptions<GetProductSalesDailyQueryResponse, Error, TData, GetProductSalesDailyQueryResponse, TQueryKey>> = {},
): UseQueryResult<TData, Error> & { queryKey: TQueryKey } {
  const queryKey = (options.queryKey ?? getProductSalesDailyQueryKey(id)) as TQueryKey

  const query = useQuery({
    ...getProductSalesDailyQueryOptions(id),
    ...options,
    queryKey,
  } as QueryObserverOptions) as UseQueryResult<TData, Error> & { queryKey: TQueryKey }

  query.queryKey = queryKey
  return query
}
