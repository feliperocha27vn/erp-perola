import client, {
  type Client,
  type RequestConfig,
  type ResponseConfig,
  type ResponseErrorConfig,
  setConfig,
} from '@kubb/plugin-client/clients/axios'

setConfig({
  baseURL: import.meta.env.VITE_API_URL,
})

export type { Client, RequestConfig, ResponseConfig, ResponseErrorConfig }

export default client
