import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Calculator, TrendingUp, Calendar as CalendarIcon } from 'lucide-react'
import DatePicker from '../components/DatePicker'
import { useMasterData } from '../contexts/MasterDataContext'
import { useToast } from '../contexts/ToastContext'
import { usePersistedFormState } from '../hooks/usePersistedFormState'
import * as paymentService from '../services/paymentService'
import * as invoiceService from '../services/invoiceService'
import * as masterDataService from '../services/masterDataService'
import { getPaymentById, updatePayment, getNextPaymentNumber } from '../api/payment'
import '../styles/PaymentEntry.css'

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
  const [selectedInvoices, setSelectedInvoices] = useState([])
  const [customerLocked, setCustomerLocked] = useState(false)
  
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
  
  // Ensure new payments start with no customer pre-selected
  useEffect(() => {
    if (!id) {
      setFormData((prev) => ({
        ...prev,
        customerId: '',
        customerName: '',
        projectName: '',
        packageName: '',
      }))
      setCustomerLocked(false)
      setOpenInvoices([])
      setSelectedInvoices([])
    }
  }, [id, setFormData])
  
  // Update customers when master data loads
  useEffect(() => {
    const loadCustomers = async () => {
      setCustomersLoading(true)
      try {
        // First try to get from context
        let customersList = getCustomers()
        
        // If context doesn't have customers yet, fetch directly
        if (!customersList || customersList.length === 0) {
          console.log('[PaymentEntry] Customers not in context, fetching directly...')
          customersList = await masterDataService.getCustomers()
        }
        
        // Transform customers to ensure they have a name property
        const transformedCustomers = customersList.map((customer) => {
          // Extract name from values if it's a master data record
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

  // Fetch payment number from backend
  useEffect(() => {
    // Only fetch if not editing an existing payment
    if (id) return
    
    // Fetch if paymentID is missing OR contains "XXXX" (placeholder)
    const needsPaymentNumber = !formData.paymentID || formData.paymentID.includes('XXXX')
    
    if (needsPaymentNumber) {
      const fetchPaymentNumber = async () => {
        setPaymentNumberLoading(true)
        try {
          console.log('[PaymentEntry] Fetching payment number for date:', formData.paymentReceiptDate)
          const response = await getNextPaymentNumber(formData.paymentReceiptDate || null)
          
          console.log('[PaymentEntry] Payment number API response:', response)
          
          // Handle different response structures
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
            // Fallback to client-side generation
            const generatedID = paymentService.generatePaymentID()
            setFormData((prev) => ({ ...prev, paymentID: generatedID }))
            showToast('Could not fetch payment number from server. Using placeholder.', 'warning')
          }
        } catch (error) {
          console.error('[PaymentEntry] Failed to fetch payment number:', error)
          // Fallback to client-side generation if backend fails
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

  // Refresh payment number when payment receipt date changes (for new payments only)
  useEffect(() => {
    // Only refresh if not editing and paymentID exists but contains XXXX
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
      
      // Debounce to avoid too many requests
      const timeoutId = setTimeout(refreshPaymentNumber, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [formData.paymentReceiptDate, id]) // Run when payment receipt date changes
  
  // Load existing payment data when editing (ID present)
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
                invoicePayments: payment.invoice_payments || payment.invoicePayments || [],
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
  
  // Fetch open invoices when customer is selected
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
      setSelectedInvoices([])
    }
  }, [formData.customerId, formData.customerName])
  
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }
  
  const handleCustomerChange = (e) => {
    const customerId = e.target.value
    
    // If "Select Customer" is selected, clear customer data
    if (!customerId || customerId === '') {
      setFormData((prev) => ({
        ...prev,
        customerId: '',
        customerName: '',
        projectName: '',
        packageName: '',
      }))
      setOpenInvoices([])
      setSelectedInvoices([])
      return
    }
    
    const customer = customers.find((c) => c.id === customerId)
    
    if (customer) {
      // Auto-populate all customer-related fields
      setFormData((prev) => ({
        ...prev,
        customerId,
        customerName: customer.name || customer.customerName || '',
        // Auto-populate project name if available in customer data
        projectName: customer.projectName || customer.values?.projectName || prev.projectName || '',
        // Auto-populate package name if available in customer data
        packageName: customer.packageName || customer.values?.packageName || prev.packageName || '',
      }))
      // Show toast notification
      showToast(`Customer "${customer.name || customer.customerName}" selected. Customer details loaded.`, 'success')
    }
  }
  
  const handleInvoiceSelection = (e) => {
    const invoiceID = e.target.value

    if (!invoiceID) {
      // If user clears selection, reset invoices/payment mappings
      setSelectedInvoices([])
      setFormData((prev) => ({ ...prev, invoicePayments: [] }))
      return
    }

    const selected = openInvoices.filter((inv) => inv.invoiceID === invoiceID)
    setSelectedInvoices(selected)
    
    // Initialize invoice payments for the single selected invoice
    const invoicePayments = selected.map((inv) => ({
      invoiceID: inv.invoiceID,
      keyID: inv.keyID,
      paymentAmount: '',
      paymentType: formData.paymentType,
      receiptDate: formData.paymentReceiptDate,
      charges: { ...charges },
    }))
    
    // Also auto-populate project and package name from the selected invoice when available,
    // but keep any existing manual values if already entered.
    const first = selected[0]
    setFormData((prev) => {
      const invoiceDetails = first?.invoice || {}
      const autoProject =
        invoiceDetails.projectName ||
        invoiceDetails.project_name ||
        prev.projectName ||
        ''
      const autoPackage =
        invoiceDetails.packageName ||
        invoiceDetails.package_name ||
        prev.packageName ||
        ''

      return {
        ...prev,
        projectName: prev.projectName || autoProject,
        packageName: prev.packageName || autoPackage,
        invoicePayments,
      }
    })
  }
  
  const handleInvoicePaymentChange = (invoiceID, field, value) => {
    setFormData((prev) => ({
      ...prev,
      invoicePayments: prev.invoicePayments.map((ip) =>
        ip.invoiceID === invoiceID ? { ...ip, [field]: value } : ip
      ),
    }))
  }
  
  const handleChargesChange = (e) => {
    const { name, value } = e.target
    setCharges((prev) => ({ ...prev, [name]: value }))
    
    // Update charges in all invoice payments
    setFormData((prev) => ({
      ...prev,
      invoicePayments: prev.invoicePayments.map((ip) => ({
        ...ip,
        charges: { ...charges, [name]: value },
      })),
    }))
  }
  
  // Calculate payment breakdown for each selected invoice
  const paymentBreakdowns = useMemo(() => {
    return selectedInvoices.map((invoice) => {
      const invoicePayment = formData.invoicePayments.find((ip) => ip.invoiceID === invoice.invoiceID)
      const paymentAmount = invoicePayment?.paymentAmount || formData.paymentAmount || '0'
      const invoiceCharges = invoicePayment?.charges || charges
      
      return {
        invoiceID: invoice.invoiceID,
        breakdown: paymentService.calculatePaymentBreakdownSync(invoice.invoice, paymentAmount, invoiceCharges),
      }
    })
  }, [selectedInvoices, formData.invoicePayments, formData.paymentAmount, charges])
  
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
    
    // Validate required fields
    if (!formData.customerId || !formData.paymentReceiptDate || !formData.paymentAmount) {
      showToast('Please fill in all required fields (Customer, Payment Receipt Date, Payment Amount)', 'error')
      return
    }
    
    if (selectedInvoices.length === 0) {
      showToast('Please select at least one invoice', 'error')
      return
    }
    
    // Prepare payment data
    const paymentData = {
      ...formData,
      invoicePayments: formData.invoicePayments.map((ip) => ({
        ...ip,
        charges: ip.charges || charges,
        paymentType: ip.paymentType || formData.paymentType,
        receiptDate: ip.receiptDate || formData.paymentReceiptDate,
      })),
    }
    
    // Save payment (this will also update invoice balances)
    try {
      let savedPayment
      if (id) {
        // Update existing payment
        const response = await updatePayment(id, paymentData)
        savedPayment = response?.data || response
        // Ensure the rest of the app (Dashboard/Reports/Indexes) refreshes on edit as well
        try {
          window.dispatchEvent(new CustomEvent('paymentUpdated', { detail: { payment: savedPayment } }))
          // Payments affect invoice balances/outstanding amounts too
          window.dispatchEvent(new CustomEvent('invoiceUpdated', { detail: { payment: savedPayment } }))
        } catch (e) {
          console.warn('[PaymentEntry] Failed to dispatch update events:', e)
        }
      } else {
        // Create new payment
        savedPayment = await paymentService.savePayment(paymentData)
      }
      
      // Re-fetch the saved payment to ensure UI is synced with backend
      if (savedPayment?.id || id) {
        try {
          const refreshedPayment = await getPaymentById(savedPayment?.id || id)
          const paymentData = refreshedPayment?.data || refreshedPayment
          if (paymentData) {
            const payment = paymentData.data || paymentData
            // Update form with refreshed data
            setFormData(prev => ({
              ...prev,
              paymentID: payment.payment_number || payment.payment_id || payment.paymentID || payment.id || prev.paymentID,
              paymentReceiptDate: payment.paid_at?.split('T')[0] || payment.paymentReceiptDate || prev.paymentReceiptDate,
              paymentAmount: payment.amount || payment.paymentAmount || prev.paymentAmount,
            }))
          }
        } catch (refreshError) {
          console.warn('[PaymentEntry] Failed to refresh payment after save:', refreshError)
          // Continue anyway - save was successful
        }
      }
      
      showToast(`Payment ${savedPayment?.paymentID || savedPayment?.id || formData.paymentID || ''} saved successfully!`, 'success')
      if (typeof clearLocalDraft === 'function') clearLocalDraft()
      navigate('/payments')
    } catch (error) {
      console.error('Failed to save payment:', error)
      showToast('Failed to save payment. Please try again.', 'error')
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

        {/* Invoice Selection Section */}
        {formData.customerId && openInvoices.length > 0 && (
          <div className="payment-entry-section">
            <h2 className="payment-entry-section-title">Invoice Selection</h2>
            <div className="payment-entry-form-grid">
              <div className="payment-entry-field payment-entry-field-full">
                <label htmlFor="invoiceSelection" className="payment-entry-label">
                  Select Invoice <span className="payment-entry-required">*</span>
                </label>
                <select
                  id="invoiceSelection"
                  name="invoiceSelection"
                  onChange={handleInvoiceSelection}
                  className="payment-entry-select"
                  required
                >
                  <option value="">Select Invoice</option>
                  {openInvoices.map((invoice) => (
                    <option key={invoice.invoiceID} value={invoice.invoiceID}>
                      {invoice.invoiceID}
                    </option>
                  ))}
                </select>
                <small className="payment-entry-hint">Choose the invoice number to allocate this payment.</small>
              </div>
            </div>
          </div>
        )}

        {formData.customerId && openInvoices.length === 0 && (
          <div className="payment-entry-section">
            <div className="payment-entry-info">
              <p>No open invoices found for this customer.</p>
            </div>
          </div>
        )}

        {/* Payment & Charges Section */}
        {selectedInvoices.length > 0 && (
          <div className="payment-entry-section">
            <h2 className="payment-entry-section-title">
              Payment & Charges
              <Calculator className="payment-entry-section-icon" />
            </h2>
            
            {selectedInvoices.map((invoice) => {
              const breakdown = paymentBreakdowns.find((b) => b.invoiceID === invoice.invoiceID)?.breakdown
              const invoicePayment = formData.invoicePayments.find((ip) => ip.invoiceID === invoice.invoiceID)
              
              return (
                <div key={invoice.invoiceID} className="payment-entry-invoice-breakdown">
                  <h3 className="payment-entry-invoice-title">
                    Invoice: {invoice.invoiceID} | PO: {invoice.keyID}
                  </h3>
                  
                  <div className="payment-entry-form-grid">
                    <div className="payment-entry-field">
                      <label className="payment-entry-label">Invoice Amount</label>
                      <input
                        type="text"
                        value={breakdown?.invoiceAmount || '0.00'}
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
                        value={invoicePayment?.paymentAmount || formData.paymentAmount || ''}
                        onChange={(e) => handleInvoicePaymentChange(invoice.invoiceID, 'paymentAmount', e.target.value)}
                        className="payment-entry-input"
                        step="0.01"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    
                    <div className="payment-entry-field">
                      <label className="payment-entry-label">Previous Received Amount</label>
                      <input
                        type="text"
                        value={breakdown?.previousReceivedAmount || '0.00'}
                        className="payment-entry-input payment-entry-input-readonly"
                        readOnly
                      />
                    </div>
                    
                    <div className="payment-entry-field">
                      <label className="payment-entry-label">Outstanding Amount (Before This Payment)</label>
                      <input
                        type="text"
                        value={breakdown?.outstandingAmount || '0.00'}
                        className="payment-entry-input payment-entry-input-readonly"
                        readOnly
                      />
                    </div>
                    
                    <div className="payment-entry-field">
                      <label className="payment-entry-label">TDS</label>
                      <input
                        type="number"
                        value={invoicePayment?.charges?.tds || charges.tds || ''}
                        onChange={(e) => {
                          const newCharges = { ...charges, tds: e.target.value }
                          handleInvoicePaymentChange(invoice.invoiceID, 'charges', newCharges)
                        }}
                        className="payment-entry-input"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="payment-entry-field">
                      <label className="payment-entry-label">Bank Charges</label>
                      <input
                        type="number"
                        value={invoicePayment?.charges?.bankCharges || charges.bankCharges || ''}
                        onChange={(e) => {
                          const newCharges = { ...charges, bankCharges: e.target.value }
                          handleInvoicePaymentChange(invoice.invoiceID, 'charges', newCharges)
                        }}
                        className="payment-entry-input"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="payment-entry-field">
                      <label className="payment-entry-label">Penalty / LD</label>
                      <input
                        type="number"
                        value={invoicePayment?.charges?.penalty || charges.penalty || ''}
                        onChange={(e) => {
                          const newCharges = { ...charges, penalty: e.target.value }
                          handleInvoicePaymentChange(invoice.invoiceID, 'charges', newCharges)
                        }}
                        className="payment-entry-input"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="payment-entry-field">
                      <label className="payment-entry-label">Other Deductions</label>
                      <input
                        type="number"
                        value={invoicePayment?.charges?.otherDeductions || charges.otherDeductions || ''}
                        onChange={(e) => {
                          const newCharges = { ...charges, otherDeductions: e.target.value }
                          handleInvoicePaymentChange(invoice.invoiceID, 'charges', newCharges)
                        }}
                        className="payment-entry-input"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="payment-entry-field">
                      <label className="payment-entry-label">Total Charges (Calculated)</label>
                      <input
                        type="text"
                        value={breakdown?.totalCharges || '0.00'}
                        className="payment-entry-input payment-entry-input-readonly payment-entry-input-calculated"
                        readOnly
                      />
                    </div>
                    
                    <div className="payment-entry-field">
                      <label className="payment-entry-label">Net Amount Received (Calculated)</label>
                      <input
                        type="text"
                        value={breakdown?.netAmountReceived || '0.00'}
                        className="payment-entry-input payment-entry-input-readonly payment-entry-input-calculated"
                        readOnly
                      />
                    </div>
                    
                    <div className="payment-entry-field">
                      <label className="payment-entry-label">Remaining Invoice Balance (Calculated)</label>
                      <input
                        type="text"
                        value={breakdown?.remainingBalance || '0.00'}
                        className="payment-entry-input payment-entry-input-readonly payment-entry-input-calculated"
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              )
            })}
            
            {/* Payment Type & Bank Details */}
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
                  required
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

        {/* Form Actions */}
        <div className="payment-entry-actions">
          <button
            type="button"
            onClick={() => navigate('/payments')}
            className="payment-entry-button payment-entry-button-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="payment-entry-button payment-entry-button-primary"
            disabled={selectedInvoices.length === 0}
          >
            Submit Payment
          </button>
        </div>
      </form>
    </div>
  )
}

export default PaymentEntry

