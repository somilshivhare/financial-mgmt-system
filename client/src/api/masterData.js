import client from './client'

export const getMasterDataByType = async (type) => {
  const response = await client.get(`/master-data?type=${type}`)
  // Extract the data array from the API response
  return response.data?.data || response.data || []
}

export const getMasterDataById = async (type, id) => {
  const response = await client.get(`/master-data/${type}/${id}`)
  return response.data
}

export const getLatestMasterDataByType = async (type) => {
  const response = await client.get(`/master-data/latest?type=${type}`)
  if (response.data?.data) {
    return response.data.data.values || {}
  }
  return null
}

export const saveMasterDataRecord = async (type, recordData) => {
  const response = await client.post(`/master-data/${type}`, recordData)
  return response.data
}

export const upsertMasterDataRecord = async (type, recordData) => {
  const response = await client.post(`/master-data/${type}/upsert`, recordData)
  
  // Trigger refresh event for Master Data Records page
  if (response.data?.data) {
    window.dispatchEvent(new CustomEvent('masterDataUpdated', { 
      detail: { type, record: response.data.data } 
    }))
    return { id: response.data.data.id, values: response.data.data.values || {} }
  }
  return null
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

export const getAggregatedMasterData = async () => {
  const response = await client.get('/master-data/aggregated')
  return response.data
}
