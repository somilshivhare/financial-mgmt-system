import client from './client'

export const getAllAlerts = async (params = {}) => {
  const query = new URLSearchParams(params).toString()
  const response = await client.get(`/alerts?${query}`)
  return response.data
}

export const getAlertById = async (id) => {
  const response = await client.get(`/alerts/${id}`)
  return response.data
}

export const createAlert = async (alertData) => {
  const response = await client.post('/alerts', alertData)
  return response.data
}

export const updateAlert = async (id, alertData) => {
  const response = await client.put(`/alerts/${id}`, alertData)
  return response.data
}

export const deleteAlert = async (id) => {
  const response = await client.delete(`/alerts/${id}`)
  return response.data
}

export const markAlertAsRead = async (id) => {
  const response = await client.patch(`/alerts/${id}/read`)
  return response.data
}

export const getAlertsByUser = async (userId) => {
  const response = await client.get(`/alerts/user/${userId}`)
  return response.data
}

export const getUnreadAlerts = async () => {
  const response = await client.get('/alerts/unread')
  return response.data
}
