import client from './client'

export const getKPIs = async (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.append('dateTo', filters.dateTo)
  const response = await client.get(`/reports/kpis?${params.toString()}`)
  return response.data
}

export const getSalesReport = async (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.append('dateTo', filters.dateTo)
  if (filters.customerId) params.append('customerId', filters.customerId)
  if (filters.businessUnitId) params.append('businessUnitId', filters.businessUnitId)
  if (filters.segmentId) params.append('segmentId', filters.segmentId)
  if (filters.regionId) params.append('regionId', filters.regionId)
  if (filters.userId) params.append('userId', filters.userId)
  if (filters.status) params.append('status', filters.status)
  const response = await client.get(`/reports/sales?${params.toString()}`)
  return response.data
}

export const getPOReport = async (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.append('dateTo', filters.dateTo)
  if (filters.customerId) params.append('customerId', filters.customerId)
  if (filters.businessUnitId) params.append('businessUnitId', filters.businessUnitId)
  if (filters.segmentId) params.append('segmentId', filters.segmentId)
  if (filters.regionId) params.append('regionId', filters.regionId)
  if (filters.userId) params.append('userId', filters.userId)
  if (filters.status) params.append('status', filters.status)
  const response = await client.get(`/reports/purchase-orders?${params.toString()}`)
  return response.data
}

export const getInvoiceReport = async (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.append('dateTo', filters.dateTo)
  if (filters.customerId) params.append('customerId', filters.customerId)
  if (filters.businessUnitId) params.append('businessUnitId', filters.businessUnitId)
  if (filters.segmentId) params.append('segmentId', filters.segmentId)
  if (filters.regionId) params.append('regionId', filters.regionId)
  if (filters.userId) params.append('userId', filters.userId)
  if (filters.status) params.append('status', filters.status)
  const response = await client.get(`/reports/invoices?${params.toString()}`)
  return response.data
}

export const getPaymentReport = async (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.append('dateTo', filters.dateTo)
  if (filters.customerId) params.append('customerId', filters.customerId)
  if (filters.businessUnitId) params.append('businessUnitId', filters.businessUnitId)
  if (filters.segmentId) params.append('segmentId', filters.segmentId)
  if (filters.regionId) params.append('regionId', filters.regionId)
  if (filters.userId) params.append('userId', filters.userId)
  if (filters.status) params.append('status', filters.status)
  const response = await client.get(`/reports/payments?${params.toString()}`)
  return response.data
}

export const getCollectionReport = async (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.append('dateTo', filters.dateTo)
  if (filters.customerId) params.append('customerId', filters.customerId)
  if (filters.businessUnitId) params.append('businessUnitId', filters.businessUnitId)
  if (filters.segmentId) params.append('segmentId', filters.segmentId)
  if (filters.regionId) params.append('regionId', filters.regionId)
  if (filters.userId) params.append('userId', filters.userId)
  if (filters.status) params.append('status', filters.status)
  const response = await client.get(`/reports/collections?${params.toString()}`)
  return response.data
}

export const getOutstandingReport = async (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.append('dateTo', filters.dateTo)
  if (filters.customerId) params.append('customerId', filters.customerId)
  if (filters.businessUnitId) params.append('businessUnitId', filters.businessUnitId)
  if (filters.segmentId) params.append('segmentId', filters.segmentId)
  if (filters.regionId) params.append('regionId', filters.regionId)
  if (filters.userId) params.append('userId', filters.userId)
  const response = await client.get(`/reports/outstanding?${params.toString()}`)
  return response.data
}

export const getCustomerWiseReport = async (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.append('dateTo', filters.dateTo)
  if (filters.customerId) params.append('customerId', filters.customerId)
  if (filters.businessUnitId) params.append('businessUnitId', filters.businessUnitId)
  if (filters.segmentId) params.append('segmentId', filters.segmentId)
  if (filters.regionId) params.append('regionId', filters.regionId)
  if (filters.userId) params.append('userId', filters.userId)
  const response = await client.get(`/reports/customers?${params.toString()}`)
  return response.data
}

export const getProjectWiseReport = async (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.append('dateTo', filters.dateTo)
  if (filters.customerId) params.append('customerId', filters.customerId)
  if (filters.businessUnitId) params.append('businessUnitId', filters.businessUnitId)
  if (filters.segmentId) params.append('segmentId', filters.segmentId)
  if (filters.regionId) params.append('regionId', filters.regionId)
  if (filters.userId) params.append('userId', filters.userId)
  const response = await client.get(`/reports/projects?${params.toString()}`)
  return response.data
}

export const getAgingReport = async (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.append('dateTo', filters.dateTo)
  if (filters.customerId) params.append('customerId', filters.customerId)
  if (filters.businessUnitId) params.append('businessUnitId', filters.businessUnitId)
  if (filters.segmentId) params.append('segmentId', filters.segmentId)
  if (filters.regionId) params.append('regionId', filters.regionId)
  if (filters.userId) params.append('userId', filters.userId)
  const response = await client.get(`/reports/aging?${params.toString()}`)
  return response.data
}

export const getTaxGSTReport = async (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.append('dateTo', filters.dateTo)
  if (filters.customerId) params.append('customerId', filters.customerId)
  if (filters.businessUnitId) params.append('businessUnitId', filters.businessUnitId)
  if (filters.segmentId) params.append('segmentId', filters.segmentId)
  if (filters.regionId) params.append('regionId', filters.regionId)
  if (filters.userId) params.append('userId', filters.userId)
  const response = await client.get(`/reports/tax-gst?${params.toString()}`)
  return response.data
}

export const getCommissionReport = async (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.append('dateTo', filters.dateTo)
  if (filters.customerId) params.append('customerId', filters.customerId)
  if (filters.businessUnitId) params.append('businessUnitId', filters.businessUnitId)
  if (filters.segmentId) params.append('segmentId', filters.segmentId)
  if (filters.regionId) params.append('regionId', filters.regionId)
  if (filters.userId) params.append('userId', filters.userId)
  const response = await client.get(`/reports/commissions?${params.toString()}`)
  return response.data
}

export const getReconciliationReport = async (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.append('dateTo', filters.dateTo)
  if (filters.customerId) params.append('customerId', filters.customerId)
  if (filters.businessUnitId) params.append('businessUnitId', filters.businessUnitId)
  if (filters.segmentId) params.append('segmentId', filters.segmentId)
  if (filters.regionId) params.append('regionId', filters.regionId)
  if (filters.userId) params.append('userId', filters.userId)
  if (filters.status) params.append('status', filters.status)
  const response = await client.get(`/reports/reconciliation?${params.toString()}`)
  return response.data
}

export const getAuditLogReport = async (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.append('dateTo', filters.dateTo)
  if (filters.userId) params.append('userId', filters.userId)
  if (filters.actionType) params.append('actionType', filters.actionType)
  const response = await client.get(`/reports/audit-log?${params.toString()}`)
  return response.data
}

