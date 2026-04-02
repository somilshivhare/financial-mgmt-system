import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Calculator, Plus, Calendar as CalendarIcon } from 'lucide-react'
import DatePicker from '../components/DatePicker'
import { useMasterData } from '../contexts/MasterDataContext'
import { useToast } from '../contexts/ToastContext'
import { usePersistedFormState } from '../hooks/usePersistedFormState'
import * as paymentService from '../services/paymentService'
import * as masterDataService from '../services/masterDataService'
import { getPaymentById, updatePayment, getNextPaymentNumber, createPayment } from '../api/payment'
import '../styles/PaymentEntry.css'

function createEmptyPaymentRow(charges, paymentType, receiptDate) {
  const safeCharges =
    charges && typeof charges === 'object' && !Array.isArray(charges)
      ? charges
      : { tds: '', bankCharges: '', penalty: '', otherDeductions: '' }
  return {
    rowId:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `row-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    invoiceID: '',
    invoiceId: '',
    keyID: '',
    invoice: null,
    paymentAmount: '',
    charges: { ...safeCharges },
    paymentType: paymentType || '1st Due',
    receiptDate: receiptDate || new Date().toISOString().split('T')[0],
  }
}

const INITIAL_PAYMENT_STATE = {
  formData: {
    paymentID: '',
    paymentReceiptDate: new Date().toISOString().split('T')[0],
    customerName: '',
    customerId: '',
    projectName: '',
    packageName: '',
    paymentAmount: '',
    paymentType: '1st Due',
    bankName: '',
    bankId: '',
    paymentCreditInBankDate: '',
    invoicePayments: [],
  },
  charges: {
    tds: '',
    bankCharges: '',
    penalty: '',
    otherDeductions: '',
  },
}

function PaymentEntry() {
  const navigate = useNavigate()
  const { id } = useParams() // Get ID if editing existing payment
  const { getCustomers, masterData } = useMasterData()
  const { showToast } = useToast()
  
  const [customers, setCustomers] = useState([])
  const [customersLoading, setCustomersLoading] = useState(true)
  const [paymentNumberLoading, setPaymentNumberLoading] = useState(false)
  const [openInvoices, setOpenInvoices] = useState([])
  const [customerLocked, setCustomerLocked] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showFieldSelector, setShowFieldSelector] = useState(false)
  const [availableFields, setAvailableFields] = useState([])
  const [hiddenFieldKeys, setHiddenFieldKeys] = useState([])
  
  const { values, setValues, clearLocalDraft, persistNow } = usePersistedFormState({
    pathKey: 'payment-entry',
    defaultValues: INITIAL_PAYMENT_STATE,
    entityId: id || null,
  })
  const formData = values.formData ?? INITIAL_PAYMENT_STATE.formData
  const charges = values.charges ?? INITIAL_PAYMENT_STATE.charges
  const setFormData = useCallback((updater) => {
    setValues((prev) => ({
      ...prev,
      formData: typeof updater === 'function' ? updater(prev.formData ?? INITIAL_PAYMENT_STATE.formData) : updater,
    }))
  }, [setValues])
  const setCharges = useCallback((updater) => {
    setValues((prev) => ({
      ...prev,
      charges: typeof updater === 'function' ? updater(prev.charges ?? INITIAL_PAYMENT_STATE.charges) : updater,
    }))
  }, [setValues])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('paymentEntryHiddenFields')
      const parsed = saved ? JSON.parse(saved) : []
      setHiddenFieldKeys(Array.isArray(parsed) ? parsed : [])
    } catch {
      setHiddenFieldKeys([])
    }
  }, [])

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll('.payment-entry-form .payment-entry-field'))
    const collected = []

    nodes.forEach((node) => {
      const labelEl = node.querySelector('.payment-entry-label')
      const rawLabel = (labelEl?.textContent || '').replace(/\s+/g, ' ').trim()
      if (!rawLabel) return
      const cleanLabel = rawLabel.replace('*', '').trim()
      const key = cleanLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      node.setAttribute('data-field-key', key)
      if (!collected.some((item) => item.key === key)) collected.push({ key, label: cleanLabel })
    })

    setAvailableFields((prev) => {
      const prevKeys = prev.map((item) => item.key).join('|')
      const nextKeys = collected.map((item) => item.key).join('|')
      return prevKeys === nextKeys ? prev : collected
    })

    nodes.forEach((node) => {
      const key = node.getAttribute('data-field-key')
      node.style.display = key && hiddenFieldKeys.includes(key) ? 'none' : ''
    })
  }, [hiddenFieldKeys, formData, charges, openInvoices])

  useEffect(() => {
    try {
      localStorage.setItem('paymentEntryHiddenFields', JSON.stringify(hiddenFieldKeys))
    } catch {
      // Ignore storage failures.
    }
  }, [hiddenFieldKeys])
  
  useEffect(() => {
    if (!id) {
      setFormData((prev) => ({
        ...prev,
        customerId: '',
        customerName: '',
        projectName: '',
        packageName: '',
        invoicePayments: [],
      }))
      setCustomerLocked(false)
      setOpenInvoices([])
    }
  }, [id, setFormData])
  
  useEffect(() => {
    const loadCustomers = async () => {
      setCustomersLoading(true)
      try {
        let customersList = getCustomers()
        
        if (!customersList || customersList.length === 0) {
          console.log('[PaymentEntry] Customers not in context, fetching directly...')
          customersList = await masterDataService.getCustomers()
        }
        
        const transformedCustomers = customersList.map((customer) => {
          const values = customer.values || {}
          const name = customer.name || values.customerName || values.name || 'Unnamed Customer'
          
          return {
            ...customer,
            id: customer.id,
            name: name,
            customerName: name,
          }
        })
        
        if (transformedCustomers && transformedCustomers.length > 0) {
          console.log(`[PaymentEntry] Loaded ${transformedCustomers.length} customers`)
          setCustomers(transformedCustomers)
        } else {
          console.warn('[PaymentEntry] No customers found')
          setCustomers([])
        }
      } catch (error) {
        console.error('[PaymentEntry] Failed to load customers:', error)
        setCustomers([])
        showToast('Failed to load customers. Please refresh the page.', 'error')
      } finally {
        setCustomersLoading(false)
      }
    }
    
    loadCustomers()
  }, [getCustomers, masterData.customers, masterData.loading, showToast]) // React to changes in masterData.customers

  useEffect(() => {
    if (id) return
    
    const needsPaymentNumber = !formData.paymentID || formData.paymentID.includes('XXXX')
    
    if (needsPaymentNumber) {
      const fetchPaymentNumber = async () => {
        setPaymentNumberLoading(true)
        try {
          console.log('[PaymentEntry] Fetching payment number for date:', formData.paymentReceiptDate)
          const response = await getNextPaymentNumber(formData.paymentReceiptDate || null)
          
          console.log('[PaymentEntry] Payment number API response:', response)
          
          let paymentNumber = null
          if (response?.data?.paymentNumber) {
            paymentNumber = response.data.paymentNumber
          } else if (response?.data?.data?.paymentNumber) {
            paymentNumber = response.data.data.paymentNumber
          } else if (response?.paymentNumber) {
            paymentNumber = response.paymentNumber
          } else if (typeof response?.data === 'string' && !response.data.includes('XXXX')) {
            paymentNumber = response.data
          }
          
          if (paymentNumber && !paymentNumber.includes('XXXX') && paymentNumber.startsWith('PAY-')) {
            console.log('[PaymentEntry] ✓ Fetched payment number:', paymentNumber)
            setFormData((prev) => ({ ...prev, paymentID: paymentNumber }))
          } else {
            console.warn('[PaymentEntry] Invalid payment number received:', paymentNumber, 'Full response:', response)
            const generatedID = paymentService.generatePaymentID()
            setFormData((prev) => ({ ...prev, paymentID: generatedID }))
            showToast('Could not fetch payment number from server. Using placeholder.', 'warning')
          }
        } catch (error) {
          console.error('[PaymentEntry] Failed to fetch payment number:', error)
          const generatedID = paymentService.generatePaymentID()
          setFormData((prev) => ({ ...prev, paymentID: generatedID }))
          showToast('Payment number will be generated when you save. Please ensure database migration is run.', 'warning')
        } finally {
          setPaymentNumberLoading(false)
        }
      }
      
      fetchPaymentNumber()
    }
  }, [id, showToast]) // Only run when editing mode changes (id changes)

  useEffect(() => {
    if (!id && formData.paymentID && formData.paymentID.includes('XXXX') && formData.paymentReceiptDate) {
      const refreshPaymentNumber = async () => {
        setPaymentNumberLoading(true)
        try {
          console.log('[PaymentEntry] Refreshing payment number for new date:', formData.paymentReceiptDate)
          const response = await getNextPaymentNumber(formData.paymentReceiptDate)
          
          let paymentNumber = null
          if (response?.data?.paymentNumber) {
            paymentNumber = response.data.paymentNumber
          } else if (response?.data?.data?.paymentNumber) {
            paymentNumber = response.data.data.paymentNumber
          } else if (response?.paymentNumber) {
            paymentNumber = response.paymentNumber
          } else if (typeof response?.data === 'string' && !response.data.includes('XXXX')) {
            paymentNumber = response.data
          }
          
          if (paymentNumber && !paymentNumber.includes('XXXX') && paymentNumber.startsWith('PAY-')) {
            console.log('[PaymentEntry] ✓ Refreshed payment number:', paymentNumber)
            setFormData((prev) => ({ ...prev, paymentID: paymentNumber }))
          }
        } catch (error) {
          console.error('[PaymentEntry] Failed to refresh payment number:', error)
        } finally {
          setPaymentNumberLoading(false)
        }
      }
      
      const timeoutId = setTimeout(refreshPaymentNumber, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [formData.paymentReceiptDate, id]) // Run when payment receipt date changes
  
  useEffect(() => {
    if (id) {
      const loadPayment = async () => {
        try {
          const response = await getPaymentById(id)
          const paymentData = response?.data || response
          if (paymentData) {
            const payment = paymentData.data || paymentData
            setValues((prev) => {
              const prevForm = prev.formData ?? INITIAL_PAYMENT_STATE.formData
              const prevCharges = prev.charges ?? INITIAL_PAYMENT_STATE.charges
              let invoicePayments = payment.invoice_payments ?? payment.invoicePayments
              if (!Array.isArray(invoicePayments)) invoicePayments = []
              if (invoicePayments.length === 0 && (payment.invoice_id || payment.invoiceId)) {
                invoicePayments = [
                  {
                    rowId: crypto.randomUUID?.() || `edit-${Date.now()}`,
                    invoiceID: payment.invoice_number || payment.invoice_id || payment.invoiceId,
                    invoiceId: payment.invoice_id || payment.invoiceId || '',
                    keyID: payment.po_number || payment.key_id || '',
                    invoice: null,
                    paymentAmount: payment.amount || payment.paymentAmount || '',
                    charges: {
                      tds: payment.tds ?? prevCharges.tds,
                      bankCharges: payment.bank_charges ?? payment.bankCharges ?? prevCharges.bankCharges,
                      penalty: payment.penalty ?? prevCharges.penalty,
                      otherDeductions: payment.other_deductions ?? payment.otherDeductions ?? prevCharges.otherDeductions,
                    },
                    paymentType: payment.payment_type || payment.paymentType || '1st Due',
                    receiptDate: payment.paid_at?.split?.('T')[0] || prevForm.paymentReceiptDate,
                  },
                ]
              }
              invoicePayments = invoicePayments.map((ip, idx) => ({
                ...ip,
                rowId: ip.rowId || crypto.randomUUID?.() || `row-${idx}`,
                invoiceId: ip.invoiceId || ip.invoice_id || '',
              }))
              const nextFormData = {
                ...prevForm,
                paymentID: payment.payment_number || payment.payment_id || payment.paymentID || payment.id || prevForm.paymentID,
                paymentReceiptDate: payment.paid_at?.split('T')[0] || payment.paymentReceiptDate || prevForm.paymentReceiptDate,
                customerName: payment.customer_name || payment.customerName || '',
                customerId: payment.customer_id || payment.customerId || '',
                projectName: payment.project_name || payment.projectName || '',
                packageName: payment.package_name || payment.packageName || '',
                paymentAmount: payment.amount || payment.paymentAmount || '',
                paymentType: payment.payment_type || payment.paymentType || '1st Due',
                bankName: payment.bank_name || payment.bankName || '',
                bankId: payment.bank_id || payment.bankId || '',
                paymentCreditInBankDate: payment.payment_credit_in_bank_date || payment.paymentCreditInBankDate || '',
                invoicePayments,
              }
              const nextCharges = (payment.tds || payment.bank_charges || payment.penalty || payment.other_deductions)
                ? {
                    tds: payment.tds || '',
                    bankCharges: payment.bank_charges || payment.bank_charges || '',
                    penalty: payment.penalty || '',
                    otherDeductions: payment.other_deductions || payment.otherDeductions || '',
                  }
                : prevCharges
              return { ...prev, formData: nextFormData, charges: nextCharges }
            })
            if (payment.customer_id || payment.customerId) {
              setCustomerLocked(true)
            }
          }
        } catch (error) {
          console.error('[PaymentEntry] Failed to load payment:', error)
        }
      }
      loadPayment()
    }
  }, [id, getCustomers])
  
  useEffect(() => {
    if (formData.customerId && formData.customerName) {
      ;(async () => {
        try {
          const invoices = await paymentService.getOpenInvoicesForCustomer(formData.customerId, formData.customerName)
          setOpenInvoices(invoices || [])
        } catch (e) {
          console.error('[PaymentEntry] Failed to load open invoices:', e)
          setOpenInvoices([])
        }
      })()
    } else {
      setOpenInvoices([])
    }
  }, [formData.customerId, formData.customerName])

  const getInvoicePaymentsList = useCallback((list) => (Array.isArray(list) ? list : []), [])

  useEffect(() => {
    if (id) return
    if (formData.customerId && openInvoices.length > 0) {
      const rows = getInvoicePaymentsList(formData.invoicePayments)
      if (rows.length === 0) {
        setFormData((prev) => ({
          ...prev,
          invoicePayments: [createEmptyPaymentRow(charges, formData.paymentType, formData.paymentReceiptDate)],
        }))
      }
    }
  }, [formData.customerId, openInvoices.length, id, getInvoicePaymentsList])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }
  
  const handleCustomerChange = (e) => {
    const customerId = e.target.value

    if (!customerId || customerId === '') {
      setFormData((prev) => ({
        ...prev,
        customerId: '',
        customerName: '',
        projectName: '',
        packageName: '',
        invoicePayments: [],
      }))
      setOpenInvoices([])
      return
    }

    const customer = customers.find((c) => c.id === customerId)
    if (customer) {
      const oneEmptyRow = [createEmptyPaymentRow(charges, formData.paymentType, formData.paymentReceiptDate)]
      setFormData((prev) => ({
        ...prev,
        customerId,
        customerName: customer.name || customer.customerName || '',
        projectName: customer.projectName || customer.values?.projectName || prev.projectName || '',
        packageName: customer.packageName || customer.values?.packageName || prev.packageName || '',
        invoicePayments: oneEmptyRow,
      }))
      showToast(`Customer "${customer.name || customer.customerName}" selected. Select an invoice to add a payment.`, 'success')
    }
  }
  
  const handleInvoiceSelection = (rowIndex, e) => {
    const invoiceID = e.target.value
    if (!invoiceID) {
      setFormData((prev) => {
        const next = [...getInvoicePaymentsList(prev.invoicePayments)]
        next[rowIndex] = createEmptyPaymentRow(charges, formData.paymentType, formData.paymentReceiptDate)
        return { ...prev, invoicePayments: next }
      })
      return
    }
    const openInv = openInvoices.find((inv) => inv.invoiceID === invoiceID)
    if (!openInv) return
    setFormData((prev) => {
      const next = [...getInvoicePaymentsList(prev.invoicePayments)]
      const row = next[rowIndex] || createEmptyPaymentRow(charges, formData.paymentType, formData.paymentReceiptDate)
      next[rowIndex] = {
        ...row,
        invoiceID: openInv.invoiceID,
        invoiceId: openInv.invoiceId || openInv.invoice?.id || '',
        keyID: openInv.keyID,
        invoice: openInv.invoice || openInv,
        paymentAmount: '',
        charges: { ...charges },
        paymentType: formData.paymentType,
        receiptDate: formData.paymentReceiptDate,
      }
      let projectName = prev.projectName
      let packageName = prev.packageName
      const invDetails = openInv.invoice || openInv
      if (invDetails.projectName || invDetails.project_name) projectName = projectName || invDetails.projectName || invDetails.project_name
      if (invDetails.packageName || invDetails.package_name) packageName = packageName || invDetails.packageName || invDetails.package_name
      return { ...prev, invoicePayments: next, projectName, packageName }
    })
  }

  const handleAddNewPayment = () => {
    setFormData((prev) => ({
      ...prev,
      invoicePayments: [...getInvoicePaymentsList(prev.invoicePayments), createEmptyPaymentRow(charges, formData.paymentType, formData.paymentReceiptDate)],
    }))
    showToast('Add an invoice for this payment below.', 'info')
  }

  const handleInvoicePaymentChange = (rowId, field, value) => {
    setFormData((prev) => {
      const list = getInvoicePaymentsList(prev.invoicePayments)
      return {
        ...prev,
        invoicePayments: list.map((ip) => {
          const match = ip.rowId === rowId || ip.invoiceID === rowId
          if (!match) return ip
          return { ...ip, [field]: value }
        }),
      }
    })
  }
  
  const handleChargesChange = (e) => {
    const { name, value } = e.target
    setCharges((prev) => ({ ...prev, [name]: value }))
    setFormData((prev) => ({
      ...prev,
      invoicePayments: getInvoicePaymentsList(prev.invoicePayments).map((ip) => ({
        ...ip,
        charges: { ...(ip.charges || charges), [name]: value },
      })),
    }))
  }
  
  const paymentRows = useMemo(() => {
    const rows = getInvoicePaymentsList(formData.invoicePayments)
    return rows.map((row, idx) => ({
      ...row,
      rowId: row.rowId || row.invoiceID || `row-${idx}-${row.invoiceId || 'new'}`,
    }))
  }, [formData.invoicePayments, getInvoicePaymentsList])
  const validRows = useMemo(
    () =>
      paymentRows.filter(
        (r) => r.invoiceId && r.paymentAmount && Number(r.paymentAmount) > 0
      ),
    [paymentRows]
  )

  const paymentBreakdowns = useMemo(() => {
    return paymentRows
      .filter((row) => row.invoiceId && row.invoice)
      .map((row) => ({
        rowId: row.rowId,
        invoiceID: row.invoiceID,
        breakdown: paymentService.calculatePaymentBreakdownSync(row.invoice, row.paymentAmount || '0', row.charges || charges),
      }))
  }, [paymentRows, charges])
  
  const handleSaveDraft = () => {
    try {
      persistNow()
      showToast('Draft saved successfully!', 'success')
    } catch (error) {
      console.error('Failed to save draft:', error)
      showToast('Failed to save draft. Please try again.', 'error')
    }
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.customerId || !formData.paymentReceiptDate) {
      showToast('Please fill in Customer and Payment Receipt Date.', 'error')
      return
    }

    if (validRows.length === 0) {
      showToast('Please add at least one payment: select an invoice and enter a payment amount.', 'error')
      return
    }

    if (id) {
      const rows = getInvoicePaymentsList(formData.invoicePayments)
      const paymentData = {
        ...formData,
        invoicePayments: rows.map((ip) => ({
          ...ip,
          charges: ip.charges || charges,
          paymentType: ip.paymentType || formData.paymentType,
          receiptDate: ip.receiptDate || formData.paymentReceiptDate,
        })),
      }
      try {
        setSubmitting(true)
        const response = await updatePayment(id, paymentData)
        const savedPayment = response?.data || response
        try {
          window.dispatchEvent(new CustomEvent('paymentUpdated', { detail: { payment: savedPayment } }))
          window.dispatchEvent(new CustomEvent('invoiceUpdated', { detail: { payment: savedPayment } }))
        } catch (ev) {
          console.warn('[PaymentEntry] Failed to dispatch update events:', ev)
        }
        showToast('Payment updated successfully!', 'success')
        if (typeof clearLocalDraft === 'function') clearLocalDraft()
        navigate('/payments')
      } catch (error) {
        console.error('Failed to update payment:', error)
        showToast(error?.message || 'Failed to update payment. Please try again.', 'error')
      } finally {
        setSubmitting(false)
      }
      return
    }

    try {
      setSubmitting(true)
      const paidAt = formData.paymentReceiptDate
      for (let i = 0; i < validRows.length; i++) {
        const row = validRows[i]
        const payload = {
          invoiceId: row.invoiceId,
          amount: Number(row.paymentAmount),
          method: (row.paymentType || formData.paymentType || '1st Due').slice(0, 50),
          reference: formData.bankName || '',
          paidAt: row.receiptDate || paidAt,
        }
        const res = await createPayment(payload)
        const created = res?.data ?? res
        try {
          window.dispatchEvent(new CustomEvent('paymentUpdated', { detail: { payment: created } }))
          window.dispatchEvent(new CustomEvent('invoiceUpdated', { detail: { payment: created } }))
        } catch (ev) {
          console.warn('[PaymentEntry] Failed to dispatch update events:', ev)
        }
      }
      showToast(
        validRows.length === 1
          ? 'Payment created successfully!'
          : `${validRows.length} payments created successfully!`,
        'success'
      )
      if (typeof clearLocalDraft === 'function') clearLocalDraft()
      navigate('/payments')
    } catch (error) {
      console.error('Failed to save payment(s):', error)
      showToast(error?.message || 'Failed to save payment(s). Please try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }
  
  return (
    <div className="payment-entry-page">
      {/* Page Header */}
      <div className="payment-entry-header">
        <button
          type="button"
          onClick={() => navigate('/payments')}
          className="payment-entry-back-button"
          aria-label="Back"
        >
          <ArrowLeft className="payment-entry-back-icon" />
          <span>Back</span>
        </button>
        
        <div className="payment-entry-header-content">
          <h1 className="payment-entry-title">Payment Entry</h1>
          {formData.paymentID && (
            <p className="payment-entry-subtitle">Payment ID: {formData.paymentID}</p>
          )}
        </div>
        
        <div className="payment-entry-header-actions">
          <button
            type="button"
            onClick={() => setShowFieldSelector(true)}
            className="payment-entry-action-button payment-entry-action-button-secondary"
          >
            <span>Field Selection</span>
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            className="payment-entry-action-button payment-entry-action-button-secondary"
          >
            <Save className="payment-entry-action-icon" />
            <span>Save Draft</span>
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="payment-entry-form">
        {/* Payment Header Section */}
        <div className="payment-entry-section">
          <h2 className="payment-entry-section-title">Payment Header</h2>
          <div className="payment-entry-form-grid">
            <div className="payment-entry-field">
              <label htmlFor="paymentID" className="payment-entry-label">
                Payment ID <span className="payment-entry-required">*</span>
              </label>
              <input
                type="text"
                id="paymentID"
                name="paymentID"
                value={paymentNumberLoading ? 'Loading...' : (formData.paymentID || 'PAY-XXXX-XXXX')}
                className="payment-entry-input payment-entry-input-readonly"
                readOnly
                disabled={paymentNumberLoading}
              />
              <small className="payment-entry-hint">
                {paymentNumberLoading 
                  ? 'Generating payment number...' 
                  : formData.paymentID && formData.paymentID.includes('XXXX')
                    ? 'Payment number will be generated when you save'
                    : 'Auto-generated, immutable'
                }
              </small>
            </div>
            
            <div className="payment-entry-field">
              <label htmlFor="paymentReceiptDate" className="payment-entry-label">
                Payment Receipt Date <span className="payment-entry-required">*</span>
              </label>
              <DatePicker
                selected={formData.paymentReceiptDate}
                onChange={handleChange}
                name="paymentReceiptDate"
                id="paymentReceiptDate"
                required
              />
            </div>
          </div>
        </div>

        {/* Customer & Project Section */}
        <div className="payment-entry-section">
          <h2 className="payment-entry-section-title">Customer & Project Details</h2>
          <div className="payment-entry-form-grid">
            <div className="payment-entry-field">
              <label htmlFor="customerId" className="payment-entry-label">
                Customer Name <span className="payment-entry-required">*</span>
              </label>
              <select
                id="customerId"
                name="customerId"
                value={formData.customerId}
                onChange={handleCustomerChange}
                className="payment-entry-select"
                required
                disabled={customersLoading}
              >
                <option value="">
                  {customersLoading ? 'Loading customers...' : customers.length === 0 ? 'No customers available' : 'Select Customer'}
                </option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name || customer.customerName || 'Unnamed Customer'}
                  </option>
                ))}
              </select>
              {/* Display selected customer name automatically */}
              {formData.customerId && formData.customerName && (
                <input
                  type="text"
                  readOnly
                  value={formData.customerName}
                  className="payment-entry-input payment-entry-input-readonly"
                  style={{ marginTop: '8px', backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                  placeholder="Selected customer name"
                />
              )}
              {customersLoading && (
                <small className="payment-entry-hint">Loading customers...</small>
              )}
              {!customersLoading && customers.length === 0 && (
                <small className="payment-entry-hint" style={{ color: '#ef4444' }}>
                  No customers found. Please add customers in Master Data first.
                </small>
              )}
            </div>
            
            <div className="payment-entry-field">
              <label htmlFor="projectName" className="payment-entry-label">
                Name of the Project
              </label>
              <input
                type="text"
                id="projectName"
                name="projectName"
                value={formData.projectName}
                onChange={handleChange}
                className="payment-entry-input"
                placeholder="Enter project name"
              />
            </div>
            
            <div className="payment-entry-field">
              <label htmlFor="packageName" className="payment-entry-label">
                Package Name
              </label>
              <input
                type="text"
                id="packageName"
                name="packageName"
                value={formData.packageName}
                onChange={handleChange}
                className="payment-entry-input"
                placeholder="Enter package name"
              />
            </div>
          </div>
        </div>

        {formData.customerId && openInvoices.length === 0 && (
          <div className="payment-entry-section">
            <div className="payment-entry-info">
              <p>No open invoices found for this customer.</p>
            </div>
          </div>
        )}

        {/* Payment & Charges: one block per row (invoice selection + amount/charges) */}
        {formData.customerId && openInvoices.length > 0 && (
          <div className="payment-entry-section">
            <h2 className="payment-entry-section-title">
              Payment & Charges
              <Calculator className="payment-entry-section-icon" />
            </h2>

            {paymentRows.map((row, rowIndex) => (
              <div key={row.rowId || row.invoiceID || `row-${rowIndex}`} className="payment-entry-invoice-breakdown">
                <div className="payment-entry-form-grid" style={{ marginBottom: row.invoiceId ? 16 : 0 }}>
                  <div className="payment-entry-field payment-entry-field-full">
                    <label htmlFor={`invoiceSelection-${row.rowId}`} className="payment-entry-label">
                      {row.invoiceId ? `Invoice: ${row.invoiceID} | PO: ${row.keyID}` : `Select Invoice (Payment #${rowIndex + 1})`}
                    </label>
                    <select
                      id={`invoiceSelection-${row.rowId}`}
                      value={row.invoiceID || ''}
                      onChange={(e) => handleInvoiceSelection(rowIndex, e)}
                      className="payment-entry-select"
                    >
                      <option value="">Select Invoice</option>
                      {openInvoices.map((inv) => (
                        <option key={`${inv.invoiceID}-${row.rowId}`} value={inv.invoiceID}>
                          {inv.invoiceID}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {row.invoiceId && (
                  <>
                    <div className="payment-entry-form-grid">
                      <div className="payment-entry-field">
                        <label className="payment-entry-label">Invoice Amount</label>
                        <input
                          type="text"
                          value={paymentBreakdowns.find((b) => b.rowId === row.rowId)?.breakdown?.invoiceAmount || '0.00'}
                          className="payment-entry-input payment-entry-input-readonly"
                          readOnly
                        />
                      </div>
                      <div className="payment-entry-field">
                        <label className="payment-entry-label">
                          Payment Amount (This Receipt) <span className="payment-entry-required">*</span>
                        </label>
                        <input
                          type="number"
                          value={row.paymentAmount || ''}
                          onChange={(e) => handleInvoicePaymentChange(row.rowId, 'paymentAmount', e.target.value)}
                          className="payment-entry-input"
                          step="0.01"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="payment-entry-field">
                        <label className="payment-entry-label">Previous Received</label>
                        <input
                          type="text"
                          value={paymentBreakdowns.find((b) => b.rowId === row.rowId)?.breakdown?.previousReceivedAmount || '0.00'}
                          className="payment-entry-input payment-entry-input-readonly"
                          readOnly
                        />
                      </div>
                      <div className="payment-entry-field">
                        <label className="payment-entry-label">Outstanding (Before This Payment)</label>
                        <input
                          type="text"
                          value={paymentBreakdowns.find((b) => b.rowId === row.rowId)?.breakdown?.outstandingAmount || '0.00'}
                          className="payment-entry-input payment-entry-input-readonly"
                          readOnly
                        />
                      </div>
                      <div className="payment-entry-field">
                        <label className="payment-entry-label">TDS</label>
                        <input
                          type="number"
                          value={row.charges?.tds ?? charges.tds ?? ''}
                          onChange={(e) => handleInvoicePaymentChange(row.rowId, 'charges', { ...row.charges, tds: e.target.value })}
                          className="payment-entry-input"
                          step="0.01"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="payment-entry-field">
                        <label className="payment-entry-label">Bank Charges</label>
                        <input
                          type="number"
                          value={row.charges?.bankCharges ?? charges.bankCharges ?? ''}
                          onChange={(e) => handleInvoicePaymentChange(row.rowId, 'charges', { ...row.charges, bankCharges: e.target.value })}
                          className="payment-entry-input"
                          step="0.01"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="payment-entry-field">
                        <label className="payment-entry-label">Penalty / LD</label>
                        <input
                          type="number"
                          value={row.charges?.penalty ?? charges.penalty ?? ''}
                          onChange={(e) => handleInvoicePaymentChange(row.rowId, 'charges', { ...row.charges, penalty: e.target.value })}
                          className="payment-entry-input"
                          step="0.01"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="payment-entry-field">
                        <label className="payment-entry-label">Other Deductions</label>
                        <input
                          type="number"
                          value={row.charges?.otherDeductions ?? charges.otherDeductions ?? ''}
                          onChange={(e) => handleInvoicePaymentChange(row.rowId, 'charges', { ...row.charges, otherDeductions: e.target.value })}
                          className="payment-entry-input"
                          step="0.01"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="payment-entry-field">
                        <label className="payment-entry-label">Total Charges</label>
                        <input
                          type="text"
                          value={paymentBreakdowns.find((b) => b.rowId === row.rowId)?.breakdown?.totalCharges || '0.00'}
                          className="payment-entry-input payment-entry-input-readonly payment-entry-input-calculated"
                          readOnly
                        />
                      </div>
                      <div className="payment-entry-field">
                        <label className="payment-entry-label">Net Amount Received</label>
                        <input
                          type="text"
                          value={paymentBreakdowns.find((b) => b.rowId === row.rowId)?.breakdown?.netAmountReceived || '0.00'}
                          className="payment-entry-input payment-entry-input-readonly payment-entry-input-calculated"
                          readOnly
                        />
                      </div>
                      <div className="payment-entry-field">
                        <label className="payment-entry-label">Remaining Balance</label>
                        <input
                          type="text"
                          value={paymentBreakdowns.find((b) => b.rowId === row.rowId)?.breakdown?.remainingBalance || '0.00'}
                          className="payment-entry-input payment-entry-input-readonly payment-entry-input-calculated"
                          readOnly
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}

            <div style={{ marginTop: 8, marginBottom: 16 }}>
              <button
                type="button"
                onClick={handleAddNewPayment}
                className="payment-entry-button payment-entry-button-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                <Plus size={18} />
                Add new payment for same customer
              </button>
              <small className="payment-entry-hint" style={{ display: 'block', marginTop: 8 }}>
                Select another invoice above, then add payment amount. Submit to create all payments at once.
              </small>
            </div>

            <div className="payment-entry-form-grid">
              <div className="payment-entry-field">
                <label htmlFor="paymentType" className="payment-entry-label">
                  Payment Type <span className="payment-entry-required">*</span>
                </label>
                <select
                  id="paymentType"
                  name="paymentType"
                  value={formData.paymentType}
                  onChange={handleChange}
                  className="payment-entry-select"
                >
                  <option value="1st Due">1st Due</option>
                  <option value="2nd Due">2nd Due</option>
                  <option value="3rd Due">3rd Due</option>
                </select>
              </div>
              <div className="payment-entry-field">
                <label htmlFor="bankName" className="payment-entry-label">
                  Amount Credit Bank Name
                </label>
                <input
                  type="text"
                  id="bankName"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  className="payment-entry-input"
                  placeholder="Enter bank name"
                />
              </div>
              <div className="payment-entry-field">
                <label htmlFor="paymentCreditInBankDate" className="payment-entry-label">
                  Payment Credit in Bank Date
                </label>
                <DatePicker
                  selected={formData.paymentCreditInBankDate}
                  onChange={handleChange}
                  name="paymentCreditInBankDate"
                  id="paymentCreditInBankDate"
                />
              </div>
            </div>
          </div>
        )}

        <div className="payment-entry-actions">
          <button
            type="button"
            onClick={() => navigate('/payments')}
            className="payment-entry-button payment-entry-button-secondary"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="payment-entry-button payment-entry-button-primary"
            disabled={submitting || validRows.length === 0}
          >
            {submitting ? 'Saving…' : validRows.length > 1 ? `Submit ${validRows.length} Payments` : 'Submit Payment'}
          </button>
        </div>
      </form>

      {showFieldSelector && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: 16 }} onClick={() => setShowFieldSelector(false)}>
          <div style={{ width: '100%', maxWidth: 760, maxHeight: '80vh', overflow: 'hidden', background: '#fff', border: '1px solid #d6dde7', borderRadius: 12, display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Field Selection</h3>
              <button type="button" onClick={() => setShowFieldSelector(false)} className="payment-entry-action-button payment-entry-action-button-secondary" aria-label="Close field selection">
                Close
              </button>
            </div>
            <div style={{ overflow: 'auto', padding: 16 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', border: '1px solid #e5e7eb', padding: 10, background: '#f3f4f6' }}>Field Name</th>
                    <th style={{ textAlign: 'center', border: '1px solid #e5e7eb', padding: 10, background: '#f3f4f6', width: 120 }}>Show</th>
                  </tr>
                </thead>
                <tbody>
                  {availableFields.map((field) => {
                    const checked = !hiddenFieldKeys.includes(field.key)
                    return (
                      <tr key={field.key}>
                        <td style={{ border: '1px solid #e5e7eb', padding: 10 }}>{field.label}</td>
                        <td style={{ border: '1px solid #e5e7eb', padding: 10, textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const show = e.target.checked
                              setHiddenFieldKeys((prev) =>
                                show ? prev.filter((k) => k !== field.key) : prev.includes(field.key) ? prev : [...prev, field.key]
                              )
                            }}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '14px 16px', borderTop: '1px solid #e5e7eb' }}>
              <button type="button" className="payment-entry-action-button payment-entry-action-button-secondary" onClick={() => setHiddenFieldKeys([])}>
                Reset
              </button>
              <button type="button" className="payment-entry-action-button payment-entry-action-button-secondary" onClick={() => setShowFieldSelector(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PaymentEntry

