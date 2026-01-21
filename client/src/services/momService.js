import * as momApi from '../api/mom'

export const getAllMoMs = async (params = {}) => {
  try {
    const response = await momApi.getAllMoMs(params)
    return response.data || []
  } catch (error) {
    console.error('Failed to load MoMs:', error)
    return []
  }
}

export const getMoMById = async (id) => {
  try {
    const response = await momApi.getMoMById(id)
    return response.data || null
  } catch (error) {
    console.error(`Failed to load MoM ${id}:`, error)
    return null
  }
}

export const saveMoM = async (momData) => {
  try {
    let response
    if (momData.id) {
      response = await momApi.updateMoM(momData.id, momData)
    } else {
      response = await momApi.createMoM(momData)
    }
    return response.data
  } catch (error) {
    console.error('Failed to save MoM:', error)
    throw error
  }
}

export const getMoMsByUser = async (userId) => {
  try {
    const response = await momApi.getMoMsByUser(userId)
    return response.data || []
  } catch (error) {
    console.error(`Failed to load MoMs for user ${userId}:`, error)
    return []
  }
}
