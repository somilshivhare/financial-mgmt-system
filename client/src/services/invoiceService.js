
import * as invoiceApi from '../api/invoice'

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

/**
 * API: { success, data: { data: rows[], page, total } } (axios body)
 * Also accepts axios response or a bare rows array.
 */
function unwrapInvoiceList(raw) {
  if (raw == null) return []

  const isAxios = typeof raw?.status === 'number' && raw?.data !== undefined && raw?.config
  const body = isAxios ? raw.data : raw

  if (Array.isArray(body)) return body
  if (!body || typeof body !== 'object') return []

  const payload = body.data
  if (Array.isArray(payload)) return payload
  if (payload && typeof payload === 'object' && Array.isArray(payload.data)) return payload.data

  return []
}

export const getAllInvoices = async () => {
  try {
    const response = await invoiceApi.getAllInvoices({ page: 1, pageSize: 1000 })
    return unwrapInvoiceList(response)
  } catch (error) {
    console.error('Failed to load invoices:', error)
    throw error
  }
}

export const getInvoiceByID = async (invoiceID) => {
  try {
    const response = await invoiceApi.getInvoiceByInvoiceNumber(invoiceID)
    return response.data || null
  } catch (error) {
    console.error(`Failed to load invoice ${invoiceID}:`, error)
    return null
  }
}

export const getInvoicesByPONumber = async (poNumber) => {
  try {
    const response = await invoiceApi.getInvoicesByPONumber(poNumber)
    return response.data || []
  } catch (error) {
    console.error(`Failed to load invoices for PO ${poNumber}:`, error)
    return []
  }
}

export const saveInvoice = async (invoiceData) => {
  try {
    let response
    if (invoiceData.id) {
      response = await invoiceApi.updateInvoice(invoiceData.id, invoiceData)
    } else {
      response = await invoiceApi.createInvoice(invoiceData)
    }

    const invoice = response?.data?.data || response?.data || response
    
    const invoiceWithStatus = {
      ...invoice,
      status: invoice?.status || invoiceData.status || 'open'
    }

    console.log('[InvoiceService] Saved invoice with status:', invoiceWithStatus.status, 'from payload:', invoiceData.status)


    return invoiceWithStatus
  } catch (error) {
    console.error('Failed to save invoice:', error)
    throw error
  }
}

export const calculateInvoiceValues = (formData) => {
  const basicRate = parseFloat(formData.basicRate || 0)
  const qty = parseFloat(formData.qty || 0)
  const freightRate = parseFloat(formData.freightRate || 0)

  const basicValue = basicRate * qty

  const freightValue = freightRate * qty

  const taxableBase = basicValue + freightValue

  const rawTaxType = String(formData.taxType || 'IGST').trim()
  const taxType =
    rawTaxType === 'CGST' || rawTaxType === 'SGST' ? 'SGST & CGST' : rawTaxType

  let sgstRate = parseFloat(formData.sgstRate || 0)
  let cgstRate = parseFloat(formData.cgstRate || 0)
  let igstRate = parseFloat(formData.igstRate || 0)
  let ugstRate = parseFloat(formData.ugstRate || 0)

  if (taxType === 'SGST & CGST' && sgstRate <= 0 && cgstRate <= 0 && igstRate > 0) {
    sgstRate = igstRate / 2
    cgstRate = igstRate / 2
    igstRate = 0
  }

  let sgstValue = 0
  let cgstValue = 0
  let igstValue = 0
  let ugstValue = 0

  if (taxType === 'IGST') {
    igstValue = (taxableBase * igstRate) / 100
  } else if (taxType === 'SGST & CGST') {
    sgstValue = (taxableBase * sgstRate) / 100
    cgstValue = (taxableBase * cgstRate) / 100
  } else if (taxType === 'UGST') {
    ugstValue = (taxableBase * (ugstRate / 2)) / 100
  } else {
    sgstValue = (taxableBase * sgstRate) / 100
    cgstValue = (taxableBase * cgstRate) / 100
    igstValue = (taxableBase * igstRate) / 100
    ugstValue = (taxableBase * ugstRate) / 100
  }

  const totalGST = sgstValue + cgstValue + igstValue + ugstValue

  const subtotal = basicValue + freightValue

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

export const calculateDueDates = (invoiceDate, paymentTerms, totalInvoiceValue, paymentDueRows = []) => {
  const matrixRows = Array.isArray(paymentDueRows)
    ? paymentDueRows.filter((row) => row && String(row.percentage ?? '').trim() !== '')
    : []
  if (!invoiceDate || (!paymentTerms && matrixRows.length === 0)) {
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

  if (matrixRows.length > 0) {
    const sorted = [...matrixRows].sort((a, b) => {
      const keyA = String(a.key || '')
      const keyB = String(b.key || '')
      const numA = Number.parseInt(keyA.replace(/\D+/g, ''), 10)
      const numB = Number.parseInt(keyB.replace(/\D+/g, ''), 10)
      if (Number.isFinite(numA) && Number.isFinite(numB)) return numA - numB
      return keyA.localeCompare(keyB)
    })
    const stageRows = sorted.slice(0, 3)
    const out = {
      firstDueDate: '',
      secondDueDate: '',
      thirdDueDate: '',
      firstDueAmount: '0.00',
      secondDueAmount: '0.00',
      thirdDueAmount: '0.00',
    }
    stageRows.forEach((row, index) => {
      const pct = parseFloat(row.percentage || 0)
      const days = parseFloat(row.days || row.dueDays || row.creditDays || 0)
      const due = new Date(invoice)
      due.setDate(due.getDate() + (Number.isFinite(days) ? days : 0))
      const amount = total > 0 ? ((total * (Number.isFinite(pct) ? pct : 0)) / 100).toFixed(2) : '0.00'
      if (index === 0) {
        out.firstDueDate = due.toISOString().split('T')[0]
        out.firstDueAmount = amount
      }
      if (index === 1) {
        out.secondDueDate = due.toISOString().split('T')[0]
        out.secondDueAmount = amount
      }
      if (index === 2) {
        out.thirdDueDate = due.toISOString().split('T')[0]
        out.thirdDueAmount = amount
      }
    })
    return out
  }

  let terms = []

  if (typeof paymentTerms === 'string') {
    const numbers = paymentTerms.match(/\d+/g)
    if (numbers) {
      terms = numbers.map((n) => parseInt(n, 10)).filter((n) => !isNaN(n) && n > 0)
    }
  }

  if (terms.length === 0) {
    terms = [0] // Immediate payment
  }

  const firstDueDays = terms[0] || 0
  const secondDueDays = terms[1] || 0
  const thirdDueDays = terms[2] || 0

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

export const calculateDaysOutstanding = (dueDate, receiptDate = null) => {
  if (!dueDate) return 0

  const due = new Date(dueDate)
  const today = receiptDate ? new Date(receiptDate) : new Date()

  const diffTime = today - due
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

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

export const deleteInvoice = async (id) => {
  try {
    const response = await invoiceApi.deleteInvoice(id)
    window.dispatchEvent(new CustomEvent('invoiceDeleted', { detail: { id } }))
    return response?.data ?? response
  } catch (error) {
    console.error('Failed to delete invoice:', error)
    throw error
  }
}

