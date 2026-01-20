/**
 * Payment Service
 * Manages Payment data, links to Invoices, and updates invoice balances
 */

import * as invoiceService from './invoiceService'

const STORAGE_KEY = 'nbaurum_payments'
const PAYMENT_ID_COUNTER_KEY = 'nbaurum_payment_id_counter'

// Generate unique Payment ID
export const generatePaymentID = (financialYear = null) => {
  if (!financialYear) {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    financialYear = month >= 4 ? `${year}-${year + 1}` : `${year - 1}-${year}`
  }
  
  let counter = parseInt(localStorage.getItem(PAYMENT_ID_COUNTER_KEY) || '0', 10)
  counter += 1
  localStorage.setItem(PAYMENT_ID_COUNTER_KEY, String(counter))
  
  const sequence = String(counter).padStart(4, '0')
  const fyShort = financialYear.replace('-', '')
  
  return `PAY-${fyShort}-${sequence}`
}

// Get all payments
export const getAllPayments = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Failed to load payments:', error)
    return []
  }
}

// Get payment by ID
export const getPaymentById = (id) => {
  const payments = getAllPayments()
  return payments.find((p) => p.id === id)
}

// Get payments by Invoice ID
export const getPaymentsByInvoiceID = (invoiceID) => {
  const payments = getAllPayments()
  return payments.filter((p) => p.invoiceIDs && p.invoiceIDs.includes(invoiceID))
}

// Get payments by Customer
export const getPaymentsByCustomer = (customerId) => {
  const payments = getAllPayments()
  return payments.filter((p) => p.customerId === customerId)
}

// Get open invoices for a customer
export const getOpenInvoicesForCustomer = (customerId) => {
  const invoices = invoiceService.getAllInvoices()
  const customerInvoices = invoices.filter((inv) => inv.customerId === customerId)
  
  return customerInvoices.map((inv) => {
    // Calculate outstanding balance
    const totalInvoiceValue = parseFloat(inv.totalInvoiceValue || 0)
    
    // Calculate total received from all due stages (from invoice itself)
    const firstReceived = parseFloat(inv.firstReceivedAmount || 0)
    const secondReceived = parseFloat(inv.secondReceivedAmount || 0)
    const thirdReceived = parseFloat(inv.thirdReceivedAmount || 0)
    const totalReceived = firstReceived + secondReceived + thirdReceived
    
    const outstandingBalance = totalInvoiceValue - totalReceived
    
    // Determine due type based on outstanding balance and due amounts
    let dueType = '1st Due'
    const firstDue = parseFloat(inv.firstDueAmount || 0)
    const secondDue = parseFloat(inv.secondDueAmount || 0)
    const thirdDue = parseFloat(inv.thirdDueAmount || 0)
    
    if (thirdDue > 0 && outstandingBalance > (firstDue + secondDue)) {
      dueType = '3rd Due'
    } else if (secondDue > 0 && outstandingBalance > firstDue) {
      dueType = '2nd Due'
    }
    
    return {
      invoiceID: inv.invoiceID,
      keyID: inv.keyID, // PO Number
      invoiceDate: inv.invoiceDate,
      totalInvoiceValue: totalInvoiceValue.toFixed(2),
      outstandingBalance: outstandingBalance > 0 ? outstandingBalance.toFixed(2) : '0.00',
      previousReceivedAmount: totalReceived.toFixed(2),
      dueType,
      invoice: inv, // Full invoice object
    }
  }).filter((inv) => parseFloat(inv.outstandingBalance) > 0) // Only open invoices
}

