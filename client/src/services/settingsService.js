import * as settingsApi from '../api/settings'

export const getSettings = async () => {
  try {
    const response = await settingsApi.getSettings()
    return response.data || {}
  } catch (error) {
    console.error('Failed to load settings:', error)
    return {}
  }
}

export const updateSettings = async (settings) => {
  try {
    const response = await settingsApi.updateSettings(settings)
    return response.data
  } catch (error) {
    console.error('Failed to update settings:', error)
    throw error
  }
}

export const getUserSettings = async () => {
  try {
    const response = await settingsApi.getUserSettings()
    return response.data || {}
  } catch (error) {
    console.error('Failed to load user settings:', error)
    return {}
  }
}

export const updateUserSettings = async (settings) => {
  try {
    const response = await settingsApi.updateUserSettings(settings)
    return response.data
  } catch (error) {
    console.error('Failed to update user settings:', error)
    throw error
  }
}
