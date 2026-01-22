import client from './client'

/**
 * Get all alerts with pagination, search, and filters
 */
export const getAllAlerts = async (params = {}) => {
  const query = new URLSearchParams()
  
  if (params.page) query.append('page', params.page)
  if (params.pageSize) query.append('pageSize', params.pageSize)
  if (params.search) query.append('search', params.search)
  if (params.alertType) query.append('alertType', params.alertType)
  if (params.status) query.append('status', params.status)
  if (params.severity) query.append('severity', params.severity)
  if (params.startDate) query.append('startDate', params.startDate)
  if (params.endDate) query.append('endDate', params.endDate)
  if (params.unreadOnly) query.append('unreadOnly', params.unreadOnly)
  
  const response = await client.get(`/alerts?${query.toString()}`)
  return response.data
}

/**
 * Get unread alerts count
 */
export const getUnreadCount = async () => {
  const response = await client.get('/alerts/unread-count')
  return response.data
}

/**
 * Get alert by ID
 */
export const getAlertById = async (id) => {
  const response = await client.get(`/alerts/${id}`)
  return response.data
}

/**
 * Create alert (admin only)
 */
export const createAlert = async (alertData) => {
  const response = await client.post('/alerts', alertData)
  return response.data
}

/**
 * Mark alert as read
 */
export const markAlertAsRead = async (id) => {
  const response = await client.patch(`/alerts/${id}/read`)
  return response.data
}

/**
 * Mark all alerts as read
 */
export const markAllAlertsAsRead = async () => {
  const response = await client.patch('/alerts/read-all')
  return response.data
}

/**
 * Dismiss alert
 */
export const dismissAlert = async (id) => {
  const response = await client.patch(`/alerts/${id}/dismiss`)
  return response.data
}
