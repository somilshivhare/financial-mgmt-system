import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Plus, X, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import DatePicker from '../components/DatePicker'
import { useMasterData } from '../contexts/MasterDataContext'
import { useToast } from '../contexts/ToastContext'
import * as poEntryService from '../services/poEntryService'
import { getPODraft, upsertPODraft, getPOById } from '../api/po'
import { useFormPersistence } from '../hooks/useFormPersistence'
import { INDIA_STATES, COUNTRIES } from '../utils/indiaStates'
import '../styles/POEntry.css'

// Option sets from Excel format
const BUSINESS_UNITS = ['MAIN', 'UNIT1', 'UNIT2', 'UNIT3', 'Other']
const SEGMENTS = ['Domestic', 'Export']
const ZONES = ['North', 'East', 'West', 'South']
const PAYMENT_TYPES = ['Secured','Unsecured', 'Govt', 'Other']
const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'Other']
const INSURANCE_TYPES = ['Marine Insurance', 'Group Accidental Policy', 'Workmen Compensation Policy', 'All Erection Policy', 'Others']
const BANK_GUARANTEE_TYPES = ['Advance Bank Guarantee', 'Performance Bank Guarantee', 'Bid Security', 'Retention', 'Others']

/**
 * PO Entry Component
 * 
 * MASTER DATA INTEGRATION REQUIREMENTS:
 * - Customer Name dropdown lists ALL customers from Master Data
 * - When a customer is selected, ALL related fields are auto-populated from that specific master data record
 * - Auto-filled fields are read-only/system-controlled to ensure data accuracy
 * - Each PO Entry is strictly linked to the selected master data record
 * - No data from other master data records is mixed or prefilled
 * - Data isolation ensures consistency across the system
 */
