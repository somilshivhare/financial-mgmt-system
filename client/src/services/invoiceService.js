/**
 * Invoice Service
 * Manages Invoice data, Invoice ID generation, and calculations
 */

import * as invoiceApi from '../api/invoice'

// Generate unique Invoice ID based on business rules (placeholder when API not used)
export const generateInvoiceID = (invoiceType = 'REG', businessUnit = 'MAIN', financialYear = null) => {
  if (!financialYear) {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    financialYear = month >= 4 ? `${year}-${year + 1}` : `${year - 1}-${year}`
  }
  const fyShort = financialYear.replace('-', '')
  return `INV-${invoiceType}-${businessUnit}-${fyShort}-XXXX`
}

// Fallback: generate a number with digits (no XXXX) when API is unavailable
function fallbackInvoiceNumber(invoiceType = 'REG', businessUnit = 'MAIN') {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const fyStart = month >= 4 ? year : year - 1
  const fyEnd = fyStart + 1
  const fyShort = `${fyStart}${fyEnd}`
  const seq = String(Date.now()).slice(-4)
  return `INV-${invoiceType}-${businessUnit}-${fyShort}-${seq}`
}

// Fetch next internal invoice number from backend (real sequence, e.g. INV-REG-MAIN-20252026-0001)
export const fetchNextInvoiceNumber = async (invoiceType = 'REG', businessUnit = 'MAIN') => {
  try {
    const next = await invoiceApi.getNextInvoiceNumber({ invoiceType, businessUnit })
    if (next && typeof next === 'string' && !/XXXX/i.test(next)) return next
    return fallbackInvoiceNumber(invoiceType, businessUnit)
  } catch (error) {
    console.error('Failed to fetch next invoice number:', error)
    return fallbackInvoiceNumber(invoiceType, businessUnit)
  }
}

// Get all invoices (returns array). Handles every API shape so list always shows when data exists.
function unwrapInvoiceList(response) {
  if (!response) return [];
  
  // If response is directly the array
  if (Array.isArray(response)) return response;
  
  // If response is the standard { success, data: [...] } from invoiceApi.js
  if (response.data && Array.isArray(response.data)) return response.data;
  
  // If response is the raw backend response { success, data: { data: [...] } }
  const nestedData = response.data?.data || response.data;
  if (Array.isArray(nestedData)) return nestedData;
  
  return [];
}

export const getAllInvoices = async () => {
  try {
    const response = await invoiceApi.getAllInvoices({ page: 1, pageSize: 500 })
    return unwrapInvoiceList(response)
  } catch (error) {
    console.error('Failed to load invoices:', error)
    throw error
  }
}

// Get invoice by Invoice ID
export const getInvoiceByID = async (invoiceID) => {
  try {
    const response = await invoiceApi.getInvoiceByInvoiceNumber(invoiceID)
    return response.data || null
  } catch (error) {
    console.error(`Failed to load invoice ${invoiceID}:`, error)
    return null
  }
}

// Get invoices by PO Number (Key ID)
export const getInvoicesByPONumber = async (poNumber) => {
  try {
    const response = await invoiceApi.getInvoicesByPONumber(poNumber)
    return response.data || []
  } catch (error) {
    console.error(`Failed to load invoices for PO ${poNumber}:`, error)
    return []
  }
}

// Save invoice
export const saveInvoice = async (invoiceData) => {
  try {
    let response
    if (invoiceData.id) {
      response = await invoiceApi.updateInvoice(invoiceData.id, invoiceData)
    } else {
      response = await invoiceApi.createInvoice(invoiceData)
    }

    // Trigger update event
    window.dispatchEvent(new CustomEvent('invoiceUpdated', { detail: { invoice: response.data } }))

    return response?.data ?? response
  } catch (error) {
    console.error('Failed to save invoice:', error)
    // Re-throw so caller can read error.response?.data?.message
    throw error
  }
}

