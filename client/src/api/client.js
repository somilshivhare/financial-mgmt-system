import axios from 'axios'
import { getApiUrl } from '../config/api'

// Get full API URL with /api/v1 path
const API_BASE_URL = getApiUrl()

// Log API base URL in development for debugging
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
  // Don't set Content-Type for FormData - let browser set it with boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  return config
})

// Add response interceptor for error handling
client.interceptors.response.use(
  (response) => {
    // Validate response data is valid JSON/object
    if (response.data && typeof response.data === 'string') {
      // Try to parse if it's a string
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
    // Handle network errors first (no response = can't use server message)
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

    // Handle HTTP errors
    const status = error.response?.status
    let data = error.response?.data
    
    // Handle invalid JSON in error response
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