// Calculate payment breakdown
export const calculatePaymentBreakdown = (invoiceData, paymentAmount, charges) => {
  // invoiceData can be either the invoice object or the open invoice data
  const invoice = invoiceData.invoice || invoiceData
  const invoiceAmount = parseFloat(invoice.totalInvoiceValue || 0)
  
  // Calculate previous received from invoice
  const firstReceived = parseFloat(invoice.firstReceivedAmount || 0)
  const secondReceived = parseFloat(invoice.secondReceivedAmount || 0)
  const thirdReceived = parseFloat(invoice.thirdReceivedAmount || 0)
  const previousReceived = firstReceived + secondReceived + thirdReceived
  
  const outstanding = invoiceAmount - previousReceived
  
  const tds = parseFloat(charges?.tds || 0)
  const bankCharges = parseFloat(charges?.bankCharges || 0)
  const penalty = parseFloat(charges?.penalty || 0)
  const otherDeductions = parseFloat(charges?.otherDeductions || 0)
  
  const totalCharges = tds + bankCharges + penalty + otherDeductions
  const netAmountReceived = parseFloat(paymentAmount || 0) - totalCharges
  const remainingBalance = outstanding - netAmountReceived
  
  return {
    invoiceAmount: invoiceAmount.toFixed(2),
    previousReceivedAmount: previousReceived.toFixed(2),
    outstandingAmount: outstanding.toFixed(2),
    paymentAmount: parseFloat(paymentAmount || 0).toFixed(2),
    tds: tds.toFixed(2),
    bankCharges: bankCharges.toFixed(2),
    penalty: penalty.toFixed(2),
    otherDeductions: otherDeductions.toFixed(2),
    totalCharges: totalCharges.toFixed(2),
    netAmountReceived: netAmountReceived.toFixed(2),
    remainingBalance: remainingBalance > 0 ? remainingBalance.toFixed(2) : '0.00',
  }
}

// Save payment and update invoice balances
export const savePayment = (paymentData) => {
  try {
    const payments = getAllPayments()
    
    // Generate Payment ID if not present
    if (!paymentData.paymentID) {
      paymentData.paymentID = generatePaymentID()
    }
    
    if (!paymentData.id) {
      paymentData.id = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      paymentData.createdAt = new Date().toISOString()
    }
    
    paymentData.updatedAt = new Date().toISOString()
    
    // Ensure Payment ID is immutable once created
    const existing = payments.find((p) => p.id === paymentData.id)
    if (existing && existing.paymentID) {
      paymentData.paymentID = existing.paymentID
    }
    
    // Process invoice payments and update invoice balances
    if (paymentData.invoicePayments && paymentData.invoicePayments.length > 0) {
      paymentData.invoicePayments.forEach((invoicePayment) => {
        updateInvoiceWithPayment(invoicePayment)
      })
    }
    
    const index = payments.findIndex((p) => p.id === paymentData.id)
    if (index >= 0) {
      payments[index] = paymentData
    } else {
      payments.push(paymentData)
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payments))
    
    // Trigger update event
    window.dispatchEvent(new CustomEvent('paymentUpdated', { detail: { payment: paymentData } }))
    
    return paymentData
  } catch (error) {
    console.error('Failed to save payment:', error)
    throw error
  }
}

// Update invoice with payment
const updateInvoiceWithPayment = (invoicePayment) => {
  const invoice = invoiceService.getInvoiceByID(invoicePayment.invoiceID)
  if (!invoice) return
  
  const paymentAmount = parseFloat(invoicePayment.paymentAmount || 0)
  const paymentType = invoicePayment.paymentType // 1st Due / 2nd Due / 3rd Due
  const receiptDate = invoicePayment.receiptDate
  
  // Update the appropriate due stage
  if (paymentType === '1st Due') {
    const currentReceived = parseFloat(invoice.firstReceivedAmount || 0)
    invoice.firstReceivedAmount = (currentReceived + paymentAmount).toFixed(2)
    invoice.firstReceiptDate = receiptDate || invoice.firstReceiptDate
  } else if (paymentType === '2nd Due') {
    const currentReceived = parseFloat(invoice.secondReceivedAmount || 0)
    invoice.secondReceivedAmount = (currentReceived + paymentAmount).toFixed(2)
    invoice.secondReceiptDate = receiptDate || invoice.secondReceiptDate
  } else if (paymentType === '3rd Due') {
    const currentReceived = parseFloat(invoice.thirdReceivedAmount || 0)
    invoice.thirdReceivedAmount = (currentReceived + paymentAmount).toFixed(2)
    invoice.thirdReceiptDate = receiptDate || invoice.thirdReceiptDate
  }
  
  // Update charges/deductions
  if (invoicePayment.charges) {
    invoice.tdsAmount = (parseFloat(invoice.tdsAmount || 0) + parseFloat(invoicePayment.charges.tds || 0)).toFixed(2)
    invoice.bankCharges = (parseFloat(invoice.bankCharges || 0) + parseFloat(invoicePayment.charges.bankCharges || 0)).toFixed(2)
    invoice.penaltyAmount = (parseFloat(invoice.penaltyAmount || 0) + parseFloat(invoicePayment.charges.penalty || 0)).toFixed(2)
    invoice.deductionAmount = (parseFloat(invoice.deductionAmount || 0) + parseFloat(invoicePayment.charges.otherDeductions || 0)).toFixed(2)
  }
  
  // Save updated invoice
  invoiceService.saveInvoice(invoice)
}