// Calculate invoice values
// MUST be synchronous (used in useMemo in UI)
export const calculateInvoiceValues = (formData) => {
  const basicRate = parseFloat(formData.basicRate || 0)
  const qty = parseFloat(formData.qty || 0)
  const freightRate = parseFloat(formData.freightRate || 0)

  // Basic Value = Basic Rate × Qty
  const basicValue = basicRate * qty

  // Freight Value = Freight Rate × Qty
  const freightValue = freightRate * qty

  // GST Calculations
  const sgstRate = parseFloat(formData.sgstRate || 0)
  const cgstRate = parseFloat(formData.cgstRate || 0)
  const igstRate = parseFloat(formData.igstRate || 0)
  const ugstRate = parseFloat(formData.ugstRate || 0)

  const sgstValue = (basicValue * sgstRate) / 100
  const cgstValue = (basicValue * cgstRate) / 100
  const igstValue = (basicValue * igstRate) / 100
  const ugstValue = (basicValue * ugstRate) / 100

  const totalGST = sgstValue + cgstValue + igstValue + ugstValue

  // Subtotal = Basic Value + Freight Value
  const subtotal = basicValue + freightValue

  // Total Invoice Value = Subtotal + Total GST
  const totalInvoiceValue = subtotal + totalGST

  return {
    basicValue: basicValue.toFixed(2),
    freightValue: freightValue.toFixed(2),
    sgstValue: sgstValue.toFixed(2),
    cgstValue: cgstValue.toFixed(2),
    igstValue: igstValue.toFixed(2),
    ugstValue: ugstValue.toFixed(2),
    totalGST: totalGST.toFixed(2),
    subtotal: subtotal.toFixed(2),
    totalInvoiceValue: totalInvoiceValue.toFixed(2),
  }
}

// Calculate due dates and amounts
// MUST be synchronous (used in useMemo in UI)
export const calculateDueDates = (invoiceDate, paymentTerms, totalInvoiceValue) => {
  if (!invoiceDate || !paymentTerms) {
    return {
      firstDueDate: '',
      secondDueDate: '',
      thirdDueDate: '',
      firstDueAmount: '0.00',
      secondDueAmount: '0.00',
      thirdDueAmount: '0.00',
    }
  }

  const invoice = new Date(invoiceDate)
  const total = parseFloat(totalInvoiceValue || 0)

  // Parse payment terms - handle various formats:
  // "30, 60, 90" or "30 days, 60 days" or "Net 30" or just numbers
  let terms = []

  if (typeof paymentTerms === 'string') {
    // Extract numbers from the string
    const numbers = paymentTerms.match(/\d+/g)
    if (numbers) {
      terms = numbers.map((n) => parseInt(n, 10)).filter((n) => !isNaN(n) && n > 0)
    }
  }

  // If no terms found, default to single payment
  if (terms.length === 0) {
    terms = [0] // Immediate payment
  }

  const firstDueDays = terms[0] || 0
  const secondDueDays = terms[1] || 0
  const thirdDueDays = terms[2] || 0

  // Calculate due dates
  const firstDue = new Date(invoice)
  firstDue.setDate(firstDue.getDate() + firstDueDays)

  const secondDue = secondDueDays > 0 ? new Date(invoice) : null
  if (secondDue) {
    secondDue.setDate(secondDue.getDate() + secondDueDays)
  }

  const thirdDue = thirdDueDays > 0 ? new Date(invoice) : null
  if (thirdDue) {
    thirdDue.setDate(thirdDue.getDate() + thirdDueDays)
  }

  // Calculate due amounts (equal distribution)
  const numStages = Math.max(1, terms.length)
  const firstDueAmount = total > 0 ? (total / numStages).toFixed(2) : '0.00'
  const secondDueAmount = terms.length > 1 && total > 0 ? (total / numStages).toFixed(2) : '0.00'
  const thirdDueAmount = terms.length > 2 && total > 0 ? (total / numStages).toFixed(2) : '0.00'

  return {
    firstDueDate: firstDue.toISOString().split('T')[0],
    secondDueDate: secondDue ? secondDue.toISOString().split('T')[0] : '',
    thirdDueDate: thirdDue ? thirdDue.toISOString().split('T')[0] : '',
    firstDueAmount,
    secondDueAmount,
    thirdDueAmount,
  }
}

// Calculate days outstanding
export const calculateDaysOutstanding = (dueDate, receiptDate = null) => {
  if (!dueDate) return 0

  const due = new Date(dueDate)
  const today = receiptDate ? new Date(receiptDate) : new Date()

  const diffTime = today - due
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

// Calculate due status
export const calculateDueStatus = (dueDate, receivedAmount, dueAmount) => {
  const days = calculateDaysOutstanding(dueDate)
  const received = parseFloat(receivedAmount || 0)
  const due = parseFloat(dueAmount || 0)
  const balance = due - received

  if (balance <= 0) {
    return { status: 'paid', overdue: false, notDue: false }
  }

  if (days > 0) {
    return { status: 'overdue', overdue: true, notDue: false, daysOverdue: days }
  }

  return { status: 'not-due', overdue: false, notDue: true, daysUntilDue: Math.abs(days) }
}

// Delete invoice
export const deleteInvoice = async (id) => {
  try {
    const response = await invoiceApi.deleteInvoice(id)
    // Trigger deleted event
    window.dispatchEvent(new CustomEvent('invoiceDeleted', { detail: { id } }))
    return response?.data ?? response
  } catch (error) {
    console.error('Failed to delete invoice:', error)
    throw error
  }
}

