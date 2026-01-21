import client from './client'

export const getSettings = async () => {
  const response = await client.get('/settings')
  return response.data
}

export const getSettingByKey = async (key) => {
  const response = await client.get(`/settings/${key}`)
  return response.data
}

export const updateSetting = async (key, value) => {
  const response = await client.put(`/settings/${key}`, { value })
  return response.data
}

export const updateSettings = async (settings) => {
  const response = await client.put('/settings', settings)
  return response.data
}

export const getUserSettings = async () => {
  const response = await client.get('/settings/user')
  return response.data
}

export const updateUserSettings = async (settings) => {
  const response = await client.put('/settings/user', settings)
  return response.data
}

export const resetSettings = async () => {
  const response = await client.post('/settings/reset')
  return response.data
}