function POEntry() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { getCustomers, getPaymentTerms, getEmployees, getCompanies } = useMasterData()
  const { showToast } = useToast()
  const [customers, setCustomers] = useState([])
  const [paymentTerms, setPaymentTerms] = useState([])
  const [employees, setEmployees] = useState([])
  const [companies, setCompanies] = useState([])
  
  // Default form data structure
  const defaultFormData = {
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
    
    // BOQ section visibility (enable/disable)
    boqEnabled: true,

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
    insuranceTypeOther: '',
    bankGuaranteeTypeOther: '',
  }

  // Form persistence hook
  const {
    values: persistedData,
    setValues: setPersistedData,
    loading: persistenceLoading,
    saving: persistenceSaving,
    save: persistenceSave,
    load: persistenceLoad,
    clearLocalDraft,
  } = useFormPersistence({
    saveFn: async (data, entityId) => {
      // Draft save only: no status so server keeps/ sets draft. Submit uses savePOEntry (status: 'approved').
      // Ensure customerId is always sent (required field for new PO creation)
      const customerId = String(data.formData?.customerId || '').trim();
      if (!customerId) {
        // Skip save if customerId is missing (auto-save guard should prevent this, but double-check)
        console.warn('[POEntry] Skipping draft save: customerId is required');
        return null;
      }
      const saveData = {
        ...data.formData,
        customerId: customerId, // Explicitly set to ensure it's sent
        boqItems: data.boqItems || [],
        // Do not send status on draft save so existing row stays draft; Submit sends status: 'approved'
      }
      const result = await upsertPODraft(saveData, entityId || id)
      // Return shape so hook merges id/poNumber into values; Submit and next saves use same PO (no duplicate)
      if (result && (result.id || result.po_number)) {
        return {
          id: result.id,
          values: {
            formData: {
              ...data.formData,
              id: result.id ?? data.formData?.id,
              poNumber: result.po_number ?? result.poNumber ?? data.formData?.poNumber,
            },
          },
        }
      }
      return result
    },
    loadFn: async (entityIdParam) => {
      const poId = entityIdParam ?? id
      const emptyBoq = [{
        id: 1,
        materialDescription: '',
        quantity: '',
        uom: '',
        unitPrice: '',
        unitCost: '',
        freight: '',
        gst: '',
        totalCost: '',
      }]
      const normalizeForm = (fd) =>
        Object.fromEntries(
          Object.entries(fd || {}).map(([k, v]) => [k, v === undefined || v === null ? '' : v])
        )
      const normalizeBoq = (items) =>
        Array.isArray(items) && items.length > 0
          ? items.map((item, idx) => ({
              id: item.id ?? idx + 1,
              materialDescription: item.materialDescription ?? '',
              quantity: item.quantity ?? '',
              uom: item.uom ?? '',
              unitPrice: item.unitPrice ?? '',
              unitCost: item.unitCost ?? '',
              freight: item.freight ?? '',
              gst: item.gst ?? '',
              totalCost: item.totalCost ?? '',
            }))
          : emptyBoq

      // Edit: single GET /pos/:id with timeout so we never hang
      const FETCH_TIMEOUT_MS = 8000
      const withTimeout = (p, ms) =>
        Promise.race([
          p,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Load timed out. Check your connection.')), ms)
          ),
        ])

      if (poId) {
        try {
          const response = await withTimeout(getPOById(poId), FETCH_TIMEOUT_MS)
          const poEntry = response?.data ?? response
          const row = poEntry?.data ?? poEntry
          if (row?.formData != null && Array.isArray(row.boqItems)) {
            return {
              formData: {
                ...normalizeForm(row.formData),
                id: row.id,
                poNumber: row.formData.poNumber ?? row.po_number ?? '',
                poDate: row.formData.poDate ?? row.issue_date ?? '',
                customerId: row.formData.customerId ?? row.customer_id ?? '',
                customerName: row.formData.customerName ?? '',
                status: row.status ?? row.formData?.status ?? '',
              },
              boqItems: normalizeBoq(row.boqItems),
            }
          }
          if (row?.draft_data) {
            try {
              const parsed = typeof row.draft_data === 'string' ? JSON.parse(row.draft_data) : row.draft_data
              if (parsed?.formData) {
                return {
                  formData: {
                    ...normalizeForm(parsed.formData),
                    id: row.id,
                    status: row.status ?? parsed.formData?.status ?? '',
                  },
                  boqItems: normalizeBoq(parsed.boqItems),
                }
              }
            } catch (_) {}
          }
          // Legacy row: build minimal form from DB fields only
          if (row) {
            return {
              formData: normalizeForm({
                id: row.id,
                poNumber: row.po_number ?? row.poNumber ?? '',
                poDate: row.issue_date ?? row.poDate ?? '',
                customerId: row.customer_id ?? row.customerId ?? '',
                customerName: row.customer_name ?? row.customerName ?? '',
                status: row.status ?? '',
              }),
              boqItems: normalizeBoq(row.boqItems),
            }
          }
        } catch (err) {
          console.error('[POEntry] Failed to load PO:', err)
        }
        return null
      }

      // New entry (no poId): load latest draft if any; include id/status so Submit and autosave use same record
      try {
        const draft = await getPODraft(poId || null)
        if (draft) {
          const { boqItems: loadedBoqItems, ...rest } = draft
          return {
            formData: {
              ...normalizeForm(rest),
              id: draft.id,
              poNumber: rest.poNumber ?? rest.po_number ?? '',
              status: rest.status ?? '',
            },
            boqItems: normalizeBoq(loadedBoqItems),
          }
        }
      } catch (err) {
        console.error('[POEntry] Failed to load draft:', err)
      }
      return null
    },
    entityType: 'po',
    entityId: id || null,
    storagePathKey: 'po-entry',
    defaultValues: {
      formData: defaultFormData,
      boqItems: [{
        id: 1,
        materialDescription: '',
        quantity: '',
        uom: '',
        unitPrice: '',
        unitCost: '',
        freight: '',
        gst: '',
        totalCost: '',
      }],
    },
    // Autosave only for drafts; never overwrite a submitted PO (status approved)
    // Also require customerId to be present before auto-saving (prevents 500 errors from null customer_id)
    enableAutoSave: (values) => {
      const status = (values?.formData?.status || '').toString().toLowerCase();
      const customerId = String(values?.formData?.customerId || '').trim();
      return status !== 'approved' && customerId !== '';
    },
    autoSaveDelay: 2000,
  })

  // Extract formData and boqItems from persisted data (merge with defaults; coerce undefined to '' so inputs stay controlled)
  const rawForm = { ...defaultFormData, ...(persistedData.formData || {}) }
  const formData = Object.fromEntries(
    Object.entries(rawForm).map(([k, v]) => [k, v === undefined || v === null ? '' : v])
  )
  const boqItems = persistedData.boqItems || [{
    id: 1,
    materialDescription: '',
    quantity: '',
    uom: '',
    unitPrice: '',
    unitCost: '',
    freight: '',
    gst: '',
    totalCost: '',
  }]

  // Update form data
  const setFormData = (updater) => {
    if (typeof updater === 'function') {
      setPersistedData(prev => ({
        ...prev,
        formData: updater(prev.formData || defaultFormData),
      }))
    } else {
      setPersistedData(prev => ({
        ...prev,
        formData: updater,
      }))
    }
  }

  // Update BOQ items
  const setBoqItems = (updater) => {
    if (typeof updater === 'function') {
      setPersistedData(prev => ({
        ...prev,
        boqItems: updater(prev.boqItems || []),
      }))
    } else {
      setPersistedData(prev => ({
        ...prev,
        boqItems: updater,
      }))
    }
  }

  useEffect(() => {
    // Load Master Data for dropdowns
    const customersData = getCustomers()
    const paymentTermsData = getPaymentTerms()
    const employeesData = getEmployees()
    const companiesData = getCompanies()
    
    // Ensure all are arrays
    setCustomers(Array.isArray(customersData) ? customersData : [])
    setPaymentTerms(Array.isArray(paymentTermsData) ? paymentTermsData : [])
    setEmployees(Array.isArray(employeesData) ? employeesData : [])
    setCompanies(Array.isArray(companiesData) ? companiesData : [])
  }, [getCustomers, getPaymentTerms, getEmployees, getCompanies])
  
  // Auto-generate PO Number only for new entries (no id), and only when not loaded from persistence
  useEffect(() => {
    if (id) return
    if (!persistenceLoading && !formData.poNumber) {
      const generatedPONumber = poEntryService.generatePONumber(formData.businessUnit || 'MAIN')
      setFormData((prev) => ({ ...prev, poNumber: generatedPONumber }))
    }
  }, [id, persistenceLoading, formData.poNumber, formData.businessUnit])

  // Calculate BOQ totals
  const boqTotals = useMemo(() => {
    let totalExWorks = 0
    let totalFreight = 0
    let totalGST = 0
    let totalPOValue = 0

    // Ensure boqItems is an array
    if (!Array.isArray(boqItems)) {
      console.warn('boqItems is not an array:', boqItems)
      return {
        totalExWorks: '0.00',
        totalFreight: '0.00',
        totalGST: '0.00',
        totalPOValue: '0.00',
      }
    }

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

  /**
   * Get first value when Master Data stores allowMultiple as array
   */
  const first = (v) => (Array.isArray(v) ? v[0] : v)

  /**
   * Get value from Master Data values; supports allowMultiple keys (key_0, key_1, ...)
   */
  const val = (v, key) => {
    if (!v || !key) return ''
    const direct = v[key]
    if (direct !== undefined && direct !== null && direct !== '') return String(direct)
    const withZero = v[`${key}_0`]
    if (withZero !== undefined && withZero !== null && withZero !== '') return String(withZero)
    return Array.isArray(direct) ? (direct[0] != null ? String(direct[0]) : '') : ''
  }

  /**
   * Handle customer selection from Master Data
   * Fetches the selected customer's saved data from Master Data and populates all
   * customer-related PO form fields (including contact info). Data comes from customer-profile values only.
   */
  const handleCustomerChange = (e) => {
    const customerId = e.target.value
    const customer = customers.find((c) => c.id === customerId)
    
    if (customer) {
      const v = customer.values || customer
      const address = val(v, 'correspondenceAddress') || val(v, 'corporateOfficeAddress') || first(v.correspondenceAddress) || first(v.corporateOfficeAddress) || ''
      const district = (val(v, 'district') || first(v.district)) ?? v.district ?? ''
      const state = (val(v, 'state') || first(v.state)) ?? v.state ?? ''
      const country = (val(v, 'country') || first(v.country)) ?? v.country ?? 'India'
      const pinCode = (val(v, 'pinCode') || first(v.pinCode)) ?? v.pinCode ?? ''
      setFormData((prev) => ({
        ...prev,
        customerId,
        customerName: v.customerName || customer.customerName || customer.name || '',
        legalEntityName: v.legalEntityName || customer.legalEntityName || '',
        customerAddress: address || v.customerAddress || customer.customerAddress || customer.address || '',
        customerDistrict: district || v.customerDistrict || customer.customerDistrict || customer.district || '',
        customerState: state || v.customerState || customer.customerState || customer.state || '',
        customerCountry: country || v.customerCountry || customer.customerCountry || customer.country || 'India',
        customerPinCode: pinCode || v.customerPinCode || customer.customerPinCode || customer.pinCode || '',
        customerGSTIN: v.gstNo || customer.gstNo || customer.gstin || '',
        segment: v.segment || customer.segment || '',
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        customerId: '',
        customerName: '',
        legalEntityName: '',
        customerAddress: '',
        customerDistrict: '',
        customerState: '',
        customerCountry: 'India',
        customerPinCode: '',
        customerGSTIN: '',
        segment: '',
      }))
    }
  }

  const handlePaymentTermsChange = (e) => {
    const paymentTermsId = e.target.value
    const terms = paymentTerms.find((t) => t.id === paymentTermsId)
    
    if (terms) {
      const tValues = terms.values || terms
      const description = tValues.paymentTermsDescription || terms.paymentTermsDescription || terms.description || terms.name || ''
      setFormData((prev) => ({
        ...prev,
        paymentTermsId,
        poPaymentTerms: description,
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

  const handleSaveDraft = async () => {
    try {
      const result = await persistenceSave(true)
      // After first save (new PO), navigate to /po-entry/:id so Submit and autosave use same record
      if (result?.id && !id) {
        navigate(`/po-entry/${result.id}`, { replace: true })
      }
      showToast('Draft saved successfully!', 'success')
    } catch (error) {
      console.error('Failed to save draft:', error)
      showToast('Failed to save draft. Please try again.', 'error')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const customerId = String(formData.customerId || '').trim()
    const poNumber = String(formData.poNumber || '').trim() || poEntryService.generatePONumber(formData.businessUnit || 'MAIN')
    const poDate = String(formData.poDate || '').trim()
    
    const missing = []
    if (!customerId) missing.push('Customer Name')
    if (!poNumber) missing.push('PO Number')
    if (!poDate) missing.push('Purchase Order Date')
    if (missing.length > 0) {
      showToast(`Please fill in the required fields: ${missing.join(', ')}`, 'error')
      return
    }
    
    // Ensure form state has generated PO Number if it was empty
    if (!String(formData.poNumber || '').trim()) {
      setFormData((prev) => ({ ...prev, poNumber }))
    }
    
    // Build full payload for save (all form fields + BOQ) so backend stores in draft_data
    // Include id when editing so server updates that row and sets status to approved
    const poEntry = {
      ...formData,
      id: id || formData.id,
      customerId,
      poNumber,
      poDate,
      // "Submit" = approved (submitted). Server draft endpoint persists this to DB.
      status: 'approved',
      boqItems,
      boqTotals,
      submittedAt: new Date().toISOString(),
      paymentTermsId: formData.paymentTermsId,
    }
    
    try {
      const savedPO = await poEntryService.savePOEntry(poEntry)
      
      // Re-fetch the saved PO to ensure UI is synced with backend
      if (savedPO?.id || id) {
        try {
          const refreshedPO = await poEntryService.getPOEntryById(savedPO?.id || id)
          if (refreshedPO) {
            const { boqItems: refreshedBoqItems, ...refreshedFormData } = refreshedPO
            // Normalize backend row fields to form fields
            const normalizedForm = {
              ...refreshedFormData,
              poNumber: refreshedFormData.poNumber || refreshedFormData.po_number || poEntry.poNumber,
              poDate:
                refreshedFormData.poDate ||
                refreshedFormData.issue_date ||
                (refreshedFormData.created_at ? String(refreshedFormData.created_at).split('T')[0] : poEntry.poDate),
              customerId: refreshedFormData.customerId || refreshedFormData.customer_id || poEntry.customerId,
              customerName: refreshedFormData.customerName || refreshedFormData.customer_name || poEntry.customerName,
            }
            setPersistedData({
              formData: normalizedForm || {},
              boqItems: Array.isArray(refreshedBoqItems) ? refreshedBoqItems : [],
            })
          }
        } catch (refreshError) {
          console.warn('[POEntry] Failed to refresh PO after save:', refreshError)
          // Continue anyway - save was successful
        }
      }
      
      showToast('PO Entry submitted successfully!', 'success')
      if (typeof clearLocalDraft === 'function') clearLocalDraft()
      navigate('/po-entry')
    } catch (error) {
      console.error('Failed to save PO Entry:', error)
      showToast('Failed to save PO Entry. Please try again.', 'error')
    }
  }

  // Filter employees by role (reads from Master Data values.role)
  const getEmployeesByRole = (roleKeywords) => {
    if (!Array.isArray(employees)) {
      console.warn('employees is not an array:', employees)
      return []
    }
    return employees.filter((emp) => {
      const v = emp.values || {}
      const role = (v.role || v.role_0 || emp.role || emp.designation || '').toLowerCase()
      return roleKeywords.some((keyword) => role.includes(keyword.toLowerCase()))
    })
  }

  // Employee display label from Master Data (values.nameOfEmployee, values.designation)
  const getEmployeeLabel = (emp) => {
    const v = emp.values || {}
    const name = v.nameOfEmployee || v.nameOfEmployee_0 || emp.nameOfEmployee || emp.name || ''
    const des = v.designation || v.designation_0 || emp.designation || ''
    return name + (des ? ` (${des})` : '')
  }

  // Ensure all employee arrays are actually arrays (from Master Data employee-profile)
  const salesManagers = getEmployeesByRole(['sales manager'])
  const salesHeads = getEmployeesByRole(['sales head'])
  const projectManagers = getEmployeesByRole(['project manager'])
  const projectHeads = getEmployeesByRole(['project head'])
  const businessHeads = getEmployeesByRole(['business head'])
  const collectionIncharges = getEmployeesByRole(['collection incharge'])
  const salesAgents = getEmployeesByRole(['sales agent'])
  const collectionAgents = getEmployeesByRole(['collection agent'])

  // Edit mode: show loading until data is loaded so form does not flash empty
  if (id && persistenceLoading) {
    return (
      <div className="po-entry-page">
        <div className="po-entry-header">
          <button type="button" onClick={() => navigate('/po-entry')} className="po-entry-back-button" aria-label="Back">
            <ArrowLeft className="po-entry-back-icon" />
            <span>Back</span>
          </button>
          <div className="po-entry-header-content">
            <h1 className="po-entry-title">PO Entry</h1>
            <p className="po-entry-subtitle">Loading…</p>
          </div>
        </div>
        <div className="po-entry-loading" style={{ padding: '2rem', textAlign: 'center' }}>
          Loading PO data…
        </div>
      </div>
    )
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
            onClick={() => setFormData((prev) => ({ ...prev, boqEnabled: !prev.boqEnabled }))}
            className={`po-entry-action-button po-entry-action-button-secondary ${formData.boqEnabled !== false ? 'po-entry-boq-toggle-on' : ''}`}
            title={formData.boqEnabled !== false ? 'BOQ is enabled. Click to hide BOQ section.' : 'BOQ is disabled. Click to show BOQ section.'}
          >
            {formData.boqEnabled !== false ? (
              <ToggleRight className="po-entry-action-icon" aria-hidden />
            ) : (
              <ToggleLeft className="po-entry-action-icon" aria-hidden />
            )}
            <span>BOQ {formData.boqEnabled !== false ? 'On' : 'Off'}</span>
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
                {Array.isArray(customers) && customers.map((customer) => {
                  const v = customer.values || customer
                  const name = v.customerName || customer.customerName || customer.name || ''
                  const gst = v.gstNo || customer.gstNo || customer.gstin || ''
                  return (
                    <option key={customer.id} value={customer.id}>
                      {name}{gst ? ` (${gst})` : ''}
                    </option>
                  )
                })}
              </select>
              {customers.length === 0 && (
                <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                  No customers found. <a href="/master-data/new/customer-profile" style={{ color: 'var(--color-primary)' }}>Create one in Master Data</a>
                </p>
              )}
              {formData.customerId && (
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px', fontStyle: 'italic' }}>
                  Customer data is fetched from Master Data. Auto-filled fields are read-only.
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
                Legal Entity Name (Auto-filled)
              </label>
              <input
                type="text"
                id="legalEntityName"
                name="legalEntityName"
                value={formData.legalEntityName}
                onChange={handleChange}
                className="po-entry-input"
                readOnly
                style={{ background: 'var(--color-bg-tertiary)' }}
              />
            </div>
            
            <div className="po-entry-field po-entry-field-full">
              <label htmlFor="customerAddress" className="po-entry-label">
                Customer Address (Auto-filled)
              </label>
              <textarea
                id="customerAddress"
                name="customerAddress"
                value={formData.customerAddress}
                onChange={handleChange}
                className="po-entry-textarea"
                rows="3"
                readOnly
                style={{ background: 'var(--color-bg-tertiary)' }}
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="customerDistrict" className="po-entry-label">
                District (Auto-filled)
              </label>
              <input
                type="text"
                id="customerDistrict"
                name="customerDistrict"
                value={formData.customerDistrict}
                onChange={handleChange}
                className="po-entry-input"
                readOnly
                style={{ background: 'var(--color-bg-tertiary)' }}
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="customerState" className="po-entry-label">
                State (Auto-filled)
              </label>
              <input
                type="text"
                id="customerState"
                name="customerState"
                value={formData.customerState}
                onChange={handleChange}
                className="po-entry-input"
                readOnly
                style={{ background: 'var(--color-bg-tertiary)' }}
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="customerCountry" className="po-entry-label">
                Country (Auto-filled)
              </label>
              <input
                type="text"
                id="customerCountry"
                name="customerCountry"
                value={formData.customerCountry}
                onChange={handleChange}
                className="po-entry-input"
                readOnly
                style={{ background: 'var(--color-bg-tertiary)' }}
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="customerPinCode" className="po-entry-label">
                Pin Code (Auto-filled)
              </label>
              <input
                type="text"
                id="customerPinCode"
                name="customerPinCode"
                value={formData.customerPinCode}
                onChange={handleChange}
                className="po-entry-input"
                readOnly
                style={{ background: 'var(--color-bg-tertiary)' }}
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="customerGSTIN" className="po-entry-label">
                GST No (Auto-filled)
              </label>
              <input
                type="text"
                id="customerGSTIN"
                name="customerGSTIN"
                value={formData.customerGSTIN}
                onChange={handleChange}
                className="po-entry-input"
                readOnly
                style={{ background: 'var(--color-bg-tertiary)' }}
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
              <DatePicker
                selected={formData.contractAgreementDate}
                onChange={handleChange}
                name="contractAgreementDate"
                id="contractAgreementDate"
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
              <DatePicker
                selected={formData.poDate}
                onChange={handleChange}
                name="poDate"
                id="poDate"
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
              <DatePicker
                selected={formData.loiDate}
                onChange={handleChange}
                name="loiDate"
                id="loiDate"
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
              <DatePicker
                selected={formData.loaDate}
                onChange={handleChange}
                name="loaDate"
                id="loaDate"
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
              <DatePicker
                selected={formData.tenderDate}
                onChange={handleChange}
                name="tenderDate"
                id="tenderDate"
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
                {Array.isArray(paymentTerms) && paymentTerms.map((terms) => {
                  const tValues = terms.values || terms
                  const label = tValues.paymentTermsDescription || terms.paymentTermsDescription || terms.description || terms.name || `Payment Term (${terms.id?.slice(0, 8) || '—'})`
                  return (
                    <option key={terms.id} value={terms.id}>
                      {label}
                    </option>
                  )
                })}
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
              <select
                id="insuranceType"
                name="insuranceType"
                value={formData.insuranceType}
                onChange={handleChange}
                className="po-entry-select"
              >
                <option value="">Select Insurance Type</option>
                {INSURANCE_TYPES.filter((type) => type !== 'Others').map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
                <option value="Others">Others</option>
              </select>
              {formData.insuranceType === 'Others' && (
                <input
                  type="text"
                  id="insuranceTypeOther"
                  name="insuranceTypeOther"
                  value={formData.insuranceTypeOther}
                  onChange={handleChange}
                  className="po-entry-input"
                  placeholder="Specify insurance type"
                  style={{ marginTop: '8px' }}
                />
              )}
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
              <DatePicker
                selected={formData.insurancePolicyDate}
                onChange={handleChange}
                name="insurancePolicyDate"
                id="insurancePolicyDate"
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
              <DatePicker
                selected={formData.insurancePolicyValidUpto}
                onChange={handleChange}
                name="insurancePolicyValidUpto"
                id="insurancePolicyValidUpto"
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
              <select
                id="bankGuaranteeType"
                name="bankGuaranteeType"
                value={formData.bankGuaranteeType}
                onChange={handleChange}
                className="po-entry-select"
              >
                <option value="">Select Bank Guarantee Type</option>
                {BANK_GUARANTEE_TYPES.filter((type) => type !== 'Others').map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
                <option value="Others">Others</option>
              </select>
              {formData.bankGuaranteeType === 'Others' && (
                <input
                  type="text"
                  id="bankGuaranteeTypeOther"
                  name="bankGuaranteeTypeOther"
                  value={formData.bankGuaranteeTypeOther}
                  onChange={handleChange}
                  className="po-entry-input"
                  placeholder="Specify bank guarantee type"
                  style={{ marginTop: '8px' }}
                />
              )}
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
              <DatePicker
                selected={formData.bankGuaranteeDate}
                onChange={handleChange}
                name="bankGuaranteeDate"
                id="bankGuaranteeDate"
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
              <DatePicker
                selected={formData.bankGuaranteeValidity}
                onChange={handleChange}
                name="bankGuaranteeValidity"
                id="bankGuaranteeValidity"
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
                {Array.isArray(salesManagers) && salesManagers.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {getEmployeeLabel(emp)}
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
                {Array.isArray(salesHeads) && salesHeads.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {getEmployeeLabel(emp)}
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
                {Array.isArray(businessHeads) && businessHeads.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {getEmployeeLabel(emp)}
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
                {Array.isArray(projectManagers) && projectManagers.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {getEmployeeLabel(emp)}
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
                {Array.isArray(projectHeads) && projectHeads.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {getEmployeeLabel(emp)}
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
                {Array.isArray(collectionIncharges) && collectionIncharges.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {getEmployeeLabel(emp)}
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
                {Array.isArray(salesAgents) && salesAgents.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {getEmployeeLabel(emp)}
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
                {Array.isArray(collectionAgents) && collectionAgents.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {getEmployeeLabel(emp)}
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
              <DatePicker
                selected={formData.lastDateOfDelivery}
                onChange={handleChange}
                name="lastDateOfDelivery"
                id="lastDateOfDelivery"
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

        {/* BOQ as per PO (Form) - table and calculated summary */}
        <div className="po-entry-section">
          <h2 className="po-entry-section-title">BOQ as per PO (Form)</h2>
          <div className="po-entry-boq-container">
            <div className="po-entry-boq-table-wrapper">
              <table className="po-entry-boq-table">
                <thead>
                  <tr>
                    <th style={{ width: '30%' }}>Material Description</th>
                    <th style={{ width: '10%' }}>Qty</th>
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
                  {Array.isArray(boqItems) && boqItems.map((item, index) => (
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
              <span>Add line item</span>
            </button>
          </div>
        </div>

        {/* BOQ Summary - calculated from table */}
        <div className="po-entry-section">
          <h2 className="po-entry-section-title">Total</h2>
          <div className="po-entry-form-grid">
            <div className="po-entry-field">
              <label className="po-entry-label">Total Ex Works</label>
              <input
                type="text"
                value={boqTotals.totalExWorks}
                readOnly
                className="po-entry-input po-entry-input-readonly"
                style={{ background: 'var(--color-bg-tertiary)', fontWeight: 600 }}
              />
            </div>
            
            <div className="po-entry-field">
              <label className="po-entry-label">Total Freight Amount</label>
              <input
                type="text"
                value={boqTotals.totalFreight}
                readOnly
                className="po-entry-input po-entry-input-readonly"
                style={{ background: 'var(--color-bg-tertiary)', fontWeight: 600 }}
              />
            </div>
            
            <div className="po-entry-field">
              <label className="po-entry-label">GST</label>
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
