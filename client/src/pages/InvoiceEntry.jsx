import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Calculator } from 'lucide-react'
import { useMasterData } from '../contexts/MasterDataContext'
import * as poEntryService from '../services/poEntryService'
import * as invoiceService from '../services/invoiceService'
import { INDIA_STATES } from '../utils/indiaStates'
import '../styles/InvoiceEntry.css'

function InvoiceEntry() {
  const navigate = useNavigate()
  const { getCustomers, getPaymentTerms, getConsignees, getPayers, getEmployees, getRecordById } = useMasterData()
  
  const [poEntries, setPOEntries] = useState([])
  const [customers, setCustomers] = useState([])
  const [paymentTerms, setPaymentTerms] = useState([])
  const [consignees, setConsignees] = useState([])
  const [payers, setPayers] = useState([])
  const [employees, setEmployees] = useState([])
  
  const [formData, setFormData] = useState({
    // Invoice Header
    invoiceID: '', // Auto-generated, immutable
    invoiceDate: new Date().toISOString().split('T')[0],
    invoiceType: 'REG', // REG, EXP, TAX, etc.
    businessUnit: 'MAIN',
    
    // Key ID / PO Linking
    keyID: '', // PO Number - Required
    poNumber: '', // Auto-filled from PO Entry
    poDate: '', // Auto-filled from PO Entry
    
    // Customer Details (Auto-filled from PO Entry -> Master Data)
    customer: '', // Customer Name
    customerId: '', // Reference to Master Data
    segment: '',
    region: '',
    zone: '',
    accountManager: '', // Employee reference
    accountManagerId: '',
    
    // Payment Terms (Auto-filled from PO Entry -> Master Data)
    paymentTerms: '',
    paymentTermsId: '',
    
    // Consignee & Payer (Auto-filled from Customer -> Master Data)
    consignee: '',
    consigneeId: '',
    payer: '',
    payerId: '',
    
    // Currency & State (Auto-filled from PO Entry)
    currency: 'INR',
    stateOfSupply: '',
    
    // Tax & Value Calculations
    basicRate: '',
    qty: '',
    basicValue: '', // Calculated: Basic Rate × Qty
    freightRate: '',
    freightValue: '', // Calculated: Freight Rate × Qty
    
    // GST Rates
    sgstRate: '',
    cgstRate: '',
    igstRate: '',
    ugstRate: '',
    
    // GST Values (Calculated)
    sgstValue: '', // Calculated
    cgstValue: '', // Calculated
    igstValue: '', // Calculated
    ugstValue: '', // Calculated
    totalGST: '', // Calculated: Sum of all GST values
    
    // Totals (Calculated)
    subtotal: '', // Calculated: Basic Value + Freight Value
    totalInvoiceValue: '', // Calculated: Subtotal + Total GST
    
    // Logistics & Dispatch
    dispatchDate: '',
    dispatchMode: '',
    lrNumber: '',
    lrDate: '',
    vehicleNumber: '',
    transporter: '',
    
    // Inspection & Compliance
    inspectionDate: '',
    complianceDate: '',
    
    // Payment & Due Tracking - 1st Due
    firstDueDate: '', // Calculated from Invoice Date + Payment Terms
    firstDueAmount: '', // Calculated
    firstReceivedAmount: '', // From Payment Advice
    firstReceiptDate: '', // From Payment Advice
    firstBalance: '', // Calculated: Due Amount - Received Amount
    firstNotDue: '', // Calculated
    firstOverdue: '', // Calculated
    firstDaysOutstanding: '', // Calculated
    
    // Payment & Due Tracking - 2nd Due
    secondDueDate: '',
    secondDueAmount: '',
    secondReceivedAmount: '',
    secondReceiptDate: '',
    secondBalance: '',
    secondNotDue: '',
    secondOverdue: '',
    secondDaysOutstanding: '',
    
    // Payment & Due Tracking - 3rd Due
    thirdDueDate: '',
    thirdDueAmount: '',
    thirdReceivedAmount: '',
    thirdReceiptDate: '',
    thirdBalance: '',
    thirdNotDue: '',
    thirdOverdue: '',
    thirdDaysOutstanding: '',
    
    // Consolidated Totals
    totalBalance: '', // Calculated: Sum of all balances
    notDueTotal: '', // Calculated: Sum of not-due amounts
    overDueTotal: '', // Calculated: Sum of overdue amounts
    
    // Deductions & Adjustments (Linked to Payment Advice)
    tdsAmount: '', // From Payment Advice
    penaltyAmount: '', // From Payment Advice
    deductionAmount: '', // From Payment Advice
    bankCharges: '', // From Payment Advice
    excessSupply: '', // From Payment Advice
    interest: '', // From Payment Advice
    holdAmount: '', // From Payment Advice
    
    // Bad Debts
    badDebtAmount: '',
    badDebtDate: '',
    badDebtReason: '',
  })
  
  useEffect(() => {
    // Load Master Data (sync getters)
    setCustomers(getCustomers())
    setPaymentTerms(getPaymentTerms())
    setConsignees(getConsignees())
    setPayers(getPayers())
    setEmployees(getEmployees())

    // Load PO Entries (async)
    ;(async () => {
      try {
        const allPOs = await poEntryService.getAllPONumbers()
        setPOEntries(allPOs)
      } catch (e) {
        console.error('Failed to load PO numbers:', e)
        setPOEntries([])
      }
    })()
  }, [getCustomers, getPaymentTerms, getConsignees, getPayers, getEmployees])
  
  // Auto-generate Invoice ID when form is initialized
  useEffect(() => {
    if (!formData.invoiceID) {
      const generatedID = invoiceService.generateInvoiceID(
        formData.invoiceType,
        formData.businessUnit
      )
      setFormData((prev) => ({ ...prev, invoiceID: generatedID }))
    }
  }, [formData.invoiceType, formData.businessUnit])
  
  // Handle PO Number selection - Auto-populate from PO Entry
  const handlePONumberChange = async (e) => {
    const poNumber = e.target.value
    const poEntry = await poEntryService.getPOEntryByPONumber(poNumber)
    
    if (poEntry) {
      // Fetch customer details from Master Data
      const customer = customers.find((c) => c.id === poEntry.customerId)
      
      // Fetch payment terms from Master Data
      const terms = paymentTerms.find((t) => t.id === poEntry.paymentTermsId)
      
      // Auto-populate all fields from PO Entry
      setFormData((prev) => {
        const updated = {
          ...prev,
          keyID: poNumber,
          poNumber: poEntry.poNumber || '',
          poDate: poEntry.poDate || '',
          customer: customer?.name || poEntry.customerName || '',
          customerId: poEntry.customerId || '',
          paymentTerms: terms?.description || poEntry.poPaymentTerms || '',
          paymentTermsId: poEntry.paymentTermsId || '',
          currency: poEntry.poCurrency || 'INR',
          stateOfSupply: poEntry.poDeliveryState || '',
          consigneeId: customer?.consigneeId || '',
          payerId: customer?.payerId || '',
        }
        
        // Set consignee and payer names
        if (customer?.consigneeId) {
          const consignee = consignees.find((c) => c.id === customer.consigneeId)
          updated.consignee = consignee?.name || ''
        }
        
        if (customer?.payerId) {
          const payer = payers.find((p) => p.id === customer.payerId)
          updated.payer = payer?.name || ''
        }
        
        return updated
      })
    } else {
      // Clear fields if PO not found
      setFormData((prev) => ({
        ...prev,
        keyID: poNumber,
        poNumber: '',
        poDate: '',
      }))
    }
  }
  
  // Calculate all values when inputs change
  const calculatedValues = useMemo(() => {
    return invoiceService.calculateInvoiceValues(formData)
  }, [
    formData.basicRate,
    formData.qty,
    formData.freightRate,
    formData.sgstRate,
    formData.cgstRate,
    formData.igstRate,
    formData.ugstRate,
  ])
  
  // Calculate due dates and amounts
  const dueCalculations = useMemo(() => {
    return invoiceService.calculateDueDates(
      formData.invoiceDate,
      formData.paymentTerms,
      calculatedValues.totalInvoiceValue
    )
  }, [formData.invoiceDate, formData.paymentTerms, calculatedValues.totalInvoiceValue])
  
  // Calculate balances and status for each due stage
  const calculateDueStage = (dueDate, dueAmount, receivedAmount, receiptDate) => {
    if (!dueDate || !dueAmount) {
      return {
        balance: '0.00',
        notDue: '0.00',
        overdue: '0.00',
        daysOutstanding: '0',
      }
    }
    
    const due = parseFloat(dueAmount || 0)
    const received = parseFloat(receivedAmount || 0)
    const balance = due - received
    
    const days = invoiceService.calculateDaysOutstanding(dueDate, receiptDate)
    const status = invoiceService.calculateDueStatus(dueDate, receivedAmount, dueAmount)
    
    return {
      balance: balance.toFixed(2),
      notDue: status.notDue ? balance.toFixed(2) : '0.00',
      overdue: status.overdue ? balance.toFixed(2) : '0.00',
      daysOutstanding: String(days),
    }
  }
  
  // Compute due stage calculations using calculated due dates/amounts
  const dueStageCalculations = useMemo(() => {
    const first = calculateDueStage(
      dueCalculations.firstDueDate || formData.firstDueDate,
      dueCalculations.firstDueAmount || formData.firstDueAmount,
      formData.firstReceivedAmount,
      formData.firstReceiptDate
    )
    const second = calculateDueStage(
      dueCalculations.secondDueDate || formData.secondDueDate,
      dueCalculations.secondDueAmount || formData.secondDueAmount,
      formData.secondReceivedAmount,
      formData.secondReceiptDate
    )
    const third = calculateDueStage(
      dueCalculations.thirdDueDate || formData.thirdDueDate,
      dueCalculations.thirdDueAmount || formData.thirdDueAmount,
      formData.thirdReceivedAmount,
      formData.thirdReceiptDate
    )
    
    const totalBalance = parseFloat(first.balance) + parseFloat(second.balance) + parseFloat(third.balance)
    const notDueTotal = parseFloat(first.notDue) + parseFloat(second.notDue) + parseFloat(third.notDue)
    const overDueTotal = parseFloat(first.overdue) + parseFloat(second.overdue) + parseFloat(third.overdue)
    
    return {
      first,
      second,
      third,
      totalBalance: totalBalance.toFixed(2),
      notDueTotal: notDueTotal.toFixed(2),
      overDueTotal: overDueTotal.toFixed(2),
    }
  }, [
    dueCalculations,
    formData.firstReceivedAmount,
    formData.firstReceiptDate,
    formData.secondReceivedAmount,
    formData.secondReceiptDate,
    formData.thirdReceivedAmount,
    formData.thirdReceiptDate,
  ])
  
  // Merge all computed values for display
  const displayData = {
    ...formData,
    ...calculatedValues,
    ...dueCalculations,
    ...dueStageCalculations,
    firstBalance: dueStageCalculations.first.balance,
    firstNotDue: dueStageCalculations.first.notDue,
    firstOverdue: dueStageCalculations.first.overdue,
    firstDaysOutstanding: dueStageCalculations.first.daysOutstanding,
    secondBalance: dueStageCalculations.second.balance,
    secondNotDue: dueStageCalculations.second.notDue,
    secondOverdue: dueStageCalculations.second.overdue,
    secondDaysOutstanding: dueStageCalculations.second.daysOutstanding,
    thirdBalance: dueStageCalculations.third.balance,
    thirdNotDue: dueStageCalculations.third.notDue,
    thirdOverdue: dueStageCalculations.third.overdue,
    thirdDaysOutstanding: dueStageCalculations.third.daysOutstanding,
    totalBalance: dueStageCalculations.totalBalance,
    notDueTotal: dueStageCalculations.notDueTotal,
    overDueTotal: dueStageCalculations.overDueTotal,
  }
  
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }
  
  const handleAccountManagerChange = (e) => {
    const employeeId = e.target.value
    const employee = employees.find((e) => e.id === employeeId)
    setFormData((prev) => ({
      ...prev,
      accountManagerId: employeeId,
      accountManager: employee?.name || '',
    }))
  }
  
  const handleSaveDraft = () => {
    try {
      const draft = {
        ...formData,
        savedAt: new Date().toISOString(),
        draft: true,
      }
      localStorage.setItem('invoiceEntryDraft', JSON.stringify(draft))
      alert('Draft saved successfully!')
    } catch (error) {
      console.error('Failed to save draft:', error)
      alert('Failed to save draft. Please try again.')
    }
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.keyID || !formData.invoiceDate) {
      alert('Please fill in all required fields (PO Number/Key ID, Invoice Date)')
      return
    }
    
    // Save invoice with all computed values
    try {
      const invoiceData = {
        ...formData,
        ...displayData,
        // Ensure key relationships are preserved
        keyID: formData.keyID, // PO Number
        invoiceID: displayData.invoiceID, // Auto-generated Invoice ID
      }
      const invoice = await invoiceService.saveInvoice(invoiceData)
      alert(`Invoice ${invoice?.invoiceID || invoice?.invoice_number || ''} saved successfully!`)
      navigate('/invoices')
    } catch (error) {
      console.error('Failed to save invoice:', error)
      alert('Failed to save invoice. Please try again.')
    }
  }
  
  return (
    <div className="invoice-entry-page">
      {/* Page Header */}
      <div className="invoice-entry-header">
        <button
          type="button"
          onClick={() => navigate('/invoices')}
          className="invoice-entry-back-button"
          aria-label="Back"
        >
          <ArrowLeft className="invoice-entry-back-icon" />
          <span>Back</span>
        </button>
        
        <div className="invoice-entry-header-content">
          <h1 className="invoice-entry-title">Invoice Entry</h1>
          {formData.invoiceID && (
            <p className="invoice-entry-subtitle">Invoice ID: {formData.invoiceID}</p>
          )}
        </div>
        
        <div className="invoice-entry-header-actions">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="invoice-entry-action-button invoice-entry-action-button-secondary"
          >
            <Save className="invoice-entry-action-icon" />
            <span>Save Draft</span>
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="invoice-entry-form">
        {/* Invoice Header Section */}
        <div className="invoice-entry-section">
          <h2 className="invoice-entry-section-title">Invoice Header</h2>
          <div className="invoice-entry-form-grid">
            <div className="invoice-entry-field">
              <label htmlFor="invoiceID" className="invoice-entry-label">
                Invoice ID <span className="invoice-entry-required">*</span>
              </label>
              <input
                type="text"
                id="invoiceID"
                name="invoiceID"
                value={formData.invoiceID}
                className="invoice-entry-input invoice-entry-input-readonly"
                readOnly
              />
              <small className="invoice-entry-hint">Auto-generated, immutable</small>
            </div>
            
            <div className="invoice-entry-field">
              <label htmlFor="invoiceDate" className="invoice-entry-label">
                Invoice Date <span className="invoice-entry-required">*</span>
              </label>
              <input
                type="date"
                id="invoiceDate"
                name="invoiceDate"
                value={formData.invoiceDate}
                onChange={handleChange}
                className="invoice-entry-input"
                required
              />
            </div>
            
            <div className="invoice-entry-field">
              <label htmlFor="invoiceType" className="invoice-entry-label">
                Invoice Type
              </label>
              <select
                id="invoiceType"
                name="invoiceType"
                value={formData.invoiceType}
                onChange={handleChange}
                className="invoice-entry-select"
              >
                <option value="REG">Regular (REG)</option>
                <option value="EXP">Export (EXP)</option>
                <option value="TAX">Tax Invoice (TAX)</option>
                <option value="PRO">Proforma (PRO)</option>
              </select>
            </div>
            
            <div className="invoice-entry-field">
              <label htmlFor="businessUnit" className="invoice-entry-label">
                Business Unit
              </label>
              <input
                type="text"
                id="businessUnit"
                name="businessUnit"
                value={formData.businessUnit}
                onChange={handleChange}
                className="invoice-entry-input"
                placeholder="MAIN"
              />
            </div>
          </div>
        </div>

        {/* Customer & PO Linking Section */}
        <div className="invoice-entry-section">
          <h2 className="invoice-entry-section-title">Customer & PO Linking</h2>
          <div className="invoice-entry-form-grid">
            <div className="invoice-entry-field">
              <label htmlFor="keyID" className="invoice-entry-label">
                Key ID (PO Number) <span className="invoice-entry-required">*</span>
              </label>
              <select
                id="keyID"
                name="keyID"
                value={formData.keyID}
                onChange={handlePONumberChange}
                className="invoice-entry-select"
                required
              >
                <option value="">Select PO Number</option>
                {poEntries.map((po) => (
                  <option key={po.poNumber} value={po.poNumber}>
                    {po.poNumber} - {po.customerName} ({po.poDate})
                  </option>
                ))}
              </select>
              {poEntries.length === 0 && (
                <small className="invoice-entry-hint">
                  No PO entries found. <a href="/po-entry/new" style={{ color: 'var(--color-primary)' }}>Create one first</a>
                </small>
              )}
            </div>
            
            <div className="invoice-entry-field">
              <label htmlFor="poNumber" className="invoice-entry-label">
                PO Number (Auto-filled)
              </label>
              <input
                type="text"
                id="poNumber"
                name="poNumber"
                value={formData.poNumber}
                className="invoice-entry-input invoice-entry-input-readonly"
                readOnly
              />
            </div>
            
            <div className="invoice-entry-field">
              <label htmlFor="poDate" className="invoice-entry-label">
                PO Date (Auto-filled)
              </label>
              <input
                type="date"
                id="poDate"
                name="poDate"
                value={formData.poDate}
                className="invoice-entry-input invoice-entry-input-readonly"
                readOnly
              />
            </div>
            
            <div className="invoice-entry-field">
              <label htmlFor="customer" className="invoice-entry-label">
                Customer (Auto-filled)
              </label>
              <input
                type="text"
                id="customer"
                name="customer"
                value={formData.customer}
                className="invoice-entry-input invoice-entry-input-readonly"
                readOnly
              />
            </div>
            
            <div className="invoice-entry-field">
              <label htmlFor="segment" className="invoice-entry-label">
                Segment
              </label>
              <input
                type="text"
                id="segment"
                name="segment"
                value={formData.segment}
                onChange={handleChange}
                className="invoice-entry-input"
              />
            </div>
            
            <div className="invoice-entry-field">
              <label htmlFor="region" className="invoice-entry-label">
                Region
              </label>
              <input
                type="text"
                id="region"
                name="region"
                value={formData.region}
                onChange={handleChange}
                className="invoice-entry-input"
              />
            </div>
            
            <div className="invoice-entry-field">
              <label htmlFor="zone" className="invoice-entry-label">
                Zone
              </label>
              <input
                type="text"
                id="zone"
                name="zone"
                value={formData.zone}
                onChange={handleChange}
                className="invoice-entry-input"
              />
            </div>
            
            <div className="invoice-entry-field">
              <label htmlFor="accountManagerId" className="invoice-entry-label">
                Account Manager
              </label>
              <select
                id="accountManagerId"
                name="accountManagerId"
                value={formData.accountManagerId}
                onChange={handleAccountManagerChange}
                className="invoice-entry-select"
              >
                <option value="">Select Account Manager</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} {emp.designation ? `(${emp.designation})` : ''}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="invoice-entry-field">
              <label htmlFor="paymentTerms" className="invoice-entry-label">
                Payment Terms (Auto-filled)
              </label>
              <textarea
                id="paymentTerms"
                name="paymentTerms"
                value={formData.paymentTerms}
                className="invoice-entry-textarea invoice-entry-input-readonly"
                rows="2"
                readOnly
              />
            </div>
            
            <div className="invoice-entry-field">
              <label htmlFor="consignee" className="invoice-entry-label">
                Consignee (Auto-filled)
              </label>
              <input
                type="text"
                id="consignee"
                name="consignee"
                value={formData.consignee}
                className="invoice-entry-input invoice-entry-input-readonly"
                readOnly
              />
            </div>
            
            <div className="invoice-entry-field">
              <label htmlFor="payer" className="invoice-entry-label">
                Payer (Auto-filled)
              </label>
              <input
                type="text"
                id="payer"
                name="payer"
                value={formData.payer}
                className="invoice-entry-input invoice-entry-input-readonly"
                readOnly
              />
            </div>
            
            <div className="invoice-entry-field">
              <label htmlFor="currency" className="invoice-entry-label">
                Currency (Auto-filled)
              </label>
              <input
                type="text"
                id="currency"
                name="currency"
                value={formData.currency}
                className="invoice-entry-input invoice-entry-input-readonly"
                readOnly
              />
            </div>
            
            <div className="invoice-entry-field">
              <label htmlFor="stateOfSupply" className="invoice-entry-label">
                State of Supply (Auto-filled)
              </label>
              <select
                id="stateOfSupply"
                name="stateOfSupply"
                value={formData.stateOfSupply}
                className="invoice-entry-select invoice-entry-input-readonly"
                disabled
              >
                <option value="">Select State</option>
                {INDIA_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tax & Value Calculations Section */}
        <div className="invoice-entry-section">
          <h2 className="invoice-entry-section-title">
            Tax & Value Calculations
            <Calculator className="invoice-entry-section-icon" />
          </h2>
          <div className="invoice-entry-form-grid">
            <div className="invoice-entry-field">
              <label htmlFor="basicRate" className="invoice-entry-label">
                Basic Rate
              </label>
              <input
                type="number"
                id="basicRate"
                name="basicRate"
                value={formData.basicRate}
                onChange={handleChange}
                className="invoice-entry-input"
                step="0.01"
                placeholder="0.00"
              />
            </div>
            
            <div className="invoice-entry-field">
              <label htmlFor="qty" className="invoice-entry-label">
                Quantity
              </label>
              <input
                type="number"
                id="qty"
                name="qty"
                value={formData.qty}
                onChange={handleChange}
                className="invoice-entry-input"
                step="0.01"
                placeholder="0.00"
              />
            </div>
            
            <div className="invoice-entry-field">
              <label htmlFor="basicValue" className="invoice-entry-label">
                Basic Value (Calculated)
              </label>
              <input
                type="text"
                id="basicValue"
                name="basicValue"
                value={displayData.basicValue}
                className="invoice-entry-input invoice-entry-input-readonly invoice-entry-input-calculated"
                readOnly
              />
              <small className="invoice-entry-hint">Basic Rate × Qty</small>
            </div>
            
            <div className="invoice-entry-field">
              <label htmlFor="freightRate" className="invoice-entry-label">
                Freight Rate
              </label>
              <input
                type="number"
                id="freightRate"
                name="freightRate"
                value={formData.freightRate}
                onChange={handleChange}
                className="invoice-entry-input"
                step="0.01"
                placeholder="0.00"
              />
            </div>
            
            <div className="invoice-entry-field">
              <label htmlFor="freightValue" className="invoice-entry-label">
                Freight Value (Calculated)
              </label>
              <input
                type="text"
                id="freightValue"
                name="freightValue"
                value={displayData.freightValue}
                className="invoice-entry-input invoice-entry-input-readonly invoice-entry-input-calculated"
                readOnly
              />
              <small className="invoice-entry-hint">Freight Rate × Qty</small>
            </div>
            
            <div className="invoice-entry-field">
              <label htmlFor="subtotal" className="invoice-entry-label">
                Subtotal (Calculated)
              </label>
              <input
                type="text"
                id="subtotal"
                name="subtotal"
                value={displayData.subtotal}
                className="invoice-entry-input invoice-entry-input-readonly invoice-entry-input-calculated"
                readOnly
              />
              <small className="invoice-entry-hint">Basic Value + Freight Value</small>
            </div>
            
            {/* GST Rates */}
            <div className="invoice-entry-field">
              <label htmlFor="sgstRate" className="invoice-entry-label">
                SGST Rate (%)
              </label>
              <input
                type="number"
                id="sgstRate"
                name="sgstRate"
                value={formData.sgstRate}
                onChange={handleChange}
                className="invoice-entry-input"
                step="0.01"
                placeholder="0.00"
              />
            </div>
            
            <div className="invoice-entry-field">
              <label htmlFor="cgstRate" className="invoice-entry-label">
                CGST Rate (%)
              </label>
              <input
                type="number"
                id="cgstRate"
                name="cgstRate"
                value={formData.cgstRate}
                onChange={handleChange}
                className="invoice-entry-input"
                step="0.01"
                placeholder="0.00"
              />
            </div>
            
            <div className="invoice-entry-field">
              <label htmlFor="igstRate" className="invoice-entry-label">
                IGST Rate (%)
              </label>
              <input
                type="number"
                id="igstRate"
                name="igstRate"
                value={formData.igstRate}
                onChange={handleChange}
                className="invoice-entry-input"
                step="0.01"
                placeholder="0.00"
              />
            </div>
            
            <div className="invoice-entry-field">
              <label htmlFor="ugstRate" className="invoice-entry-label">
                UGST Rate (%)
              </label>
              <input
                type="number"
                id="ugstRate"
                name="ugstRate"
                value={formData.ugstRate}
                onChange={handleChange}
                className="invoice-entry-input"
                step="0.01"
                placeholder="0.00"
              />
            </div>
            
            {/* GST Values */}
            <div className="invoice-entry-field">
              <label htmlFor="sgstValue" className="invoice-entry-label">
                SGST Value (Calculated)
              </label>
              <input
                type="text"
                id="sgstValue"
                name="sgstValue"
                value={displayData.sgstValue}
                className="invoice-entry-input invoice-entry-input-readonly invoice-entry-input-calculated"
                readOnly
              />
            </div>
            
            <div className="invoice-entry-field">
              <label htmlFor="cgstValue" className="invoice-entry-label">
                CGST Value (Calculated)
              </label>
              <input
                type="text"
                id="cgstValue"
                name="cgstValue"
                value={displayData.cgstValue}
                className="invoice-entry-input invoice-entry-input-readonly invoice-entry-input-calculated"
                readOnly
              />
            </div>
            
            <div className="invoice-entry-field">
              <label htmlFor="igstValue" className="invoice-entry-label">
                IGST Value (Calculated)
              </label>
              <input
                type="text"
                id="igstValue"
                name="igstValue"
                value={displayData.igstValue}
                className="invoice-entry-input invoice-entry-input-readonly invoice-entry-input-calculated"
                readOnly
              />
            </div>
            
            <div className="invoice-entry-field">
              <label htmlFor="ugstValue" className="invoice-entry-label">
                UGST Value (Calculated)
              </label>
              <input
                type="text"
                id="ugstValue"
                name="ugstValue"
                value={displayData.ugstValue}
                className="invoice-entry-input invoice-entry-input-readonly invoice-entry-input-calculated"
                readOnly
              />
            </div>
            
            <div className="invoice-entry-field">
              <label htmlFor="totalGST" className="invoice-entry-label">
                Total GST (Calculated)
              </label>
              <input
                type="text"
                id="totalGST"
                name="totalGST"
                value={displayData.totalGST}
                className="invoice-entry-input invoice-entry-input-readonly invoice-entry-input-calculated"
                readOnly
              />
              <small className="invoice-entry-hint">Sum of all GST values</small>
            </div>
            
            <div className="invoice-entry-field invoice-entry-field-full">
              <label htmlFor="totalInvoiceValue" className="invoice-entry-label">
                Total Invoice Value (Calculated)
              </label>
              <input
                type="text"
                id="totalInvoiceValue"
                name="totalInvoiceValue"
                value={displayData.totalInvoiceValue}
                className="invoice-entry-input invoice-entry-input-readonly invoice-entry-input-calculated invoice-entry-input-total"
                readOnly
              />
              <small className="invoice-entry-hint">Subtotal + Total GST</small>
            </div>
          </div>
        </div>

        {/* Logistics & Dispatch Section */}
        <div className="invoice-entry-section">
          <h2 className="invoice-entry-section-title">Logistics & Dispatch Details</h2>
          <div className="invoice-entry-form-grid">
            <div className="invoice-entry-field">
              <label htmlFor="dispatchDate" className="invoice-entry-label">
                Dispatch Date
              </label>
              <input
                type="date"
                id="dispatchDate"
                name="dispatchDate"
                value={formData.dispatchDate}
                onChange={handleChange}
                className="invoice-entry-input"
              />
            </div>
            
            <div className="invoice-entry-field">
              <label htmlFor="dispatchMode" className="invoice-entry-label">
                Dispatch Mode
              </label>
              <select
                id="dispatchMode"
                name="dispatchMode"
                value={formData.dispatchMode}
                onChange={handleChange}
                className="invoice-entry-select"
              >
                <option value="">Select Mode</option>
                <option value="Road">Road</option>
                <option value="Rail">Rail</option>
                <option value="Air">Air</option>
                <option value="Sea">Sea</option>
                <option value="Courier">Courier</option>
              </select>
            </div>
            
            <div className="invoice-entry-field">
              <label htmlFor="lrNumber" className="invoice-entry-label">
                LR Number
              </label>
              <input
                type="text"
                id="lrNumber"
                name="lrNumber"
                value={formData.lrNumber}
                onChange={handleChange}
                className="invoice-entry-input"
              />
            </div>
            
            <div className="invoice-entry-field">
              <label htmlFor="lrDate" className="invoice-entry-label">
                LR Date
              </label>
              <input
                type="date"
                id="lrDate"
                name="lrDate"
                value={formData.lrDate}
                onChange={handleChange}
                className="invoice-entry-input"
              />
            </div>
            
            <div className="invoice-entry-field">
              <label htmlFor="vehicleNumber" className="invoice-entry-label">
                Vehicle Number
              </label>
              <input
                type="text"
                id="vehicleNumber"
                name="vehicleNumber"
                value={formData.vehicleNumber}
                onChange={handleChange}
                className="invoice-entry-input"
              />
            </div>
            
            <div className="invoice-entry-field">
              <label htmlFor="transporter" className="invoice-entry-label">
                Transporter
              </label>
              <input
                type="text"
                id="transporter"
                name="transporter"
                value={formData.transporter}
                onChange={handleChange}
                className="invoice-entry-input"
              />
            </div>
          </div>
        </div>

        {/* Inspection & Compliance Section */}
        <div className="invoice-entry-section">
          <h2 className="invoice-entry-section-title">Inspection & Compliance Dates</h2>
          <div className="invoice-entry-form-grid">
            <div className="invoice-entry-field">
              <label htmlFor="inspectionDate" className="invoice-entry-label">
                Inspection Date
              </label>
              <input
                type="date"
                id="inspectionDate"
                name="inspectionDate"
                value={formData.inspectionDate}
                onChange={handleChange}
                className="invoice-entry-input"
              />
            </div>
            
            <div className="invoice-entry-field">
              <label htmlFor="complianceDate" className="invoice-entry-label">
                Compliance Date
              </label>
              <input
                type="date"
                id="complianceDate"
                name="complianceDate"
                value={formData.complianceDate}
                onChange={handleChange}
                className="invoice-entry-input"
              />
            </div>
          </div>
        </div>

        {/* Payment & Due Tracking Section */}
        <div className="invoice-entry-section">
          <h2 className="invoice-entry-section-title">Payment & Due Tracking</h2>
          
          {/* 1st Due */}
          <div className="invoice-entry-due-stage">
            <h3 className="invoice-entry-due-stage-title">1st Due</h3>
            <div className="invoice-entry-form-grid">
              <div className="invoice-entry-field">
                <label htmlFor="firstDueDate" className="invoice-entry-label">
                  1st Due Date (Calculated)
                </label>
                <input
                  type="date"
                  id="firstDueDate"
                  name="firstDueDate"
                  value={displayData.firstDueDate}
                  className="invoice-entry-input invoice-entry-input-readonly"
                  readOnly
                />
              </div>
              
              <div className="invoice-entry-field">
                <label htmlFor="firstDueAmount" className="invoice-entry-label">
                  1st Due Amount (Calculated)
                </label>
                <input
                  type="text"
                  id="firstDueAmount"
                  name="firstDueAmount"
                  value={displayData.firstDueAmount}
                  className="invoice-entry-input invoice-entry-input-readonly invoice-entry-input-calculated"
                  readOnly
                />
              </div>
              
              <div className="invoice-entry-field">
                <label htmlFor="firstReceivedAmount" className="invoice-entry-label">
                  1st Received Amount (From Payment Advice)
                </label>
                <input
                  type="text"
                  id="firstReceivedAmount"
                  name="firstReceivedAmount"
                  value={formData.firstReceivedAmount}
                  className="invoice-entry-input invoice-entry-input-readonly"
                  readOnly
                  placeholder="Linked to Payment Advice"
                />
              </div>
              
              <div className="invoice-entry-field">
                <label htmlFor="firstReceiptDate" className="invoice-entry-label">
                  1st Receipt Date (From Payment Advice)
                </label>
                <input
                  type="date"
                  id="firstReceiptDate"
                  name="firstReceiptDate"
                  value={formData.firstReceiptDate}
                  className="invoice-entry-input invoice-entry-input-readonly"
                  readOnly
                />
              </div>
              
              <div className="invoice-entry-field">
                <label htmlFor="firstBalance" className="invoice-entry-label">
                  1st Balance (Calculated)
                </label>
                <input
                  type="text"
                  id="firstBalance"
                  name="firstBalance"
                  value={displayData.firstBalance}
                  className="invoice-entry-input invoice-entry-input-readonly invoice-entry-input-calculated"
                  readOnly
                />
              </div>
              
              <div className="invoice-entry-field">
                <label htmlFor="firstNotDue" className="invoice-entry-label">
                  1st Not Due (Calculated)
                </label>
                <input
                  type="text"
                  id="firstNotDue"
                  name="firstNotDue"
                  value={displayData.firstNotDue}
                  className="invoice-entry-input invoice-entry-input-readonly invoice-entry-input-calculated"
                  readOnly
                />
              </div>
              
              <div className="invoice-entry-field">
                <label htmlFor="firstOverdue" className="invoice-entry-label">
                  1st Overdue (Calculated)
                </label>
                <input
                  type="text"
                  id="firstOverdue"
                  name="firstOverdue"
                  value={displayData.firstOverdue}
                  className="invoice-entry-input invoice-entry-input-readonly invoice-entry-input-calculated"
                  readOnly
                />
              </div>
              
              <div className="invoice-entry-field">
                <label htmlFor="firstDaysOutstanding" className="invoice-entry-label">
                  1st Days Outstanding (Calculated)
                </label>
                <input
                  type="text"
                  id="firstDaysOutstanding"
                  name="firstDaysOutstanding"
                  value={displayData.firstDaysOutstanding}
                  className="invoice-entry-input invoice-entry-input-readonly invoice-entry-input-calculated"
                  readOnly
                />
              </div>
            </div>
          </div>
          
          {/* 2nd Due */}
          <div className="invoice-entry-due-stage">
            <h3 className="invoice-entry-due-stage-title">2nd Due</h3>
            <div className="invoice-entry-form-grid">
              <div className="invoice-entry-field">
                <label htmlFor="secondDueDate" className="invoice-entry-label">
                  2nd Due Date (Calculated)
                </label>
                <input
                  type="date"
                  id="secondDueDate"
                  name="secondDueDate"
                  value={displayData.secondDueDate}
                  className="invoice-entry-input invoice-entry-input-readonly"
                  readOnly
                />
              </div>
              
              <div className="invoice-entry-field">
                <label htmlFor="secondDueAmount" className="invoice-entry-label">
                  2nd Due Amount (Calculated)
                </label>
                <input
                  type="text"
                  id="secondDueAmount"
                  name="secondDueAmount"
                  value={displayData.secondDueAmount}
                  className="invoice-entry-input invoice-entry-input-readonly invoice-entry-input-calculated"
                  readOnly
                />
              </div>
              
              <div className="invoice-entry-field">
                <label htmlFor="secondReceivedAmount" className="invoice-entry-label">
                  2nd Received Amount (From Payment Advice)
                </label>
                <input
                  type="text"
                  id="secondReceivedAmount"
                  name="secondReceivedAmount"
                  value={formData.secondReceivedAmount}
                  className="invoice-entry-input invoice-entry-input-readonly"
                  readOnly
                />
              </div>
              
              <div className="invoice-entry-field">
                <label htmlFor="secondReceiptDate" className="invoice-entry-label">
                  2nd Receipt Date (From Payment Advice)
                </label>
                <input
                  type="date"
                  id="secondReceiptDate"
                  name="secondReceiptDate"
                  value={formData.secondReceiptDate}
                  className="invoice-entry-input invoice-entry-input-readonly"
                  readOnly
                />
              </div>
              
              <div className="invoice-entry-field">
                <label htmlFor="secondBalance" className="invoice-entry-label">
                  2nd Balance (Calculated)
                </label>
                <input
                  type="text"
                  id="secondBalance"
                  name="secondBalance"
                  value={displayData.secondBalance}
                  className="invoice-entry-input invoice-entry-input-readonly invoice-entry-input-calculated"
                  readOnly
                />
              </div>
              
              <div className="invoice-entry-field">
                <label htmlFor="secondNotDue" className="invoice-entry-label">
                  2nd Not Due (Calculated)
                </label>
                <input
                  type="text"
                  id="secondNotDue"
                  name="secondNotDue"
                  value={displayData.secondNotDue}
                  className="invoice-entry-input invoice-entry-input-readonly invoice-entry-input-calculated"
                  readOnly
                />
              </div>
              
              <div className="invoice-entry-field">
                <label htmlFor="secondOverdue" className="invoice-entry-label">
                  2nd Overdue (Calculated)
                </label>
                <input
                  type="text"
                  id="secondOverdue"
                  name="secondOverdue"
                  value={displayData.secondOverdue}
                  className="invoice-entry-input invoice-entry-input-readonly invoice-entry-input-calculated"
                  readOnly
                />
              </div>
              
              <div className="invoice-entry-field">
                <label htmlFor="secondDaysOutstanding" className="invoice-entry-label">
                  2nd Days Outstanding (Calculated)
                </label>
                <input
                  type="text"
                  id="secondDaysOutstanding"
                  name="secondDaysOutstanding"
                  value={displayData.secondDaysOutstanding}
                  className="invoice-entry-input invoice-entry-input-readonly invoice-entry-input-calculated"
                  readOnly
                />
              </div>
            </div>
          </div>
          
          {/* 3rd Due */}
          <div className="invoice-entry-due-stage">
            <h3 className="invoice-entry-due-stage-title">3rd Due</h3>
            <div className="invoice-entry-form-grid">
              <div className="invoice-entry-field">
                <label htmlFor="thirdDueDate" className="invoice-entry-label">
                  3rd Due Date (Calculated)
                </label>
                <input
                  type="date"
                  id="thirdDueDate"
                  name="thirdDueDate"
                  value={displayData.thirdDueDate}
                  className="invoice-entry-input invoice-entry-input-readonly"
                  readOnly
                />
              </div>
              
              <div className="invoice-entry-field">
                <label htmlFor="thirdDueAmount" className="invoice-entry-label">
                  3rd Due Amount (Calculated)
                </label>
                <input
                  type="text"
                  id="thirdDueAmount"
                  name="thirdDueAmount"
                  value={displayData.thirdDueAmount}
                  className="invoice-entry-input invoice-entry-input-readonly invoice-entry-input-calculated"
                  readOnly
                />
              </div>
              
              <div className="invoice-entry-field">
                <label htmlFor="thirdReceivedAmount" className="invoice-entry-label">
                  3rd Received Amount (From Payment Advice)
                </label>
                <input
                  type="text"
                  id="thirdReceivedAmount"
                  name="thirdReceivedAmount"
                  value={formData.thirdReceivedAmount}
                  className="invoice-entry-input invoice-entry-input-readonly"
                  readOnly
                />
              </div>
              
              <div className="invoice-entry-field">
                <label htmlFor="thirdReceiptDate" className="invoice-entry-label">
                  3rd Receipt Date (From Payment Advice)
                </label>
                <input
                  type="date"
                  id="thirdReceiptDate"
                  name="thirdReceiptDate"
                  value={formData.thirdReceiptDate}
                  className="invoice-entry-input invoice-entry-input-readonly"
                  readOnly
                />
              </div>
              
              <div className="invoice-entry-field">
                <label htmlFor="thirdBalance" className="invoice-entry-label">
                  3rd Balance (Calculated)
                </label>
                <input
                  type="text"
                  id="thirdBalance"
                  name="thirdBalance"
                  value={displayData.thirdBalance}
                  className="invoice-entry-input invoice-entry-input-readonly invoice-entry-input-calculated"
                  readOnly
                />
              </div>
              
              <div className="invoice-entry-field">
                <label htmlFor="thirdNotDue" className="invoice-entry-label">
                  3rd Not Due (Calculated)
                </label>
                <input
                  type="text"
                  id="thirdNotDue"
                  name="thirdNotDue"
                  value={displayData.thirdNotDue}
                  className="invoice-entry-input invoice-entry-input-readonly invoice-entry-input-calculated"
                  readOnly
                />
              </div>
              
              <div className="invoice-entry-field">
                <label htmlFor="thirdOverdue" className="invoice-entry-label">
                  3rd Overdue (Calculated)
                </label>
                <input
                  type="text"
                  id="thirdOverdue"
                  name="thirdOverdue"
                  value={displayData.thirdOverdue}
                  className="invoice-entry-input invoice-entry-input-readonly invoice-entry-input-calculated"
                  readOnly
                />
              </div>
              
              <div className="invoice-entry-field">
                <label htmlFor="thirdDaysOutstanding" className="invoice-entry-label">
                  3rd Days Outstanding (Calculated)
                </label>
                <input
                  type="text"
                  id="thirdDaysOutstanding"
                  name="thirdDaysOutstanding"
                  value={displayData.thirdDaysOutstanding}
                  className="invoice-entry-input invoice-entry-input-readonly invoice-entry-input-calculated"
                  readOnly
                />
              </div>
            </div>
          </div>
          
          {/* Consolidated Totals */}
          <div className="invoice-entry-consolidated-totals">
            <h3 className="invoice-entry-due-stage-title">Consolidated Totals</h3>
            <div className="invoice-entry-form-grid">
              <div className="invoice-entry-field">
                <label htmlFor="totalBalance" className="invoice-entry-label">
                  Total Balance (Calculated)
                </label>
                <input
                  type="text"
                  id="totalBalance"
                  name="totalBalance"
                  value={displayData.totalBalance}
                  className="invoice-entry-input invoice-entry-input-readonly invoice-entry-input-calculated invoice-entry-input-total"
                  readOnly
                />
              </div>
              
              <div className="invoice-entry-field">
                <label htmlFor="notDueTotal" className="invoice-entry-label">
                  Not Due Total (Calculated)
                </label>
                <input
                  type="text"
                  id="notDueTotal"
                  name="notDueTotal"
                  value={displayData.notDueTotal}
                  className="invoice-entry-input invoice-entry-input-readonly invoice-entry-input-calculated"
                  readOnly
                />
              </div>
              
              <div className="invoice-entry-field">
                <label htmlFor="overDueTotal" className="invoice-entry-label">
                  Over Due Total (Calculated)
                </label>
                <input
                  type="text"
                  id="overDueTotal"
                  name="overDueTotal"
                  value={displayData.overDueTotal}
                  className="invoice-entry-input invoice-entry-input-readonly invoice-entry-input-calculated invoice-entry-input-overdue"
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>

        {/* Deductions & Adjustments Section */}
        <div className="invoice-entry-section">
          <h2 className="invoice-entry-section-title">Deductions & Adjustments (Linked to Payment Advice)</h2>
          <div className="invoice-entry-form-grid">
            <div className="invoice-entry-field">
              <label htmlFor="tdsAmount" className="invoice-entry-label">
                TDS Amount (From Payment Advice)
              </label>
              <input
                type="text"
                id="tdsAmount"
                name="tdsAmount"
                value={formData.tdsAmount}
                className="invoice-entry-input invoice-entry-input-readonly"
                readOnly
                placeholder="Linked to Payment Advice"
              />
            </div>
            
            <div className="invoice-entry-field">
              <label htmlFor="penaltyAmount" className="invoice-entry-label">
                Penalty Amount (From Payment Advice)
              </label>
              <input
                type="text"
                id="penaltyAmount"
                name="penaltyAmount"
                value={formData.penaltyAmount}
                className="invoice-entry-input invoice-entry-input-readonly"
                readOnly
              />
            </div>
            
            <div className="invoice-entry-field">
              <label htmlFor="deductionAmount" className="invoice-entry-label">
                Deduction Amount (From Payment Advice)
              </label>
              <input
                type="text"
                id="deductionAmount"
                name="deductionAmount"
                value={formData.deductionAmount}
                className="invoice-entry-input invoice-entry-input-readonly"
                readOnly
              />
            </div>
            
            <div className="invoice-entry-field">
              <label htmlFor="bankCharges" className="invoice-entry-label">
                Bank Charges (From Payment Advice)
              </label>
              <input
                type="text"
                id="bankCharges"
                name="bankCharges"
                value={formData.bankCharges}
                className="invoice-entry-input invoice-entry-input-readonly"
                readOnly
              />
            </div>
            
            <div className="invoice-entry-field">
              <label htmlFor="excessSupply" className="invoice-entry-label">
                Excess Supply (From Payment Advice)
              </label>
              <input
                type="text"
                id="excessSupply"
                name="excessSupply"
                value={formData.excessSupply}
                className="invoice-entry-input invoice-entry-input-readonly"
                readOnly
              />
            </div>
            
            <div className="invoice-entry-field">
              <label htmlFor="interest" className="invoice-entry-label">
                Interest (From Payment Advice)
              </label>
              <input
                type="text"
                id="interest"
                name="interest"
                value={formData.interest}
                className="invoice-entry-input invoice-entry-input-readonly"
                readOnly
              />
            </div>
            
            <div className="invoice-entry-field">
              <label htmlFor="holdAmount" className="invoice-entry-label">
                Hold Amount (From Payment Advice)
              </label>
              <input
                type="text"
                id="holdAmount"
                name="holdAmount"
                value={formData.holdAmount}
                className="invoice-entry-input invoice-entry-input-readonly"
                readOnly
              />
            </div>
          </div>
        </div>

        {/* Bad Debts Section */}
        <div className="invoice-entry-section">
          <h2 className="invoice-entry-section-title">Bad Debts</h2>
          <div className="invoice-entry-form-grid">
            <div className="invoice-entry-field">
              <label htmlFor="badDebtAmount" className="invoice-entry-label">
                Bad Debt Amount
              </label>
              <input
                type="number"
                id="badDebtAmount"
                name="badDebtAmount"
                value={formData.badDebtAmount}
                onChange={handleChange}
                className="invoice-entry-input"
                step="0.01"
                placeholder="0.00"
              />
            </div>
            
            <div className="invoice-entry-field">
              <label htmlFor="badDebtDate" className="invoice-entry-label">
                Bad Debt Date
              </label>
              <input
                type="date"
                id="badDebtDate"
                name="badDebtDate"
                value={formData.badDebtDate}
                onChange={handleChange}
                className="invoice-entry-input"
              />
            </div>
            
            <div className="invoice-entry-field invoice-entry-field-full">
              <label htmlFor="badDebtReason" className="invoice-entry-label">
                Bad Debt Reason
              </label>
              <textarea
                id="badDebtReason"
                name="badDebtReason"
                value={formData.badDebtReason}
                onChange={handleChange}
                className="invoice-entry-textarea"
                rows="3"
                placeholder="Enter reason for bad debt..."
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="invoice-entry-actions">
          <button
            type="button"
            onClick={() => navigate('/invoices')}
            className="invoice-entry-button invoice-entry-button-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="invoice-entry-button invoice-entry-button-primary"
          >
            Submit Invoice
          </button>
        </div>
      </form>
    </div>
  )
}

export default InvoiceEntry

