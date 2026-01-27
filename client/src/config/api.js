/**
 * API Configuration Utility
 * 
 * Provides consistent API base URL handling across the application.
 * Uses VITE_API_BASE_URL environment variable with fallback for development.
 */

/**
 * Get the API base URL (without /api/v1 path)
 * This is the backend server URL
 * 
 * @returns {string} Base URL of the backend server
 * @example
 * // Returns: 'http://localhost:4000'
 * // or in production: 'https://api.example.com'
 */
export const getApiBaseUrl = () => {
  let baseUrl = import.meta.env.VITE_API_BASE_URL || ''
  baseUrl = baseUrl.replace(/\/$/, '')
  
  // In production, override localhost with current origin
  // This prevents API calls from failing when localhost is accidentally set
  if (import.meta.env.PROD && typeof window !== 'undefined') {
    if (baseUrl.includes('localhost') || !baseUrl) {
      console.warn(
        '⚠️ API Base URL was set to localhost or empty in production.',
        'Auto-detecting production domain:', window.location.origin
      )
      return window.location.origin
    }
    return baseUrl
  }
  
  // Development: use env var or fallback to localhost
  return baseUrl || 'http://localhost:4000'
}

/**
 * Get the full API URL (with /api/v1 path)
 * Use this for making API requests
 * 
 * @returns {string} Full API URL with /api/v1 path
 * @example
 * // Returns: 'http://localhost:4000/api/v1'
 */
export const getApiUrl = () => {
  return `${getApiBaseUrl()}/api/v1`
}

// Export constants for convenience
export const API_BASE_URL = getApiBaseUrl()
export const API_URL = getApiUrl()

