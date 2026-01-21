import client from './client'

export const getMasterDataByType = async (type) => {
  const response = await client.get(`/master-data?type=${type}`)
  return response.data
}

export const getMasterDataById = async (type, id) => {
  const response = await client.get(`/master-data/${type}/${id}`)
  return response.data
}

export const saveMasterDataRecord = async (type, recordData) => {
  const response = await client.post(`/master-data/${type}`, recordData)
  return response.data
}

export const updateMasterDataRecord = async (type, id, recordData) => {
  const response = await client.put(`/master-data/${type}/${id}`, recordData)
  return response.data
}

export const deleteMasterDataRecord = async (type, id) => {
  const response = await client.delete(`/master-data/${type}/${id}`)
  return response.data
}

export const searchMasterData = async (query) => {
  const response = await client.get(`/master-data/search?q=${encodeURIComponent(query)}`)
  return response.data
}
