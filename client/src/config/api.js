
export const getApiBaseUrl = () => {
  let baseUrl = import.meta.env.VITE_API_BASE_URL || ''
  baseUrl = baseUrl.replace(/\/$/, '')
  
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
  
  if (baseUrl && baseUrl.includes('localhost') && baseUrl.startsWith('https://')) {
    console.warn(
      '⚠️ HTTPS detected for localhost in development. Converting to HTTP.',
      'Original:', baseUrl, '→ Fixed:', baseUrl.replace('https://', 'http://')
    )
    baseUrl = baseUrl.replace('https://', 'http://')
  }
  
  return baseUrl || 'http://localhost:4000'
}

export const getApiUrl = () => {
  return `${getApiBaseUrl()}/api/v1`
}

export const API_BASE_URL = getApiBaseUrl()
export const API_URL = getApiUrl()

