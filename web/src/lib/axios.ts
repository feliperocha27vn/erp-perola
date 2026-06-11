import axios from 'axios'

export const apiLocal = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})
