import client from './client'

export const getAllMoMs = async (params = {}) => {
  const query = new URLSearchParams(params).toString()
  const response = await client.get(`/mom?${query}`)
  return response.data
}

export const getMoMById = async (id) => {
  const response = await client.get(`/mom/${id}`)
  return response.data
}

export const createMoM = async (momData) => {
  const response = await client.post('/mom', momData)
  return response.data
}

export const updateMoM = async (id, momData) => {
  const response = await client.put(`/mom/${id}`, momData)
  return response.data
}

export const deleteMoM = async (id) => {
  const response = await client.delete(`/mom/${id}`)
  return response.data
}

export const getMoMsByUser = async (userId) => {
  const response = await client.get(`/mom/user/${userId}`)
  return response.data
}

export const getMoMsByDate = async (date) => {
  const response = await client.get(`/mom/date/${date}`)
  return response.data
}
