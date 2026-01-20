/**
 * Invoice Service
 * Manages Invoice data, Invoice ID generation, and calculations
 */

const STORAGE_KEY = 'nbaurum_invoices'
const INVOICE_ID_COUNTER_KEY = 'nbaurum_invoice_id_counter'

// Generate unique Invoice ID based on business rules
export const generateInvoiceID = (invoiceType = 'REG', businessUnit = 'MAIN', financialYear = null) => {
  // Get current financial year if not provided (assuming April-March cycle)
  if (!financialYear) {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    financialYear = month >= 4 ? `${year}-${year + 1}` : `${year - 1}-${year}`
  }
  
  // Get or initialize counter
  let counter = parseInt(localStorage.getItem(INVOICE_ID_COUNTER_KEY) || '0', 10)
  counter += 1
  localStorage.setItem(INVOICE_ID_COUNTER_KEY, String(counter))
  
  // Format: INV-{TYPE}-{BU}-{FY}-{SEQUENCE}
  // Example: INV-REG-MAIN-2024-2025-0001
  const sequence = String(counter).padStart(4, '0')
  const fyShort = financialYear.replace('-', '')
  
  return `INV-${invoiceType}-${businessUnit}-${fyShort}-${sequence}`
}

// Get all invoices
export const getAllInvoices = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Failed to load invoices:', error)
    return []
  }
}

// Get invoice by Invoice ID
export const getInvoiceByID = (invoiceID) => {
  const invoices = getAllInvoices()
  return invoices.find((inv) => inv.invoiceID === invoiceID)
}

// Get invoices by PO Number (Key ID)
export const getInvoicesByPONumber = (poNumber) => {
  const invoices = getAllInvoices()
  return invoices.filter((inv) => inv.keyID === poNumber)
}

// Save invoice
export const saveInvoice = (invoiceData) => {
  try {
    const invoices = getAllInvoices()
    
    // Generate Invoice ID if not present
    if (!invoiceData.invoiceID) {
      invoiceData.invoiceID = generateInvoiceID(
        invoiceData.invoiceType || 'REG',
        invoiceData.businessUnit || 'MAIN'
      )
    }
    
    if (!invoiceData.id) {
      invoiceData.id = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      invoiceData.createdAt = new Date().toISOString()
    }
    
    invoiceData.updatedAt = new Date().toISOString()
    
    // Ensure Invoice ID is immutable once created
    const existing = invoices.find((inv) => inv.id === invoiceData.id)
    if (existing && existing.invoiceID) {
      invoiceData.invoiceID = existing.invoiceID // Preserve existing Invoice ID
    }
    
    const index = invoices.findIndex((inv) => inv.id === invoiceData.id)
    if (index >= 0) {
      invoices[index] = invoiceData
    } else {
      invoices.push(invoiceData)
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices))
    
    // Trigger update event
    window.dispatchEvent(new CustomEvent('invoiceUpdated', { detail: { invoice: invoiceData } }))
    
    return invoiceData
  } catch (error) {
    console.error('Failed to save invoice:', error)
    throw error
  }
}

// Calculate invoice values
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

