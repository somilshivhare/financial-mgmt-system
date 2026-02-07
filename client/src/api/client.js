import axios from 'axios'
import { getApiUrl } from '../config/api'

const API_BASE_URL = getApiUrl()

if (import.meta.env.DEV) {
  console.log(`[API Client] Using base URL: ${API_BASE_URL}`)
}

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  return config
})

client.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'string') {
      try {
        response.data = JSON.parse(response.data)
      } catch (e) {
        if (import.meta.env.DEV) console.error('[API Client] Invalid JSON response:', response.data)
        return Promise.reject({
          message: 'Invalid server response format',
          code: 'ERR_INVALID_RESPONSE',
          status: response.status,
        })
      }
    }
    return response
  },
  (error) => {
    if (error.code === 'ERR_NETWORK' || !error.response) {
      if (import.meta.env.DEV) {
        console.error('Network error:', error.message)
        console.error('Request URL:', error.config?.url)
        console.error('Base URL:', API_BASE_URL)
      }
      return Promise.reject({
        message: 'Network error: Unable to connect to server. Please check your connection.',
        code: 'NETWORK_ERROR',
        isNetworkError: true,
        originalError: import.meta.env.DEV ? error.message : undefined,
      })
    }

    const status = error.response?.status
    let data = error.response?.data
    
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data)
      } catch (e) {
        if (import.meta.env.DEV) console.error('[API Client] Invalid JSON in error response:', data)
        data = {
          message: 'Server returned an invalid response',
          code: 'ERR_INVALID_RESPONSE',
        }
      }
    }

    if (status === 401) {
      const isLoginRequest = error.config?.url?.includes('/auth/login')
      if (isLoginRequest) {
        return Promise.reject({
          message: data?.message || 'Invalid email or password. Please check your credentials and try again.',
          code: data?.code || 'ERR_INVALID_CREDENTIALS',
          status,
        })
      }
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
      const safeMessage = data?.message || (import.meta.env.DEV
        ? `API endpoint not found: ${error.config?.url || 'Unknown'}. Please check if the server is running and the endpoint exists.`
        : 'The requested resource was not found.')
      return Promise.reject({
        message: safeMessage,
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

    if (status === 413) {
      return Promise.reject({
        message: data?.message || 'Request too large. Try removing or resizing logos/images, or contact your administrator to increase server limits.',
        code: data?.code || 'ERR_PAYLOAD_TOO_LARGE',
        status,
        isPayloadTooLarge: true,
      })
    }

    return Promise.reject({
      message: data?.message || error.message || 'An error occurred',
      code: data?.code || 'ERR_UNKNOWN',
      status,
      data: data?.data,
    })
  }
)

export default client
