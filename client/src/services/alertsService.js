import * as alertsApi from '../api/alerts'

export const getAllAlerts = async (params = {}) => {
  try {
    const response = await alertsApi.getAllAlerts(params)
    return response.data || []
  } catch (error) {
    console.error('Failed to load alerts:', error)
    return []
  }
}

export const getAlertById = async (id) => {
  try {
    const response = await alertsApi.getAlertById(id)
    return response.data || null
  } catch (error) {
    console.error(`Failed to load alert ${id}:`, error)
    return null
  }
}

export const saveAlert = async (alertData) => {
  try {
    let response
    if (alertData.id) {
      response = await alertsApi.updateAlert(alertData.id, alertData)
    } else {
      response = await alertsApi.createAlert(alertData)
    }
    return response.data
  } catch (error) {
    console.error('Failed to save alert:', error)
    throw error
  }
}

export const deleteAlert = async (id) => {
  try {
    const response = await alertsApi.deleteAlert(id)
    return response.data
  } catch (error) {
    console.error(`Failed to delete alert ${id}:`, error)
    throw error
  }
}

export const markAlertAsRead = async (id) => {
  try {
    const response = await alertsApi.markAlertAsRead(id)
    return response.data
  } catch (error) {
    console.error(`Failed to mark alert ${id} as read:`, error)
    throw error
  }
}

export const getUnreadAlerts = async () => {
  try {
    const response = await alertsApi.getUnreadAlerts()
    return response.data || []
  } catch (error) {
    console.error('Failed to load unread alerts:', error)
    return []
  }
}
