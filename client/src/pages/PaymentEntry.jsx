import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Calculator, TrendingUp, Calendar } from 'lucide-react'
import { useMasterData } from '../contexts/MasterDataContext'
import * as paymentService from '../services/paymentService'
import * as invoiceService from '../services/invoiceService'
import '../styles/PaymentEntry.css'

function PaymentEntry() {
  const navigate = useNavigate()
  const { getCustomers } = useMasterData()
  
  const [customers, setCustomers] = useState([])
  const [openInvoices, setOpenInvoices] = useState([])
  const [selectedInvoices, setSelectedInvoices] = useState([])
  const [customerLocked, setCustomerLocked] = useState(false)
  
  const [formData, setFormData] = useState({
    // Payment Header
    paymentID: '', // Auto-generated, immutable
    paymentReceiptDate: new Date().toISOString().split('T')[0],
    
    // Customer & Project
    customerName: '',
    customerId: '',
    projectName: '',
    packageName: '',
    
    // Payment Details
    paymentAmount: '',
    paymentType: '1st Due', // 1st Due / 2nd Due / 3rd Due
    
    // Bank Details
    bankName: '',
    bankId: '',
    paymentCreditInBankDate: '',
    
    // Invoice Payments (array for multiple invoices)
    invoicePayments: [],
  })
  
  const [charges, setCharges] = useState({
    tds: '',
    bankCharges: '',
    penalty: '',
    otherDeductions: '',
  })
  
  useEffect(() => {
    // Load Master Data
    setCustomers(getCustomers())
    
    // Auto-generate Payment ID
    if (!formData.paymentID) {
      const generatedID = paymentService.generatePaymentID()
      setFormData((prev) => ({ ...prev, paymentID: generatedID }))
    }
  }, [getCustomers])
  
  // Fetch open invoices when customer is selected
  useEffect(() => {
    if (formData.customerId && customerLocked) {
      ;(async () => {
        try {
          const invoices = await paymentService.getOpenInvoicesForCustomer(formData.customerId)
          setOpenInvoices(invoices || [])
        } catch (e) {
          console.error('Failed to load open invoices:', e)
          setOpenInvoices([])
        }
      })()
    } else {
      setOpenInvoices([])
      setSelectedInvoices([])
    }
  }, [formData.customerId, customerLocked])
  
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }
  
  const handleCustomerChange = (e) => {
    if (customerLocked) return // Prevent changes once locked
    
    const customerId = e.target.value
    const customer = customers.find((c) => c.id === customerId)
    
    if (customer) {
      setFormData((prev) => ({
        ...prev,
        customerId,
        customerName: customer.name || customer.customerName || '',
      }))
      setCustomerLocked(true) // Lock after selection
    }
  }
  
  const handleInvoiceSelection = (e) => {
    const invoiceIDs = Array.from(e.target.selectedOptions, (option) => option.value)
    const selected = openInvoices.filter((inv) => invoiceIDs.includes(inv.invoiceID))
    setSelectedInvoices(selected)
    
    // Initialize invoice payments
    const invoicePayments = selected.map((inv) => ({
      invoiceID: inv.invoiceID,
      keyID: inv.keyID,
      paymentAmount: '',
      paymentType: formData.paymentType,
      receiptDate: formData.paymentReceiptDate,
      charges: { ...charges },
    }))
    
    setFormData((prev) => ({ ...prev, invoicePayments }))
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
      const draft = {
        ...formData,
        charges,
        savedAt: new Date().toISOString(),
        draft: true,
      }
      localStorage.setItem('paymentEntryDraft', JSON.stringify(draft))
      alert('Draft saved successfully!')
    } catch (error) {
      console.error('Failed to save draft:', error)
      alert('Failed to save draft. Please try again.')
    }
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.customerId || !formData.paymentReceiptDate || !formData.paymentAmount) {
      alert('Please fill in all required fields (Customer, Payment Receipt Date, Payment Amount)')
      return
    }
    
    if (selectedInvoices.length === 0) {
      alert('Please select at least one invoice')
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
      const payment = await paymentService.savePayment(paymentData)
      alert(`Payment ${payment?.paymentID || payment?.id || ''} saved successfully!`)
      navigate('/payments')
    } catch (error) {
      console.error('Failed to save payment:', error)
      alert('Failed to save payment. Please try again.')
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
                value={formData.paymentID}
                className="payment-entry-input payment-entry-input-readonly"
                readOnly
              />
              <small className="payment-entry-hint">Auto-generated, immutable</small>
            </div>
            
            <div className="payment-entry-field">
              <label htmlFor="paymentReceiptDate" className="payment-entry-label">
                Payment Receipt Date <span className="payment-entry-required">*</span>
              </label>
              <input
                type="date"
                id="paymentReceiptDate"
                name="paymentReceiptDate"
                value={formData.paymentReceiptDate}
                onChange={handleChange}
                className="payment-entry-input"
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
                disabled={customerLocked}
              >
                <option value="">Select Customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name || customer.customerName}
                  </option>
                ))}
              </select>
              {customerLocked && (
                <small className="payment-entry-hint">Customer selection is locked. Clear form to change.</small>
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
                className="payment-entry-input payment-entry-input-readonly"
                readOnly={customerLocked}
                placeholder={customerLocked ? 'Locked after customer selection' : 'Enter project name'}
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
                className="payment-entry-input payment-entry-input-readonly"
                readOnly={customerLocked}
                placeholder={customerLocked ? 'Locked after customer selection' : 'Enter package name'}
              />
            </div>
          </div>
        </div>

        {/* Invoice Selection Section */}
        {customerLocked && openInvoices.length > 0 && (
          <div className="payment-entry-section">
            <h2 className="payment-entry-section-title">Invoice Selection</h2>
            <div className="payment-entry-form-grid">
              <div className="payment-entry-field payment-entry-field-full">
                <label htmlFor="invoiceSelection" className="payment-entry-label">
                  Select Invoices <span className="payment-entry-required">*</span>
                </label>
                <select
                  id="invoiceSelection"
                  name="invoiceSelection"
                  multiple
                  onChange={handleInvoiceSelection}
                  className="payment-entry-select payment-entry-select-multiple"
                  size="5"
                  required
                >
                  {openInvoices.map((invoice) => (
                    <option key={invoice.invoiceID} value={invoice.invoiceID}>
                      {invoice.invoiceID} | PO: {invoice.keyID} | Date: {invoice.invoiceDate} | 
                      Amount: ₹{invoice.totalInvoiceValue} | Balance: ₹{invoice.outstandingBalance} | 
                      Due: {invoice.dueType}
                    </option>
                  ))}
                </select>
                <small className="payment-entry-hint">
                  Hold Ctrl/Cmd to select multiple invoices. Selected: {selectedInvoices.length}
                </small>
              </div>
            </div>
          </div>
        )}

        {customerLocked && openInvoices.length === 0 && (
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
                      <label className="payment-entry-label">Previous Received Amount</label>
                      <input
                        type="text"
                        value={breakdown?.previousReceivedAmount || '0.00'}
                        className="payment-entry-input payment-entry-input-readonly"
                        readOnly
                      />
                    </div>
                    
                    <div className="payment-entry-field">
                      <label className="payment-entry-label">Outstanding Amount</label>
                      <input
                        type="text"
                        value={breakdown?.outstandingAmount || '0.00'}
                        className="payment-entry-input payment-entry-input-readonly"
                        readOnly
                      />
                    </div>
                    
                    <div className="payment-entry-field">
                      <label className="payment-entry-label">
                        Payment Amount <span className="payment-entry-required">*</span>
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
                <input
                  type="date"
                  id="paymentCreditInBankDate"
                  name="paymentCreditInBankDate"
                  value={formData.paymentCreditInBankDate}
                  onChange={handleChange}
                  className="payment-entry-input"
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

