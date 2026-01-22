import client from './client'

/**
 * Get KPIs for Reports Dashboard
 */
export const getKPIs = async (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.append('dateTo', filters.dateTo)
  const response = await client.get(`/reports/kpis?${params.toString()}`)
  return response.data
}

/**
 * Get Sales Report
 */
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

/**
 * Get Purchase Order Report
 */
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

/**
 * Get Invoice Report
 */
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

/**
 * Get Payment Report
 */
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

/**
 * Get Collection Report
 */
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

/**
 * Get Outstanding & Overdue Report
 */
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

/**
 * Get Customer-wise Report
 */
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

/**
 * Get Project-wise Report
 */
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

/**
 * Get Aging Report
 */
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

/**
 * Get Tax & GST Report
 */
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

/**
 * Get Commission Report
 */
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

/**
 * Get Reconciliation Report
 */
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

/**
 * Get Audit Log Report
 */
export const getAuditLogReport = async (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.append('dateTo', filters.dateTo)
  if (filters.userId) params.append('userId', filters.userId)
  if (filters.actionType) params.append('actionType', filters.actionType)
  const response = await client.get(`/reports/audit-log?${params.toString()}`)
  return response.data
}

