import client from './client'

export const getMasterDataByType = async (type, { companyId, status } = {}) => {
  const params = new URLSearchParams()
  params.set('type', type)
  if (companyId) params.set('companyId', companyId)
  if (status) params.set('status', status)
  const response = await client.get(`/master-data?${params.toString()}`)
  return response.data?.data || response.data || []
}

export const getMasterDataById = async (type, id) => {
  const response = await client.get(`/master-data/${type}/${id}`)
  return response.data
}

export const getLatestMasterDataByType = async (type, { companyId, status } = {}) => {
  const params = new URLSearchParams()
  params.set('type', type)
  if (companyId) params.set('companyId', companyId)
  if (status) params.set('status', status)
  const response = await client.get(`/master-data/latest?${params.toString()}`)
  return response.data?.data || null
}

export const saveMasterDataRecord = async (type, recordData) => {
  const response = await client.post(`/master-data/${type}`, recordData)
  return response.data
}

export const upsertMasterDataRecord = async (type, recordData) => {
  const response = await client.post(`/master-data/${type}/upsert`, recordData)
  
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

export const getDraftMasterData = async ({ companyId } = {}) => {
  const params = new URLSearchParams()
  if (companyId) params.set('companyId', companyId)
  const response = await client.get(`/master-data/draft?${params.toString()}`)
  return response.data
}

export const createDraftFromPublished = async (companyId) => {
  const response = await client.post('/master-data/draft/from-published', { companyId })
  return response.data
}

export const publishDraftMasterData = async (draftCompanyId) => {
  const response = await client.post('/master-data/draft/publish', { draftCompanyId })
  return response.data
}

export const isStepLocked = async (type) => {
  try {
    const response = await client.get(`/master-data/latest?type=${type}`)
    return !!(response.data?.data)
  } catch (error) {
    console.warn(`[MasterData] Failed to check lock status for ${type}:`, error)
    return false
  }
}

export const getAllStepsLockedStatus = async () => {
  const FORM_TYPES = ['company-profile', 'customer-profile', 'consignee-profile', 'payer-profile', 'employee-profile', 'payment-terms']
  
  try {
    const statusPromises = FORM_TYPES.map(async (type) => {
      const isLocked = await isStepLocked(type)
      return [type, isLocked]
    })
    
    const results = await Promise.allSettled(statusPromises)
    const statusMap = {}
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const [type, locked] = result.value
        statusMap[type] = locked
      } else {
        statusMap[FORM_TYPES[index]] = false
      }
    })
    
    return statusMap
  } catch (error) {
    console.error('[MasterData] Failed to check all steps lock status:', error)
    return FORM_TYPES.reduce((acc, type) => {
      acc[type] = false
      return acc
    }, {})
  }
}
