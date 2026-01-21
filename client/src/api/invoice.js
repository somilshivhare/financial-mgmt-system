import client from './client'

export const getAllInvoices = async (params = {}) => {
  const query = new URLSearchParams(params).toString()
  const response = await client.get(`/invoices?${query}`)
  return response.data
}

export const getInvoiceById = async (id) => {
  const response = await client.get(`/invoices/${id}`)
  return response.data
}

export const getInvoiceByInvoiceNumber = async (invoiceNumber) => {
  const response = await client.get(`/invoices/invoice/${invoiceNumber}`)
  return response.data
}

export const getInvoicesByPONumber = async (poNumber) => {
  const response = await client.get(`/invoices/po/${poNumber}`)
  return response.data
}

export const createInvoice = async (invoiceData) => {
  const response = await client.post('/invoices', invoiceData)
  return response.data
}

export const updateInvoice = async (id, invoiceData) => {
  const response = await client.put(`/invoices/${id}`, invoiceData)
  return response.data
}

export const deleteInvoice = async (id) => {
  const response = await client.delete(`/invoices/${id}`)
  return response.data
}

export const calculateInvoiceValues = async (formData) => {
  const response = await client.post('/invoices/calculate', formData)
  return response.data
}

export const calculateDueDates = async (invoiceDate, paymentTerms, totalInvoiceValue) => {
  const response = await client.post('/invoices/calculate-due-dates', {
    invoiceDate,
    paymentTerms,
    totalInvoiceValue
  })
  return response.data
}
