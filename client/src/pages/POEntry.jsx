import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { useMasterData } from '../contexts/MasterDataContext'
import * as poEntryService from '../services/poEntryService'
import { INDIA_STATES } from '../utils/indiaStates'
import '../styles/POEntry.css'

function POEntry() {
  const navigate = useNavigate()
  const { getCustomers, getPaymentTerms, getRecordById } = useMasterData()
  const [customers, setCustomers] = useState([])
  const [paymentTerms, setPaymentTerms] = useState([])
  const [formData, setFormData] = useState({
    // Customer / Customer PO Entry details
    customerName: '',
    customerPONumber: '',
    customerPODate: '',
    
    // Customer Details
    customerAddress: '',
    customerCity: '',
    customerState: '',
    customerCountry: 'India',
    customerPinCode: '',
    customerGSTIN: '',
    customerContactPerson: '',
    customerContactNumber: '',
    customerEmail: '',
    
    // PO Details
    poNumber: '',
    poDate: '',
    poValue: '',
    poCurrency: 'INR',
    poDescription: '',
    poDeliveryLocation: '',
    poDeliveryAddress: '',
    poDeliveryCity: '',
    poDeliveryState: '',
    poDeliveryPinCode: '',
    poDeliveryDate: '',
    poPaymentTerms: '',
    poWarrantyPeriod: '',
    poValidityPeriod: '',
    
    // Tender & Agreement details
    tenderNumber: '',
    tenderDate: '',
    tenderAuthority: '',
    agreementNumber: '',
    agreementDate: '',
    agreementValue: '',
    agreementStartDate: '',
    agreementEndDate: '',
    agreementTerms: '',
    
    // Insurance Details
    insuranceRequired: '',
    insuranceType: '',
    insuranceProvider: '',
    insurancePolicyNumber: '',
    insuranceStartDate: '',
    insuranceEndDate: '',
    insuranceAmount: '',
    insurancePremium: '',
    
    // Bank Guarantee details
    bankGuaranteeRequired: '',
    bankGuaranteeType: '',
    bankName: '',
    bankGuaranteeNumber: '',
    bankGuaranteeDate: '',
    bankGuaranteeAmount: '',
    bankGuaranteeValidityDate: '',
    bankGuaranteePercentage: '',
    customerId: '', // Store selected customer ID
    paymentTermsId: '', // Store selected payment terms ID
  })

  useEffect(() => {
    // Load Master Data for dropdowns
    setCustomers(getCustomers())
    setPaymentTerms(getPaymentTerms())
  }, [getCustomers, getPaymentTerms])
  
  // Auto-generate PO Number when form is initialized (only once)
  useEffect(() => {
    if (!formData.poNumber) {
      const generatedPONumber = poEntryService.generatePONumber(formData.businessUnit || 'MAIN')
      setFormData((prev) => ({ ...prev, poNumber: generatedPONumber }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array - only run once on mount

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCustomerChange = (e) => {
    const customerId = e.target.value
    const customer = customers.find((c) => c.id === customerId)
    
    if (customer) {
      // Auto-fill customer details from Master Data
      setFormData((prev) => ({
        ...prev,
        customerId,
        customerName: customer.name,
        customerAddress: customer.address,
        customerCity: customer.city || '',
        customerState: customer.state || '',
        customerPinCode: customer.pinCode,
        customerGSTIN: customer.gstin,
        customerContactPerson: customer.contactPerson,
        customerContactNumber: customer.contactNumber,
        customerEmail: customer.email,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        customerId: '',
        customerName: '',
        customerAddress: '',
        customerCity: '',
        customerState: '',
        customerPinCode: '',
        customerGSTIN: '',
        customerContactPerson: '',
        customerContactNumber: '',
        customerEmail: '',
      }))
    }
  }

  const handlePaymentTermsChange = (e) => {
    const paymentTermsId = e.target.value
    const terms = paymentTerms.find((t) => t.id === paymentTermsId)
    
    if (terms) {
      setFormData((prev) => ({
        ...prev,
        paymentTermsId,
        poPaymentTerms: terms.description || terms.name,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        paymentTermsId: '',
        poPaymentTerms: '',
      }))
    }
  }

  const handleSaveDraft = () => {
    try {
      const draft = {
        ...formData,
        savedAt: new Date().toISOString(),
        draft: true,
      }
      localStorage.setItem('poEntryDraft', JSON.stringify(draft))
      alert('Draft saved successfully!')
    } catch (error) {
      console.error('Failed to save draft:', error)
      alert('Failed to save draft. Please try again.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.customerId || !formData.poNumber || !formData.poDate) {
      alert('Please fill in all required fields (Customer, PO Number, PO Date)')
      return
    }
    
    // Save PO Entry with Master Data references
    const poEntry = {
      ...formData,
      submittedAt: new Date().toISOString(),
      // Maintain relationships to Master Data
      customerId: formData.customerId,
      paymentTermsId: formData.paymentTermsId,
    }
    
    // Save using PO Entry service
    try {
      await poEntryService.savePOEntry(poEntry)
      alert('PO Entry submitted successfully!')
      navigate('/po-entry')
    } catch (error) {
      console.error('Failed to save PO Entry:', error)
      alert('Failed to save PO Entry. Please try again.')
    }
  }

  return (
    <div className="po-entry-page">
      {/* Page Header */}
      <div className="po-entry-header">
        <button
          type="button"
          onClick={() => navigate('/po-entry')}
          className="po-entry-back-button"
          aria-label="Back"
        >
          <ArrowLeft className="po-entry-back-icon" />
          <span>Back</span>
        </button>
        
        <div className="po-entry-header-content">
          <h1 className="po-entry-title">PO Entry</h1>
          {formData.poNumber && (
            <p className="po-entry-subtitle">PO Number: {formData.poNumber}</p>
          )}
        </div>
        
        <div className="po-entry-header-actions">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="po-entry-action-button po-entry-action-button-secondary"
          >
            <Save className="po-entry-action-icon" />
            <span>Save Draft</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/po-entry')}
            className="po-entry-action-button po-entry-action-button-secondary"
          >
            <span>Back to PO List</span>
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="po-entry-form">
        {/* Customer / Customer PO Entry Details */}
        <div className="po-entry-section">
          <h2 className="po-entry-section-title">Customer / Customer PO Entry Details</h2>
          <div className="po-entry-form-grid">
            <div className="po-entry-field">
              <label htmlFor="customerId" className="po-entry-label">
                Customer <span className="po-entry-required">*</span>
              </label>
              <select
                id="customerId"
                name="customerId"
                value={formData.customerId}
                onChange={handleCustomerChange}
                className="po-entry-select"
                required
              >
                <option value="">Select Customer from Master Data</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} {customer.gstin ? `(${customer.gstin})` : ''}
                  </option>
                ))}
              </select>
              {customers.length === 0 && (
                <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                  No customers found. <a href="/master-data/new/customer-profile" style={{ color: 'var(--color-primary)' }}>Create one in Master Data</a>
                </p>
              )}
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="customerName" className="po-entry-label">
                Customer Name (Auto-filled)
              </label>
              <input
                type="text"
                id="customerName"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                className="po-entry-input"
                readOnly
                style={{ background: 'var(--color-bg-tertiary)' }}
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="customerPONumber" className="po-entry-label">
                Customer PO Number
              </label>
              <input
                type="text"
                id="customerPONumber"
                name="customerPONumber"
                value={formData.customerPONumber}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="customerPODate" className="po-entry-label">
                Customer PO Date
              </label>
              <input
                type="date"
                id="customerPODate"
                name="customerPODate"
                value={formData.customerPODate}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="po-entry-section">
          <h2 className="po-entry-section-title">Customer Details</h2>
          <div className="po-entry-form-grid">
            <div className="po-entry-field po-entry-field-full">
              <label htmlFor="customerAddress" className="po-entry-label">
                Customer Address
              </label>
              <textarea
                id="customerAddress"
                name="customerAddress"
                value={formData.customerAddress}
                onChange={handleChange}
                className="po-entry-textarea"
                rows="3"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="customerCity" className="po-entry-label">
                City
              </label>
              <input
                type="text"
                id="customerCity"
                name="customerCity"
                value={formData.customerCity}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="customerState" className="po-entry-label">
                State
              </label>
              <select
                id="customerState"
                name="customerState"
                value={formData.customerState}
                onChange={handleChange}
                className="po-entry-select"
              >
                <option value="">Select State</option>
                {INDIA_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="customerCountry" className="po-entry-label">
                Country
              </label>
              <input
                type="text"
                id="customerCountry"
                name="customerCountry"
                value={formData.customerCountry}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="customerPinCode" className="po-entry-label">
                Pin Code
              </label>
              <input
                type="text"
                id="customerPinCode"
                name="customerPinCode"
                value={formData.customerPinCode}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="customerGSTIN" className="po-entry-label">
                GSTIN
              </label>
              <input
                type="text"
                id="customerGSTIN"
                name="customerGSTIN"
                value={formData.customerGSTIN}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="customerContactPerson" className="po-entry-label">
                Contact Person
              </label>
              <input
                type="text"
                id="customerContactPerson"
                name="customerContactPerson"
                value={formData.customerContactPerson}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="customerContactNumber" className="po-entry-label">
                Contact Number
              </label>
              <input
                type="tel"
                id="customerContactNumber"
                name="customerContactNumber"
                value={formData.customerContactNumber}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="customerEmail" className="po-entry-label">
                Email
              </label>
              <input
                type="email"
                id="customerEmail"
                name="customerEmail"
                value={formData.customerEmail}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
          </div>
        </div>

        {/* PO Details */}
        <div className="po-entry-section">
          <h2 className="po-entry-section-title">PO Details</h2>
          <div className="po-entry-form-grid">
            <div className="po-entry-field">
              <label htmlFor="poNumber" className="po-entry-label">
                PO Number <span className="po-entry-required">*</span>
              </label>
              <input
                type="text"
                id="poNumber"
                name="poNumber"
                value={formData.poNumber}
                className="po-entry-input po-entry-input-readonly"
                readOnly
                required
              />
              <small className="po-entry-hint">Auto-generated, immutable</small>
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="poDate" className="po-entry-label">
                PO Date <span className="po-entry-required">*</span>
              </label>
              <input
                type="date"
                id="poDate"
                name="poDate"
                value={formData.poDate}
                onChange={handleChange}
                className="po-entry-input"
                required
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="poValue" className="po-entry-label">
                PO Value
              </label>
              <input
                type="number"
                id="poValue"
                name="poValue"
                value={formData.poValue}
                onChange={handleChange}
                className="po-entry-input"
                step="0.01"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="poCurrency" className="po-entry-label">
                Currency
              </label>
              <select
                id="poCurrency"
                name="poCurrency"
                value={formData.poCurrency}
                onChange={handleChange}
                className="po-entry-select"
              >
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
            
            <div className="po-entry-field po-entry-field-full">
              <label htmlFor="poDescription" className="po-entry-label">
                PO Description
              </label>
              <textarea
                id="poDescription"
                name="poDescription"
                value={formData.poDescription}
                onChange={handleChange}
                className="po-entry-textarea"
                rows="4"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="poDeliveryLocation" className="po-entry-label">
                Delivery Location
              </label>
              <input
                type="text"
                id="poDeliveryLocation"
                name="poDeliveryLocation"
                value={formData.poDeliveryLocation}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
            
            <div className="po-entry-field po-entry-field-full">
              <label htmlFor="poDeliveryAddress" className="po-entry-label">
                Delivery Address
              </label>
              <textarea
                id="poDeliveryAddress"
                name="poDeliveryAddress"
                value={formData.poDeliveryAddress}
                onChange={handleChange}
                className="po-entry-textarea"
                rows="3"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="poDeliveryCity" className="po-entry-label">
                Delivery City
              </label>
              <input
                type="text"
                id="poDeliveryCity"
                name="poDeliveryCity"
                value={formData.poDeliveryCity}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="poDeliveryState" className="po-entry-label">
                Delivery State
              </label>
              <select
                id="poDeliveryState"
                name="poDeliveryState"
                value={formData.poDeliveryState}
                onChange={handleChange}
                className="po-entry-select"
              >
                <option value="">Select State</option>
                {INDIA_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="poDeliveryPinCode" className="po-entry-label">
                Delivery Pin Code
              </label>
              <input
                type="text"
                id="poDeliveryPinCode"
                name="poDeliveryPinCode"
                value={formData.poDeliveryPinCode}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="poDeliveryDate" className="po-entry-label">
                Delivery Date
              </label>
              <input
                type="date"
                id="poDeliveryDate"
                name="poDeliveryDate"
                value={formData.poDeliveryDate}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="paymentTermsId" className="po-entry-label">
                Payment Terms
              </label>
              <select
                id="paymentTermsId"
                name="paymentTermsId"
                value={formData.paymentTermsId}
                onChange={handlePaymentTermsChange}
                className="po-entry-select"
              >
                <option value="">Select Payment Terms from Master Data</option>
                {paymentTerms.map((terms) => (
                  <option key={terms.id} value={terms.id}>
                    {terms.name}
                  </option>
                ))}
              </select>
              {paymentTerms.length === 0 && (
                <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                  No payment terms found. <a href="/master-data/new/payment-terms" style={{ color: 'var(--color-primary)' }}>Create one in Master Data</a>
                </p>
              )}
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="poPaymentTerms" className="po-entry-label">
                Payment Terms Description (Auto-filled)
              </label>
              <textarea
                id="poPaymentTerms"
                name="poPaymentTerms"
                value={formData.poPaymentTerms}
                onChange={handleChange}
                className="po-entry-textarea"
                rows="2"
                readOnly
                style={{ background: 'var(--color-bg-tertiary)' }}
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="poWarrantyPeriod" className="po-entry-label">
                Warranty Period
              </label>
              <input
                type="text"
                id="poWarrantyPeriod"
                name="poWarrantyPeriod"
                value={formData.poWarrantyPeriod}
                onChange={handleChange}
                className="po-entry-input"
                placeholder="e.g., 12 months"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="poValidityPeriod" className="po-entry-label">
                Validity Period
              </label>
              <input
                type="text"
                id="poValidityPeriod"
                name="poValidityPeriod"
                value={formData.poValidityPeriod}
                onChange={handleChange}
                className="po-entry-input"
                placeholder="e.g., 90 days"
              />
            </div>
          </div>
        </div>

        {/* Tender & Agreement Details */}
        <div className="po-entry-section">
          <h2 className="po-entry-section-title">Tender & Agreement Details</h2>
          <div className="po-entry-form-grid">
            <div className="po-entry-field">
              <label htmlFor="tenderNumber" className="po-entry-label">
                Tender Number
              </label>
              <input
                type="text"
                id="tenderNumber"
                name="tenderNumber"
                value={formData.tenderNumber}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="tenderDate" className="po-entry-label">
                Tender Date
              </label>
              <input
                type="date"
                id="tenderDate"
                name="tenderDate"
                value={formData.tenderDate}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
            
            <div className="po-entry-field po-entry-field-full">
              <label htmlFor="tenderAuthority" className="po-entry-label">
                Tender Authority
              </label>
              <input
                type="text"
                id="tenderAuthority"
                name="tenderAuthority"
                value={formData.tenderAuthority}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="agreementNumber" className="po-entry-label">
                Agreement Number
              </label>
              <input
                type="text"
                id="agreementNumber"
                name="agreementNumber"
                value={formData.agreementNumber}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="agreementDate" className="po-entry-label">
                Agreement Date
              </label>
              <input
                type="date"
                id="agreementDate"
                name="agreementDate"
                value={formData.agreementDate}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="agreementValue" className="po-entry-label">
                Agreement Value
              </label>
              <input
                type="number"
                id="agreementValue"
                name="agreementValue"
                value={formData.agreementValue}
                onChange={handleChange}
                className="po-entry-input"
                step="0.01"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="agreementStartDate" className="po-entry-label">
                Agreement Start Date
              </label>
              <input
                type="date"
                id="agreementStartDate"
                name="agreementStartDate"
                value={formData.agreementStartDate}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="agreementEndDate" className="po-entry-label">
                Agreement End Date
              </label>
              <input
                type="date"
                id="agreementEndDate"
                name="agreementEndDate"
                value={formData.agreementEndDate}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
            
            <div className="po-entry-field po-entry-field-full">
              <label htmlFor="agreementTerms" className="po-entry-label">
                Agreement Terms
              </label>
              <textarea
                id="agreementTerms"
                name="agreementTerms"
                value={formData.agreementTerms}
                onChange={handleChange}
                className="po-entry-textarea"
                rows="4"
              />
            </div>
          </div>
        </div>

        {/* Insurance Details */}
        <div className="po-entry-section">
          <h2 className="po-entry-section-title">Insurance Details</h2>
          <div className="po-entry-form-grid">
            <div className="po-entry-field">
              <label htmlFor="insuranceRequired" className="po-entry-label">
                Insurance Required
              </label>
              <select
                id="insuranceRequired"
                name="insuranceRequired"
                value={formData.insuranceRequired}
                onChange={handleChange}
                className="po-entry-select"
              >
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="insuranceType" className="po-entry-label">
                Insurance Type
              </label>
              <input
                type="text"
                id="insuranceType"
                name="insuranceType"
                value={formData.insuranceType}
                onChange={handleChange}
                className="po-entry-input"
                placeholder="e.g., General Liability"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="insuranceProvider" className="po-entry-label">
                Insurance Provider
              </label>
              <input
                type="text"
                id="insuranceProvider"
                name="insuranceProvider"
                value={formData.insuranceProvider}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="insurancePolicyNumber" className="po-entry-label">
                Policy Number
              </label>
              <input
                type="text"
                id="insurancePolicyNumber"
                name="insurancePolicyNumber"
                value={formData.insurancePolicyNumber}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="insuranceStartDate" className="po-entry-label">
                Insurance Start Date
              </label>
              <input
                type="date"
                id="insuranceStartDate"
                name="insuranceStartDate"
                value={formData.insuranceStartDate}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="insuranceEndDate" className="po-entry-label">
                Insurance End Date
              </label>
              <input
                type="date"
                id="insuranceEndDate"
                name="insuranceEndDate"
                value={formData.insuranceEndDate}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="insuranceAmount" className="po-entry-label">
                Insurance Amount
              </label>
              <input
                type="number"
                id="insuranceAmount"
                name="insuranceAmount"
                value={formData.insuranceAmount}
                onChange={handleChange}
                className="po-entry-input"
                step="0.01"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="insurancePremium" className="po-entry-label">
                Insurance Premium
              </label>
              <input
                type="number"
                id="insurancePremium"
                name="insurancePremium"
                value={formData.insurancePremium}
                onChange={handleChange}
                className="po-entry-input"
                step="0.01"
              />
            </div>
          </div>
        </div>

        {/* Bank Guarantee Details */}
        <div className="po-entry-section">
          <h2 className="po-entry-section-title">Bank Guarantee Details</h2>
          <div className="po-entry-form-grid">
            <div className="po-entry-field">
              <label htmlFor="bankGuaranteeRequired" className="po-entry-label">
                Bank Guarantee Required
              </label>
              <select
                id="bankGuaranteeRequired"
                name="bankGuaranteeRequired"
                value={formData.bankGuaranteeRequired}
                onChange={handleChange}
                className="po-entry-select"
              >
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="bankGuaranteeType" className="po-entry-label">
                Bank Guarantee Type
              </label>
              <input
                type="text"
                id="bankGuaranteeType"
                name="bankGuaranteeType"
                value={formData.bankGuaranteeType}
                onChange={handleChange}
                className="po-entry-input"
                placeholder="e.g., Performance BG"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="bankName" className="po-entry-label">
                Bank Name
              </label>
              <input
                type="text"
                id="bankName"
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="bankGuaranteeNumber" className="po-entry-label">
                Bank Guarantee Number
              </label>
              <input
                type="text"
                id="bankGuaranteeNumber"
                name="bankGuaranteeNumber"
                value={formData.bankGuaranteeNumber}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="bankGuaranteeDate" className="po-entry-label">
                Bank Guarantee Date
              </label>
              <input
                type="date"
                id="bankGuaranteeDate"
                name="bankGuaranteeDate"
                value={formData.bankGuaranteeDate}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="bankGuaranteeAmount" className="po-entry-label">
                Bank Guarantee Amount
              </label>
              <input
                type="number"
                id="bankGuaranteeAmount"
                name="bankGuaranteeAmount"
                value={formData.bankGuaranteeAmount}
                onChange={handleChange}
                className="po-entry-input"
                step="0.01"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="bankGuaranteeValidityDate" className="po-entry-label">
                Bank Guarantee Validity Date
              </label>
              <input
                type="date"
                id="bankGuaranteeValidityDate"
                name="bankGuaranteeValidityDate"
                value={formData.bankGuaranteeValidityDate}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="bankGuaranteePercentage" className="po-entry-label">
                Bank Guarantee Percentage
              </label>
              <input
                type="number"
                id="bankGuaranteePercentage"
                name="bankGuaranteePercentage"
                value={formData.bankGuaranteePercentage}
                onChange={handleChange}
                className="po-entry-input"
                step="0.01"
                placeholder="e.g., 5.00"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="po-entry-actions">
          <button
            type="button"
            onClick={() => navigate('/po-entry')}
            className="po-entry-button po-entry-button-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="po-entry-button po-entry-button-primary"
          >
            Submit PO Entry
          </button>
        </div>
      </form>
    </div>
  )
}

export default POEntry

