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
  // Don't set Content-Type for FormData - let browser set it with boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  return config
})

// Add response interceptor for error handling
client.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors
    if (error.code === 'ERR_NETWORK' || !error.response) {
      console.error('Network error:', error.message)
      return Promise.reject({
        message: 'Network error: Unable to connect to server. Please check your connection.',
        code: 'NETWORK_ERROR',
        isNetworkError: true,
      })
    }

    // Handle HTTP errors
    const status = error.response?.status
    const data = error.response?.data

    if (status === 401) {
      // Unauthorized - token might be invalid
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      return Promise.reject({
        message: 'Session expired. Please log in again.',
        code: 'UNAUTHORIZED',
        status,
      })
    }

    if (status === 403) {
      return Promise.reject({
        message: data?.message || 'Access forbidden',
        code: data?.code || 'FORBIDDEN',
        status,
      })
    }

    if (status === 404) {
      return Promise.reject({
        message: data?.message || `API endpoint not found: ${error.config?.url || 'Unknown'}. Please check if the server is running and the endpoint exists.`,
        code: data?.code || 'NOT_FOUND',
        status,
        isNotFound: true,
      })
    }

    if (status === 429) {
      return Promise.reject({
        message: data?.message || 'Too many requests. Please wait a moment and try again.',
        code: data?.code || 'RATE_LIMIT_EXCEEDED',
        status,
        isRateLimit: true,
        retryAfter: data?.retryAfter,
        response: error.response, // Include full response for structured error handling
      })
    }

    // Return the error response data if available
    return Promise.reject({
      message: data?.message || error.message || 'An error occurred',
      code: data?.code || 'ERR_UNKNOWN',
      status,
      data: data?.data,
    })
  }
)

export default client
