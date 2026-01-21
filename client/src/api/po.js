import client from './client'

export const getAllPOs = async (params = {}) => {
  const query = new URLSearchParams(params).toString()
  const response = await client.get(`/pos?${query}`)
  return response.data
}

export const getPOById = async (id) => {
  const response = await client.get(`/pos/${id}`)
  return response.data
}

export const getPOByPONumber = async (poNumber) => {
  const response = await client.get(`/pos/po/${poNumber}`)
  return response.data
}

export const createPO = async (poData) => {
  const response = await client.post('/pos', poData)
  return response.data
}

export const updatePO = async (id, poData) => {
  const response = await client.put(`/pos/${id}`, poData)
  return response.data
}

export const deletePO = async (id) => {
  const response = await client.delete(`/pos/${id}`)
  return response.data
}

export const getAllPONumbers = async () => {
  const response = await client.get('/pos/numbers')
  return response.data
}
