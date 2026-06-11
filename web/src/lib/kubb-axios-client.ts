import client, {
	type Client,
	type RequestConfig,
	type ResponseConfig,
	type ResponseErrorConfig,
	setConfig,
	axiosInstance,
} from '@kubb/plugin-client/clients/axios'

setConfig({
	baseURL: import.meta.env.VITE_API_URL,
})

axiosInstance.defaults.withCredentials = true

axiosInstance.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			window.location.href = '/login'
		}
		return Promise.reject(error)
	},
)

export type { Client, RequestConfig, ResponseConfig, ResponseErrorConfig }

export default client