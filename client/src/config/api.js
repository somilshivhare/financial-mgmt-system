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
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
  // Remove trailing slash if present
  return baseUrl.replace(/\/$/, '')
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

