import client from './client'

export const getAllPayments = async (params = {}) => {
  const query = new URLSearchParams(params).toString()
  const response = await client.get(`/payments?${query}`)
  return response.data
}

export const getPaymentById = async (id) => {
  const response = await client.get(`/payments/${id}`)
  return response.data
}

export const getPaymentsByInvoice = async (invoiceId) => {
  const response = await client.get(`/payments/invoice/${invoiceId}`)
  return response.data
}

export const getPaymentsByCustomer = async (customerId) => {
  const response = await client.get(`/payments/customer/${customerId}`)
  return response.data
}

export const createPayment = async (paymentData) => {
  const response = await client.post('/payments', paymentData)
  return response.data
}

export const updatePayment = async (id, paymentData) => {
  const response = await client.put(`/payments/${id}`, paymentData)
  return response.data
}

export const deletePayment = async (id) => {
  const response = await client.delete(`/payments/${id}`)
  return response.data
}

export const getOpenInvoicesForCustomer = async (customerId, customerName = null) => {
  if (!customerId) {
    console.error('[PaymentAPI] customerId is required but was:', customerId)
    throw new Error('Customer ID is required')
  }
  
  // Ensure customerId is a string and properly encoded
  const safeCustomerId = String(customerId).trim()
  if (!safeCustomerId) {
    throw new Error('Customer ID cannot be empty')
  }
  
  // Properly encode the customerId in the URL path
  const encodedCustomerId = encodeURIComponent(safeCustomerId)
  
  // Build query parameters for customerName
  const params = new URLSearchParams()
  if (customerName && String(customerName).trim()) {
    params.append('customerName', String(customerName).trim())
  }
  const queryString = params.toString()
  
  // Construct the full URL
  const url = `/payments/open-invoices/${encodedCustomerId}${queryString ? '?' + queryString : ''}`
  
  console.log('[PaymentAPI] Fetching invoices:', {
    originalCustomerId: customerId,
    encodedCustomerId,
    customerName,
    url,
    fullUrl: `${client.defaults.baseURL || ''}${url}`
  })
  
  try {
    const response = await client.get(url)
    console.log('[PaymentAPI] Successfully fetched invoices:', response.data?.data?.length || 0)
    return response.data
  } catch (error) {
    console.error('[PaymentAPI] Error fetching invoices:', {
      url,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    })
    throw error
  }
}

export const calculatePaymentBreakdown = async (invoiceData, paymentAmount, charges) => {
  const response = await client.post('/payments/calculate-breakdown', {
    invoiceData,
    paymentAmount,
    charges
  })
  return response.data
}

export const getPaymentAnalytics = async (startDate, endDate) => {
  const params = new URLSearchParams()
  if (startDate) params.append('startDate', startDate)
  if (endDate) params.append('endDate', endDate)
  const response = await client.get(`/payments/analytics?${params}`)
  return response.data
}

export const getNextPaymentNumber = async (paymentDate = null) => {
  const params = new URLSearchParams()
  if (paymentDate) params.append('paymentDate', paymentDate)
  const response = await client.get(`/payments/next-number?${params}`)
  return response.data
}
