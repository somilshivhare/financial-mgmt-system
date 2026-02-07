
import * as paymentApi from '../api/payment'
import * as invoiceService from './invoiceService'

export const generatePaymentID = (financialYear = null) => {
  if (!financialYear) {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    financialYear = month >= 4 ? `${year}-${year + 1}` : `${year - 1}-${year}`
  }

  const fyShort = financialYear.replace('-', '')

  return `PAY-${fyShort}-XXXX` // Backend will handle sequence
}

export const getAllPayments = async () => {
  try {
    const response = await paymentApi.getAllPayments()
    const wrapper = response?.data ?? response
    const list = Array.isArray(wrapper) ? wrapper : (wrapper?.data?.data ?? wrapper?.data ?? [])
    return Array.isArray(list) ? list : []
  } catch (error) {
    console.error('Failed to load payments:', error)
    return []
  }
}

export const getPaymentById = async (id) => {
  try {
    const response = await paymentApi.getPaymentById(id)
    return response.data || null
  } catch (error) {
    console.error(`Failed to load payment ${id}:`, error)
    return null
  }
}

export const getPaymentsByInvoiceID = async (invoiceID) => {
  try {
    const response = await paymentApi.getPaymentsByInvoice(invoiceID)
    return response.data || []
  } catch (error) {
    console.error(`Failed to load payments for invoice ${invoiceID}:`, error)
    return []
  }
}

export const getPaymentsByCustomer = async (customerId) => {
  try {
    const response = await paymentApi.getPaymentsByCustomer(customerId)
    return response.data || []
  } catch (error) {
    console.error(`Failed to load payments for customer ${customerId}:`, error)
    return []
  }
}

export const getOpenInvoicesForCustomer = async (customerId, customerName = null) => {
  try {
    if (!customerId && !customerName) return []
    const response = await paymentApi.getOpenInvoicesForCustomer(
      customerId || '',
      customerName || null
    )
    const raw = response?.data ?? response
    const list = Array.isArray(raw) ? raw : []
    return list.map((inv) => {
      const invoiceID = inv.invoiceID ?? inv.invoice_number ?? inv.internal_invoice_no ?? inv.internalInvoiceNo ?? ''
      const keyID = inv.keyID ?? inv.key_id ?? inv.po_number ?? ''
      const rawDate = inv.invoiceDate ?? inv.issue_date ?? inv.gst_tax_invoice_date ?? inv.created_at ?? null
      const invoiceDate =
        rawDate && typeof rawDate === 'string'
          ? rawDate.split('T')[0]
          : rawDate
          ? new Date(rawDate).toISOString().split('T')[0]
          : ''
      const total = parseFloat(inv.totalInvoiceValue ?? inv.total_amount ?? inv.total_invoice_value ?? 0)
      const balance = parseFloat(inv.outstandingBalance ?? inv.balance ?? total - parseFloat(inv.previousReceivedAmount ?? inv.amount_paid ?? 0))
      return {
        invoiceID,
        invoiceId: inv.id || inv.invoiceId || null,
        keyID,
        invoiceDate,
        totalInvoiceValue: Number.isFinite(total) ? total.toFixed(2) : '0.00',
        outstandingBalance: Number.isFinite(balance) ? balance.toFixed(2) : '0.00',
        dueType: inv.dueType ?? 'Final',
        invoice: inv,
      }
    })
  } catch (error) {
    console.error(`Failed to load open invoices for customer ${customerId} (${customerName}):`, error)
    return []
  }
}

export const calculatePaymentBreakdown = async (invoiceData, paymentAmount, charges) => {
  try {
    const response = await paymentApi.calculatePaymentBreakdown(invoiceData, paymentAmount, charges)
    return response.data
  } catch (error) {
    console.error('Failed to calculate payment breakdown:', error)
    const invoice = invoiceData.invoice || invoiceData
    const invoiceAmount = parseFloat(invoice.totalInvoiceValue || 0)

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
}

export const calculatePaymentBreakdownSync = (invoiceData, paymentAmount, charges) => {
  const invoice = invoiceData?.invoice || invoiceData || {}
  const invoiceAmount = parseFloat(invoice.totalInvoiceValue || invoice.total_amount || 0)

  const previousReceived = parseFloat(invoice.amount_paid || 0)
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

export const savePayment = async (paymentData) => {
  try {
    let response
    if (paymentData.id) {
      response = await paymentApi.updatePayment(paymentData.id, paymentData)
    } else {
      response = await paymentApi.createPayment(paymentData)
    }

    window.dispatchEvent(new CustomEvent('paymentUpdated', { detail: { payment: response.data } }))
    window.dispatchEvent(new CustomEvent('invoiceUpdated', { detail: { payment: response.data } }))

    return response.data
  } catch (error) {
    console.error('Failed to save payment:', error)
    throw error
  }
}

const updateInvoiceWithPayment = (invoicePayment) => {
  const invoice = invoiceService.getInvoiceByID(invoicePayment.invoiceID)
  if (!invoice) return
  
  const paymentAmount = parseFloat(invoicePayment.paymentAmount || 0)
  const paymentType = invoicePayment.paymentType // 1st Due / 2nd Due / 3rd Due
  const receiptDate = invoicePayment.receiptDate
  
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
  
  if (invoicePayment.charges) {
    invoice.tdsAmount = (parseFloat(invoice.tdsAmount || 0) + parseFloat(invoicePayment.charges.tds || 0)).toFixed(2)
    invoice.bankCharges = (parseFloat(invoice.bankCharges || 0) + parseFloat(invoicePayment.charges.bankCharges || 0)).toFixed(2)
    invoice.penaltyAmount = (parseFloat(invoice.penaltyAmount || 0) + parseFloat(invoicePayment.charges.penalty || 0)).toFixed(2)
    invoice.deductionAmount = (parseFloat(invoice.deductionAmount || 0) + parseFloat(invoicePayment.charges.otherDeductions || 0)).toFixed(2)
  }
  
  invoiceService.saveInvoice(invoice)
}

export const deletePayment = async (paymentId) => {
  try {
    const response = await paymentApi.deletePayment(paymentId)

    window.dispatchEvent(new CustomEvent('paymentDeleted', { detail: { paymentId } }))

    return response.data
  } catch (error) {
    console.error('Failed to delete payment:', error)
    throw error
  }
}

export const getPaymentAnalytics = async (startDate = null, endDate = null) => {
  try {
    const response = await paymentApi.getPaymentAnalytics(startDate, endDate)
    return response.data || []
  } catch (error) {
    console.error('Failed to load payment analytics:', error)
    return []
  }
}

