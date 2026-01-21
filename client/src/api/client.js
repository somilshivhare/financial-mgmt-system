import axios from 'axios'

// Default to backend v1 API; override with VITE_API_URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1'

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default client
