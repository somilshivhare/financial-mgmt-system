import client from './client'

export const getNotifications = async (params = {}) => {
  const query = new URLSearchParams(params).toString()
  const response = await client.get(`/notifications?${query}`)
  return response.data
}

export const getUnreadCount = async () => {
  const response = await client.get('/notifications/unread/count')
  return response.data
}

export const markAsRead = async (id) => {
  const response = await client.patch(`/notifications/${id}/read`)
  return response.data
}

export const markAllAsRead = async () => {
  const response = await client.patch('/notifications/read/all')
  return response.data
}

export const dismissNotification = async (id) => {
  const response = await client.patch(`/notifications/${id}/dismiss`)
  return response.data
}

export const getPreferences = async () => {
  const response = await client.get('/notifications/preferences')
  return response.data
}

export const updatePreference = async (notificationType, enabled, emailEnabled = false) => {
  const response = await client.patch('/notifications/preferences', {
    notificationType,
    enabled,
    emailEnabled,
  })
  return response.data
}

