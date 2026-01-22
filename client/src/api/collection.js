import client from './client'

export const getAllCollectionPlans = async (params = {}) => {
  const query = new URLSearchParams(params).toString()
  const response = await client.get(`/collections?${query}`)
  return response.data
}

export const getCollectionPlanById = async (id) => {
  const response = await client.get(`/collections/${id}`)
  return response.data
}

export const createCollectionPlan = async (planData) => {
  const response = await client.post('/collections', planData)
  return response.data
}

export const updateCollectionPlan = async (id, planData) => {
  const response = await client.put(`/collections/${id}`, planData)
  return response.data
}

export const deleteCollectionPlan = async (id) => {
  const response = await client.delete(`/collections/${id}`)
  return response.data
}

export const getCollectionPlanData = async (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.personId) params.append('personId', filters.personId)
  if (filters.businessUnit) params.append('businessUnit', filters.businessUnit)
  if (filters.month) {
    const monthStr = filters.month instanceof Date 
      ? `${filters.month.getFullYear()}-${String(filters.month.getMonth() + 1).padStart(2, '0')}`
      : filters.month
    params.append('month', monthStr)
  }
  const response = await client.get(`/collections/data?${params.toString()}`)
  return response.data
}

export const getCollectionAnalytics = async (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.personId) params.append('personId', filters.personId)
  if (filters.businessUnit) params.append('businessUnit', filters.businessUnit)
  if (filters.month) {
    const monthStr = filters.month instanceof Date 
      ? `${filters.month.getFullYear()}-${String(filters.month.getMonth() + 1).padStart(2, '0')}`
      : filters.month
    params.append('month', monthStr)
  }
  const response = await client.get(`/collections/analytics?${params.toString()}`)
  return response.data
}

export const calculateCustomerReceivables = async (customerId, businessUnit, month) => {
  const params = new URLSearchParams()
  params.append('customerId', customerId)
  if (businessUnit) params.append('businessUnit', businessUnit)
  if (month) params.append('month', month)
  const response = await client.get(`/collections/receivables?${params}`)
  return response.data
}
