import client from './client'

export const getSettings = async () => {
  const response = await client.get('/settings')
  return response.data
}

export const getSystemSettings = async () => {
  const response = await client.get('/settings/system')
  return response.data
}

export const updateSettings = async (settings) => {
  const response = await client.put('/settings', settings)
  return response.data
}

export const resetSettings = async (keys = null) => {
  const response = await client.post('/settings/reset', keys ? { keys } : {})
  return response.data
}

export const getAuditLog = async (key = null, limit = 50) => {
  const params = new URLSearchParams({ limit: limit.toString() })
  if (key) params.append('key', key)
  const response = await client.get(`/settings/audit?${params.toString()}`)
  return response.data
}

export const checkFinancialYearChange = async (financialYear) => {
  const response = await client.get(`/settings/check-financial-year?financialYear=${encodeURIComponent(financialYear)}`)
  return response.data
}
