import client from './client'

export const getAllPOs = async (params = {}) => {
  const q = { ...params, _: Date.now() }
  const query = new URLSearchParams(q).toString()
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

export const getPODraft = async (id = null) => {
  const url = id ? `/pos/${id}/draft` : '/pos/draft'
  const response = await client.get(url)
  if (response.data?.data) {
    return response.data.data
  }
  return null
}

export const upsertPODraft = async (formData, id = null) => {
  const url = id ? `/pos/${id}/draft` : '/pos/draft'
  const response = await client.post(url, formData)
  if (response.data?.data) {
    return { id: response.data.data.id, ...response.data.data }
  }
  return null
}