// Delete payment and reverse invoice updates
export const deletePayment = (paymentId) => {
  try {
    const payment = getPaymentById(paymentId)
    if (!payment) {
      throw new Error('Payment not found')
    }
    
    // Reverse invoice updates
    if (payment.invoicePayments && payment.invoicePayments.length > 0) {
      payment.invoicePayments.forEach((invoicePayment) => {
        reverseInvoicePayment(invoicePayment)
      })
    }
    
    // Remove payment
    const payments = getAllPayments()
    const filtered = payments.filter((p) => p.id !== paymentId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    
    // Trigger update event
    window.dispatchEvent(new CustomEvent('paymentDeleted', { detail: { paymentId } }))
    
    return true
  } catch (error) {
    console.error('Failed to delete payment:', error)
    throw error
  }
}

// Reverse invoice payment updates
const reverseInvoicePayment = (invoicePayment) => {
  const invoice = invoiceService.getInvoiceByID(invoicePayment.invoiceID)
  if (!invoice) return
  
  const paymentAmount = parseFloat(invoicePayment.paymentAmount || 0)
  const paymentType = invoicePayment.paymentType
  
  // Reverse the appropriate due stage
  if (paymentType === '1st Due') {
    const currentReceived = parseFloat(invoice.firstReceivedAmount || 0)
    invoice.firstReceivedAmount = Math.max(0, currentReceived - paymentAmount).toFixed(2)
  } else if (paymentType === '2nd Due') {
    const currentReceived = parseFloat(invoice.secondReceivedAmount || 0)
    invoice.secondReceivedAmount = Math.max(0, currentReceived - paymentAmount).toFixed(2)
  } else if (paymentType === '3rd Due') {
    const currentReceived = parseFloat(invoice.thirdReceivedAmount || 0)
    invoice.thirdReceivedAmount = Math.max(0, currentReceived - paymentAmount).toFixed(2)
  }
  
  // Reverse charges/deductions
  if (invoicePayment.charges) {
    invoice.tdsAmount = Math.max(0, parseFloat(invoice.tdsAmount || 0) - parseFloat(invoicePayment.charges.tds || 0)).toFixed(2)
    invoice.bankCharges = Math.max(0, parseFloat(invoice.bankCharges || 0) - parseFloat(invoicePayment.charges.bankCharges || 0)).toFixed(2)
    invoice.penaltyAmount = Math.max(0, parseFloat(invoice.penaltyAmount || 0) - parseFloat(invoicePayment.charges.penalty || 0)).toFixed(2)
    invoice.deductionAmount = Math.max(0, parseFloat(invoice.deductionAmount || 0) - parseFloat(invoicePayment.charges.otherDeductions || 0)).toFixed(2)
  }
  
  // Save updated invoice
  invoiceService.saveInvoice(invoice)
}

// Get payment analytics data
export const getPaymentAnalytics = (startDate = null, endDate = null) => {
  const payments = getAllPayments()
  
  let filtered = payments
  if (startDate && endDate) {
    filtered = payments.filter((p) => {
      const paymentDate = new Date(p.paymentReceiptDate)
      return paymentDate >= new Date(startDate) && paymentDate <= new Date(endDate)
    })
  }
  
  // Group by date
  const byDate = {}
  filtered.forEach((payment) => {
    const date = payment.paymentReceiptDate
    if (!byDate[date]) {
      byDate[date] = { date, amount: 0, count: 0 }
    }
    byDate[date].amount += parseFloat(payment.paymentAmount || 0)
    byDate[date].count += 1
  })
  
  return Object.values(byDate).sort((a, b) => new Date(a.date) - new Date(b.date))
}

