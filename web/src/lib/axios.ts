import axios from 'axios'

export const apiLocal = axios.create({
	baseURL: import.meta.env.VITE_API_URL,
	withCredentials: true,
})

apiLocal.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			window.location.href = '/login'
		}
		return Promise.reject(error)
	},
)
