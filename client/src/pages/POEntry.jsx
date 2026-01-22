import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Plus, X, Trash2 } from 'lucide-react'
import { useMasterData } from '../contexts/MasterDataContext'
import * as poEntryService from '../services/poEntryService'
import { INDIA_STATES, COUNTRIES } from '../utils/indiaStates'
import '../styles/POEntry.css'

// Option sets from Excel format
const BUSINESS_UNITS = ['MAIN', 'UNIT1', 'UNIT2', 'UNIT3', 'Other']
const SEGMENTS = ['Domestic', 'Export']
const ZONES = ['North', 'East', 'West', 'South']
const PAYMENT_TYPES = ['Secured','Unsecured', 'Govt', 'Other']
const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'Other']

function POEntry() {
  const navigate = useNavigate()
  const { getCustomers, getPaymentTerms, getEmployees, getCompanies } = useMasterData()
  const [customers, setCustomers] = useState([])
  const [paymentTerms, setPaymentTerms] = useState([])
  const [employees, setEmployees] = useState([])
  const [companies, setCompanies] = useState([])
  
  // BOQ Line Items
  const [boqItems, setBoqItems] = useState([
    {
      id: 1,
      materialDescription: '',
      quantity: '',
      uom: '',
      unitPrice: '',
      unitCost: '',
      freight: '',
      gst: '',
      totalCost: '',
    },
  ])

  const [formData, setFormData] = useState({
    // Customer Name
    customerId: '',
    customerName: '',
    
    // Legal Entity Name
    legalEntityName: '',
    
    // Customer Address
    customerAddress: '',
    
    // District
    customerDistrict: '',
    
    // State
    customerState: '',
    
    // Country
    customerCountry: 'India',
    
    // Pin Code
    customerPinCode: '',
    
    // GST No
    customerGSTIN: '',
    
    // Business Unit
    businessUnit: '',
    
    // Segment
    segment: '',
    
    // Zone
    zone: '',
    
    // Contract Agreement No
    contractAgreementNo: '',
    
    // Contract Agreement Date
    contractAgreementDate: '',
    
    // Purchase Order No
    poNumber: '',
    
    // Purchase Order Date
    poDate: '',
    
    // Letter of Intent No
    loiNumber: '',
    
    // Letter of Intent Date
    loiDate: '',
    
    // Letter of Award No
    loaNumber: '',
    
    // Letter of Award Date
    loaDate: '',
    
    // Tender Reference No
    tenderNumber: '',
    
    // Tender Date
    tenderDate: '',
    
    // Project Description
    projectDescription: '',
    
    // Payment Type
    paymentType: '',
    
    // Payment Terms
    paymentTermsId: '',
    poPaymentTerms: '',
    
    // Payment Terms Clause in PO
    paymentTermsClauseInPO: '',
    
    // Insurance Type
    insuranceType: '',
    
    // Policy No
    insurancePolicyNumber: '',
    
    // Policy Date
    insurancePolicyDate: '',
    
    // Policy Company
    insurancePolicyCompany: '',
    
    // Policy Valid upto
    insurancePolicyValidUpto: '',
    
    // Policy Clause in PO
    insurancePolicyClauseInPO: '',
    
    // Policy Remarks
    insurancePolicyRemarks: '',
    
    // Bank Guarantee Type
    bankGuaranteeType: '',
    
    // Bank Guarantee No
    bankGuaranteeNumber: '',
    
    // Bank Guarantee Date
    bankGuaranteeDate: '',
    
    // Bank Guarantee Value
    bankGuaranteeValue: '',
    
    // Bank Name
    bankName: '',
    
    // Bank Guarantee Validity
    bankGuaranteeValidity: '',
    
    // Bank Guarantee Release & Validity Clause in PO
    bankGuaranteeReleaseValidityClauseInPO: '',
    
    // Bank Guarantee Remarks
    bankGuaranteeRemarks: '',
    
    // Sales Manager
    salesManagerId: '',
    
    // Sales Head
    salesHeadId: '',
    
    // Business Head
    businessHeadId: '',
    
    // Project Manager
    projectManagerId: '',
    
    // Project Head
    projectHeadId: '',
    
    // Collection Incharge
    collectionInchargeId: '',
    
    // Sales Agent Name
    salesAgentName: '',
    
    // Sales Agent Commission
    salesAgentCommission: '',
    
    // Collection Agent Name
    collectionAgentName: '',
    
    // Collection Agent Commission
    collectionAgentCommission: '',
    
    // Delivery Schedule Clause
    deliveryScheduleClause: '',
    
    // Liquidated Damages Clause
    liquidatedDamagesClause: '',
    
    // Last Date of Delivery
    lastDateOfDelivery: '',
    
    // PO Validity
    poValidity: '',
    
    // PO Signed Concern Name
    poSignedConcernName: '',
    
    // Internal fields for calculations and other purposes
    poValue: '',
    poCurrency: 'INR',
    
    // "Other" fields for dropdowns
    businessUnitOther: '',
    segmentOther: '',
    zoneOther: '',
    paymentTypeOther: '',
    poCurrencyOther: '',
    customerStateOther: '',
  })

  useEffect(() => {
    // Load Master Data for dropdowns
    setCustomers(getCustomers())
    setPaymentTerms(getPaymentTerms())
    setEmployees(getEmployees())
    setCompanies(getCompanies())
  }, [getCustomers, getPaymentTerms, getEmployees, getCompanies])
  
  // Auto-generate PO Number when form is initialized (only once)
  useEffect(() => {
    if (!formData.poNumber) {
      const generatedPONumber = poEntryService.generatePONumber(formData.businessUnit || 'MAIN')
      setFormData((prev) => ({ ...prev, poNumber: generatedPONumber }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array - only run once on mount

  // Calculate BOQ totals
  const boqTotals = useMemo(() => {
    let totalExWorks = 0
    let totalFreight = 0
    let totalGST = 0
    let totalPOValue = 0

    boqItems.forEach((item) => {
      const quantity = parseFloat(item.quantity) || 0
      const unitCost = parseFloat(item.unitCost) || 0
      const freight = parseFloat(item.freight) || 0
      const gst = parseFloat(item.gst) || 0
      const totalCost = parseFloat(item.totalCost) || 0

      // Total Ex-Works = sum of (unit cost * quantity) for all items
      totalExWorks += unitCost * quantity
      // Total Freight = sum of freight for all items
      totalFreight += freight
      // Total GST = sum of GST for all items
      totalGST += gst
      // Total PO Value = sum of total cost for all items
      totalPOValue += totalCost
    })

    return {
      totalExWorks: totalExWorks.toFixed(2),
      totalFreight: totalFreight.toFixed(2),
      totalGST: totalGST.toFixed(2),
      totalPOValue: totalPOValue.toFixed(2),
    }
  }, [boqItems])

  // Update PO Value when BOQ totals change
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      poValue: boqTotals.totalPOValue,
    }))
  }, [boqTotals.totalPOValue])

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
        customerName: customer.name || customer.customerName || '',
        customerAddress: customer.address || customer.customerAddress || '',
        customerState: customer.state || '',
        customerDistrict: customer.district || '',
        customerPinCode: customer.pinCode || '',
        customerGSTIN: customer.gstin || customer.gstNo || '',
        segment: customer.segment || '',
        legalEntityName: customer.legalEntityName || '',
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        customerId: '',
        customerName: '',
        customerAddress: '',
        customerState: '',
        customerDistrict: '',
        customerPinCode: '',
        customerGSTIN: '',
        legalEntityName: '',
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
        poPaymentTerms: terms.paymentTermsDescription || terms.description || terms.name || '',
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        paymentTermsId: '',
        poPaymentTerms: '',
      }))
    }
  }

  // BOQ Item Handlers
  const handleAddBOQItem = () => {
    const newId = Math.max(...boqItems.map((item) => item.id), 0) + 1
    setBoqItems([
      ...boqItems,
      {
        id: newId,
        materialDescription: '',
        quantity: '',
        uom: '',
        unitPrice: '',
        unitCost: '',
        freight: '',
        gst: '',
        totalCost: '',
      },
    ])
  }

  const handleRemoveBOQItem = (id) => {
    if (boqItems.length > 1) {
      setBoqItems(boqItems.filter((item) => item.id !== id))
    }
  }

  const handleBOQItemChange = (id, field, value) => {
    setBoqItems(
      boqItems.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value }
          
          // Auto-calculate total cost: (quantity * unit cost) + freight + GST
          const quantity = parseFloat(updated.quantity) || 0
          const unitCost = parseFloat(updated.unitCost) || 0
          const freight = parseFloat(updated.freight) || 0
          const gst = parseFloat(updated.gst) || 0
          
          const calculatedTotal = quantity * unitCost + freight + gst
          updated.totalCost = calculatedTotal > 0 ? calculatedTotal.toFixed(2) : ''
          
          return updated
        }
        return item
      })
    )
  }

  const handleSaveDraft = () => {
    try {
      const draft = {
        ...formData,
        boqItems,
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
      boqItems,
      boqTotals,
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

  // Filter employees by role
  const getEmployeesByRole = (roleKeywords) => {
    return employees.filter((emp) => {
      const role = (emp.role || emp.designation || '').toLowerCase()
      return roleKeywords.some((keyword) => role.includes(keyword.toLowerCase()))
    })
  }

  const salesManagers = getEmployeesByRole(['sales manager'])
  const salesHeads = getEmployeesByRole(['sales head'])
  const projectManagers = getEmployeesByRole(['project manager'])
  const projectHeads = getEmployeesByRole(['project head'])
  const businessHeads = getEmployeesByRole(['business head'])
  const collectionIncharges = getEmployeesByRole(['collection incharge'])
  const salesAgents = getEmployeesByRole(['sales agent'])
  const collectionAgents = getEmployeesByRole(['collection agent'])

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
        {/* Customer & Basic Information */}
        <div className="po-entry-section">
          <h2 className="po-entry-section-title">Customer & Basic Information</h2>
          <div className="po-entry-form-grid">
            <div className="po-entry-field">
              <label htmlFor="customerId" className="po-entry-label">
                Customer Name <span className="po-entry-required">*</span>
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
                    {customer.name || customer.customerName} {customer.gstin || customer.gstNo ? `(${customer.gstin || customer.gstNo})` : ''}
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
              <label htmlFor="legalEntityName" className="po-entry-label">
                Legal Entity Name
              </label>
              <input
                type="text"
                id="legalEntityName"
                name="legalEntityName"
                value={formData.legalEntityName}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
            
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
              <label htmlFor="customerDistrict" className="po-entry-label">
                District
              </label>
              <input
                type="text"
                id="customerDistrict"
                name="customerDistrict"
                value={formData.customerDistrict}
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
                <option value="Other">Other</option>
              </select>
              {formData.customerState === 'Other' && (
                <input
                  type="text"
                  id="customerStateOther"
                  name="customerStateOther"
                  value={formData.customerStateOther}
                  onChange={handleChange}
                  className="po-entry-input"
                  placeholder="Enter state name"
                  style={{ marginTop: '8px' }}
                />
              )}
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="customerCountry" className="po-entry-label">
                Country
              </label>
              <select
                id="customerCountry"
                name="customerCountry"
                value={formData.customerCountry}
                onChange={handleChange}
                className="po-entry-select"
              >
                {COUNTRIES.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
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
                GST No
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
              <label htmlFor="businessUnit" className="po-entry-label">
                Business Unit
              </label>
              <select
                id="businessUnit"
                name="businessUnit"
                value={formData.businessUnit}
                onChange={handleChange}
                className="po-entry-select"
              >
                <option value="">Select Business Unit</option>
                {BUSINESS_UNITS.filter((unit) => unit !== 'Other').map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
                <option value="Other">Other</option>
              </select>
              {formData.businessUnit === 'Other' && (
                <input
                  type="text"
                  id="businessUnitOther"
                  name="businessUnitOther"
                  value={formData.businessUnitOther}
                  onChange={handleChange}
                  className="po-entry-input"
                  placeholder="Enter business unit"
                  style={{ marginTop: '8px' }}
                />
              )}
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="segment" className="po-entry-label">
                Segment
              </label>
              <select
                id="segment"
                name="segment"
                value={formData.segment}
                onChange={handleChange}
                className="po-entry-select"
              >
                <option value="">Select Segment</option>
                {SEGMENTS.map((segment) => (
                  <option key={segment} value={segment}>
                    {segment}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="zone" className="po-entry-label">
                Zone
              </label>
              <select
                id="zone"
                name="zone"
                value={formData.zone}
                onChange={handleChange}
                className="po-entry-select"
              >
                <option value="">Select Zone</option>
                {ZONES.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Contract, Agreement & PO Details */}
        <div className="po-entry-section">
          <h2 className="po-entry-section-title">Contract, Agreement & PO Details</h2>
          <div className="po-entry-form-grid">
            <div className="po-entry-field">
              <label htmlFor="contractAgreementNo" className="po-entry-label">
                Contract Agreement No
              </label>
              <input
                type="text"
                id="contractAgreementNo"
                name="contractAgreementNo"
                value={formData.contractAgreementNo}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="contractAgreementDate" className="po-entry-label">
                Contract Agreement Date
              </label>
              <input
                type="date"
                id="contractAgreementDate"
                name="contractAgreementDate"
                value={formData.contractAgreementDate}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="poNumber" className="po-entry-label">
                Purchase Order No <span className="po-entry-required">*</span>
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
                Purchase Order Date <span className="po-entry-required">*</span>
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
          </div>
        </div>

        {/* LOI, LOA & Tender References */}
        <div className="po-entry-section">
          <h2 className="po-entry-section-title">LOI, LOA & Tender References</h2>
          <div className="po-entry-form-grid">
            <div className="po-entry-field">
              <label htmlFor="loiNumber" className="po-entry-label">
                Letter of Intent No
              </label>
              <input
                type="text"
                id="loiNumber"
                name="loiNumber"
                value={formData.loiNumber}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="loiDate" className="po-entry-label">
                Letter of Intent Date
              </label>
              <input
                type="date"
                id="loiDate"
                name="loiDate"
                value={formData.loiDate}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="loaNumber" className="po-entry-label">
                Letter of Award No
              </label>
              <input
                type="text"
                id="loaNumber"
                name="loaNumber"
                value={formData.loaNumber}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="loaDate" className="po-entry-label">
                Letter of Award Date
              </label>
              <input
                type="date"
                id="loaDate"
                name="loaDate"
                value={formData.loaDate}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="tenderNumber" className="po-entry-label">
                Tender Reference No
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
          </div>
        </div>

        {/* Project Description */}
        <div className="po-entry-section">
          <h2 className="po-entry-section-title">Project Description</h2>
          <div className="po-entry-form-grid">
            <div className="po-entry-field po-entry-field-full">
              <label htmlFor="projectDescription" className="po-entry-label">
                Project Description
              </label>
              <textarea
                id="projectDescription"
                name="projectDescription"
                value={formData.projectDescription}
                onChange={handleChange}
                className="po-entry-textarea"
                rows="4"
              />
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="po-entry-section">
          <h2 className="po-entry-section-title">Payment Details</h2>
          <div className="po-entry-form-grid">
            <div className="po-entry-field">
              <label htmlFor="paymentType" className="po-entry-label">
                Payment Type
              </label>
              <select
                id="paymentType"
                name="paymentType"
                value={formData.paymentType}
                onChange={handleChange}
                className="po-entry-select"
              >
                <option value="">Select Payment Type</option>
                {PAYMENT_TYPES.filter((type) => type !== 'Other').map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
                <option value="Other">Other</option>
              </select>
              {formData.paymentType === 'Other' && (
                <input
                  type="text"
                  id="paymentTypeOther"
                  name="paymentTypeOther"
                  value={formData.paymentTypeOther}
                  onChange={handleChange}
                  className="po-entry-input"
                  placeholder="Enter payment type"
                  style={{ marginTop: '8px' }}
                />
              )}
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
                    {terms.name || terms.paymentTermsDescription}
                  </option>
                ))}
              </select>
              {paymentTerms.length === 0 && (
                <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                  No payment terms found. <a href="/master-data/new/payment-terms" style={{ color: 'var(--color-primary)' }}>Create one in Master Data</a>
                </p>
              )}
            </div>
            
            <div className="po-entry-field po-entry-field-full">
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
            
            <div className="po-entry-field po-entry-field-full">
              <label htmlFor="paymentTermsClauseInPO" className="po-entry-label">
                Payment Terms Clause in PO
              </label>
              <textarea
                id="paymentTermsClauseInPO"
                name="paymentTermsClauseInPO"
                value={formData.paymentTermsClauseInPO}
                onChange={handleChange}
                className="po-entry-textarea"
                rows="4"
                placeholder="Enter payment terms clause in PO..."
              />
            </div>
          </div>
        </div>

        {/* Insurance Details */}
        <div className="po-entry-section">
          <h2 className="po-entry-section-title">Insurance Details</h2>
          <div className="po-entry-form-grid">
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
              <label htmlFor="insurancePolicyNumber" className="po-entry-label">
                Policy No
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
              <label htmlFor="insurancePolicyDate" className="po-entry-label">
                Policy Date
              </label>
              <input
                type="date"
                id="insurancePolicyDate"
                name="insurancePolicyDate"
                value={formData.insurancePolicyDate}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="insurancePolicyCompany" className="po-entry-label">
                Policy Company
              </label>
              <input
                type="text"
                id="insurancePolicyCompany"
                name="insurancePolicyCompany"
                value={formData.insurancePolicyCompany}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="insurancePolicyValidUpto" className="po-entry-label">
                Policy Valid upto
              </label>
              <input
                type="date"
                id="insurancePolicyValidUpto"
                name="insurancePolicyValidUpto"
                value={formData.insurancePolicyValidUpto}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
            
            <div className="po-entry-field po-entry-field-full">
              <label htmlFor="insurancePolicyClauseInPO" className="po-entry-label">
                Policy Clause in PO
              </label>
              <textarea
                id="insurancePolicyClauseInPO"
                name="insurancePolicyClauseInPO"
                value={formData.insurancePolicyClauseInPO}
                onChange={handleChange}
                className="po-entry-textarea"
                rows="4"
                placeholder="Enter policy clause in PO..."
              />
            </div>
            
            <div className="po-entry-field po-entry-field-full">
              <label htmlFor="insurancePolicyRemarks" className="po-entry-label">
                Policy Remarks
              </label>
              <textarea
                id="insurancePolicyRemarks"
                name="insurancePolicyRemarks"
                value={formData.insurancePolicyRemarks}
                onChange={handleChange}
                className="po-entry-textarea"
                rows="3"
                placeholder="Enter policy remarks..."
              />
            </div>
          </div>
        </div>

        {/* Bank Guarantee Details */}
        <div className="po-entry-section">
          <h2 className="po-entry-section-title">Bank Guarantee Details</h2>
          <div className="po-entry-form-grid">
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
              <label htmlFor="bankGuaranteeNumber" className="po-entry-label">
                Bank Guarantee No
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
              <label htmlFor="bankGuaranteeValue" className="po-entry-label">
                Bank Guarantee Value
              </label>
              <input
                type="number"
                id="bankGuaranteeValue"
                name="bankGuaranteeValue"
                value={formData.bankGuaranteeValue}
                onChange={handleChange}
                className="po-entry-input"
                step="0.01"
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
              <label htmlFor="bankGuaranteeValidity" className="po-entry-label">
                Bank Guarantee Validity
              </label>
              <input
                type="date"
                id="bankGuaranteeValidity"
                name="bankGuaranteeValidity"
                value={formData.bankGuaranteeValidity}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
            
            <div className="po-entry-field po-entry-field-full">
              <label htmlFor="bankGuaranteeReleaseValidityClauseInPO" className="po-entry-label">
                Bank Guarantee Release & Validity Clause in PO
              </label>
              <textarea
                id="bankGuaranteeReleaseValidityClauseInPO"
                name="bankGuaranteeReleaseValidityClauseInPO"
                value={formData.bankGuaranteeReleaseValidityClauseInPO}
                onChange={handleChange}
                className="po-entry-textarea"
                rows="4"
                placeholder="Enter bank guarantee release & validity clause in PO..."
              />
            </div>
            
            <div className="po-entry-field po-entry-field-full">
              <label htmlFor="bankGuaranteeRemarks" className="po-entry-label">
                Bank Guarantee Remarks
              </label>
              <textarea
                id="bankGuaranteeRemarks"
                name="bankGuaranteeRemarks"
                value={formData.bankGuaranteeRemarks}
                onChange={handleChange}
                className="po-entry-textarea"
                rows="3"
                placeholder="Enter bank guarantee remarks..."
              />
            </div>
          </div>
        </div>

        {/* Role Assignments */}
        <div className="po-entry-section">
          <h2 className="po-entry-section-title">Role Assignments</h2>
          <div className="po-entry-form-grid">
            <div className="po-entry-field">
              <label htmlFor="salesManagerId" className="po-entry-label">
                Sales Manager
              </label>
              <select
                id="salesManagerId"
                name="salesManagerId"
                value={formData.salesManagerId}
                onChange={handleChange}
                className="po-entry-select"
              >
                <option value="">Select Sales Manager</option>
                {salesManagers.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name || emp.nameOfEmployee} {emp.designation ? `(${emp.designation})` : ''}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="salesHeadId" className="po-entry-label">
                Sales Head
              </label>
              <select
                id="salesHeadId"
                name="salesHeadId"
                value={formData.salesHeadId}
                onChange={handleChange}
                className="po-entry-select"
              >
                <option value="">Select Sales Head</option>
                {salesHeads.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name || emp.nameOfEmployee} {emp.designation ? `(${emp.designation})` : ''}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="businessHeadId" className="po-entry-label">
                Business Head
              </label>
              <select
                id="businessHeadId"
                name="businessHeadId"
                value={formData.businessHeadId}
                onChange={handleChange}
                className="po-entry-select"
              >
                <option value="">Select Business Head</option>
                {businessHeads.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name || emp.nameOfEmployee} {emp.designation ? `(${emp.designation})` : ''}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="projectManagerId" className="po-entry-label">
                Project Manager
              </label>
              <select
                id="projectManagerId"
                name="projectManagerId"
                value={formData.projectManagerId}
                onChange={handleChange}
                className="po-entry-select"
              >
                <option value="">Select Project Manager</option>
                {projectManagers.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name || emp.nameOfEmployee} {emp.designation ? `(${emp.designation})` : ''}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="projectHeadId" className="po-entry-label">
                Project Head
              </label>
              <select
                id="projectHeadId"
                name="projectHeadId"
                value={formData.projectHeadId}
                onChange={handleChange}
                className="po-entry-select"
              >
                <option value="">Select Project Head</option>
                {projectHeads.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name || emp.nameOfEmployee} {emp.designation ? `(${emp.designation})` : ''}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="collectionInchargeId" className="po-entry-label">
                Collection Incharge
              </label>
              <select
                id="collectionInchargeId"
                name="collectionInchargeId"
                value={formData.collectionInchargeId}
                onChange={handleChange}
                className="po-entry-select"
              >
                <option value="">Select Collection Incharge</option>
                {collectionIncharges.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name || emp.nameOfEmployee} {emp.designation ? `(${emp.designation})` : ''}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="salesAgentName" className="po-entry-label">
                Sales Agent Name
              </label>
              <select
                id="salesAgentName"
                name="salesAgentName"
                value={formData.salesAgentName}
                onChange={handleChange}
                className="po-entry-select"
              >
                <option value="">Select Sales Agent</option>
                {salesAgents.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name || emp.nameOfEmployee} {emp.designation ? `(${emp.designation})` : ''}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="salesAgentCommission" className="po-entry-label">
                Sales Agent Commission
              </label>
              <input
                type="number"
                id="salesAgentCommission"
                name="salesAgentCommission"
                value={formData.salesAgentCommission}
                onChange={handleChange}
                className="po-entry-input"
                step="0.01"
                placeholder="0.00"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="collectionAgentName" className="po-entry-label">
                Collection Agent Name
              </label>
              <select
                id="collectionAgentName"
                name="collectionAgentName"
                value={formData.collectionAgentName}
                onChange={handleChange}
                className="po-entry-select"
              >
                <option value="">Select Collection Agent</option>
                {collectionAgents.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name || emp.nameOfEmployee} {emp.designation ? `(${emp.designation})` : ''}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="collectionAgentCommission" className="po-entry-label">
                Collection Agent Commission
              </label>
              <input
                type="number"
                id="collectionAgentCommission"
                name="collectionAgentCommission"
                value={formData.collectionAgentCommission}
                onChange={handleChange}
                className="po-entry-input"
                step="0.01"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Delivery Schedule & Other Details */}
        <div className="po-entry-section">
          <h2 className="po-entry-section-title">Delivery Schedule & Other Details</h2>
          <div className="po-entry-form-grid">
            <div className="po-entry-field po-entry-field-full">
              <label htmlFor="deliveryScheduleClause" className="po-entry-label">
                Delivery Schedule Clause
              </label>
              <textarea
                id="deliveryScheduleClause"
                name="deliveryScheduleClause"
                value={formData.deliveryScheduleClause}
                onChange={handleChange}
                className="po-entry-textarea"
                rows="6"
                placeholder="Enter delivery schedule clause..."
              />
            </div>
            
            <div className="po-entry-field po-entry-field-full">
              <label htmlFor="liquidatedDamagesClause" className="po-entry-label">
                Liquidated Damages Clause
              </label>
              <textarea
                id="liquidatedDamagesClause"
                name="liquidatedDamagesClause"
                value={formData.liquidatedDamagesClause}
                onChange={handleChange}
                className="po-entry-textarea"
                rows="4"
                placeholder="Enter liquidated damages clause..."
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="lastDateOfDelivery" className="po-entry-label">
                Last Date of Delivery
              </label>
              <input
                type="date"
                id="lastDateOfDelivery"
                name="lastDateOfDelivery"
                value={formData.lastDateOfDelivery}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="poValidity" className="po-entry-label">
                PO Validity
              </label>
              <input
                type="text"
                id="poValidity"
                name="poValidity"
                value={formData.poValidity}
                onChange={handleChange}
                className="po-entry-input"
                placeholder="e.g., 90 days"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="poSignedConcernName" className="po-entry-label">
                PO Signed Concern Name
              </label>
              <input
                type="text"
                id="poSignedConcernName"
                name="poSignedConcernName"
                value={formData.poSignedConcernName}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
          </div>
        </div>

        {/* BOQ Section */}
        <div className="po-entry-section">
          <h2 className="po-entry-section-title">Bill of Quantities (BOQ)</h2>
          <div className="po-entry-boq-container">
            <div className="po-entry-boq-table-wrapper">
              <table className="po-entry-boq-table">
                <thead>
                  <tr>
                    <th style={{ width: '30%' }}>Material Description</th>
                    <th style={{ width: '10%' }}>Quantity</th>
                    <th style={{ width: '8%' }}>UOM</th>
                    <th style={{ width: '10%' }}>Unit Price</th>
                    <th style={{ width: '10%' }}>Unit Cost</th>
                    <th style={{ width: '10%' }}>Freight</th>
                    <th style={{ width: '10%' }}>GST</th>
                    <th style={{ width: '10%' }}>Total Cost</th>
                    <th style={{ width: '2%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {boqItems.map((item, index) => (
                    <tr key={item.id}>
                      <td>
                        <input
                          type="text"
                          value={item.materialDescription}
                          onChange={(e) => handleBOQItemChange(item.id, 'materialDescription', e.target.value)}
                          className="po-entry-boq-input"
                          placeholder="Enter material description"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleBOQItemChange(item.id, 'quantity', e.target.value)}
                          className="po-entry-boq-input"
                          placeholder="0"
                          step="0.01"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={item.uom}
                          onChange={(e) => handleBOQItemChange(item.id, 'uom', e.target.value)}
                          className="po-entry-boq-input"
                          placeholder="UOM"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleBOQItemChange(item.id, 'unitPrice', e.target.value)}
                          className="po-entry-boq-input"
                          placeholder="0.00"
                          step="0.01"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={item.unitCost}
                          onChange={(e) => handleBOQItemChange(item.id, 'unitCost', e.target.value)}
                          className="po-entry-boq-input"
                          placeholder="0.00"
                          step="0.01"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={item.freight}
                          onChange={(e) => handleBOQItemChange(item.id, 'freight', e.target.value)}
                          className="po-entry-boq-input"
                          placeholder="0.00"
                          step="0.01"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={item.gst}
                          onChange={(e) => handleBOQItemChange(item.id, 'gst', e.target.value)}
                          className="po-entry-boq-input"
                          placeholder="0.00"
                          step="0.01"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={item.totalCost}
                          readOnly
                          className="po-entry-boq-input po-entry-boq-input-readonly"
                          style={{ background: 'var(--color-bg-tertiary)' }}
                        />
                      </td>
                      <td>
                        {boqItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveBOQItem(item.id)}
                            className="po-entry-boq-remove-button"
                            aria-label="Remove row"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <button
              type="button"
              onClick={handleAddBOQItem}
              className="po-entry-boq-add-button"
            >
              <Plus className="po-entry-action-icon" />
              <span>Add Row</span>
            </button>
          </div>
        </div>

        {/* BOQ Summary */}
        <div className="po-entry-section">
          <h2 className="po-entry-section-title">BOQ Summary</h2>
          <div className="po-entry-form-grid">
            <div className="po-entry-field">
              <label className="po-entry-label">Total Ex-Works</label>
              <input
                type="text"
                value={boqTotals.totalExWorks}
                readOnly
                className="po-entry-input po-entry-input-readonly"
                style={{ background: 'var(--color-bg-tertiary)', fontWeight: 600 }}
              />
            </div>
            
            <div className="po-entry-field">
              <label className="po-entry-label">Total Freight</label>
              <input
                type="text"
                value={boqTotals.totalFreight}
                readOnly
                className="po-entry-input po-entry-input-readonly"
                style={{ background: 'var(--color-bg-tertiary)', fontWeight: 600 }}
              />
            </div>
            
            <div className="po-entry-field">
              <label className="po-entry-label">Total GST</label>
              <input
                type="text"
                value={boqTotals.totalGST}
                readOnly
                className="po-entry-input po-entry-input-readonly"
                style={{ background: 'var(--color-bg-tertiary)', fontWeight: 600 }}
              />
            </div>
            
            <div className="po-entry-field">
              <label className="po-entry-label">Total PO Value</label>
              <input
                type="text"
                value={boqTotals.totalPOValue}
                readOnly
                className="po-entry-input po-entry-input-readonly"
                style={{ background: 'var(--color-bg-tertiary)', fontWeight: 700, fontSize: '1.1em' }}
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
