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

export const getOpenInvoicesForCustomer = async (customerId) => {
  const response = await client.get(`/payments/open-invoices/${customerId}`)
  return response.data
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
