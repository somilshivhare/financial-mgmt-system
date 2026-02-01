/**
 * Centralized Master Data Service
 * Single source of truth for all Master Data across the application
 */

import * as masterDataApi from '../api/masterData'

// Get all master data
export const getAllMasterData = async () => {
  try {
    // Fetch all types in parallel for better performance
    // This makes 6 requests simultaneously instead of sequentially
    const [companies, customers, consignees, payers, employees, paymentTerms] = await Promise.allSettled([
      masterDataApi.getMasterDataByType('company-profile', { status: 'published' }),
      masterDataApi.getMasterDataByType('customer-profile', { status: 'published' }),
      masterDataApi.getMasterDataByType('consignee-profile', { status: 'published' }),
      masterDataApi.getMasterDataByType('payer-profile', { status: 'published' }),
      masterDataApi.getMasterDataByType('employee-profile', { status: 'published' }),
      masterDataApi.getMasterDataByType('payment-terms', { status: 'published' }),
    ])

    // Extract values from Promise.allSettled results, handling failures gracefully
    // Transform records to include title and submittedAt for the listing page
    const transformRecords = (records) => {
      if (!Array.isArray(records)) return []
      return records.map(record => {
        const values = record.values || {}
        const logoPreviews = values.logoPreviews || {}
        
        // Extract logoPreviews from values if nested
        const cleanValues = { ...values }
        if (cleanValues.logoPreviews) {
          delete cleanValues.logoPreviews
        }
        
        // Determine title based on type
        let title = 'Master Data'
        if (record.type === 'company-profile') title = 'Company Profile'
        else if (record.type === 'customer-profile') title = 'Customer Profile'
        else if (record.type === 'consignee-profile') title = 'Consignee Profile'
        else if (record.type === 'payer-profile') title = 'Payer Profile'
        else if (record.type === 'employee-profile') title = 'Employee Profile'
        else if (record.type === 'payment-terms') title = 'Payment Terms'
        
        return {
          ...record,
          title,
          values: cleanValues,
          logoPreviews,
          submittedAt: record.created_at || record.updated_at || new Date().toISOString(),
        }
      })
    }

    return {
      companies: companies.status === 'fulfilled' ? transformRecords(companies.value || []) : [],
      customers: customers.status === 'fulfilled' ? transformRecords(customers.value || []) : [],
      consignees: consignees.status === 'fulfilled' ? transformRecords(consignees.value || []) : [],
      payers: payers.status === 'fulfilled' ? transformRecords(payers.value || []) : [],
      employees: employees.status === 'fulfilled' ? transformRecords(employees.value || []) : [],
      paymentTerms: paymentTerms.status === 'fulfilled' ? transformRecords(paymentTerms.value || []) : [],
      lastUpdated: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Failed to fetch master data:', error)
    return {
      companies: [],
      customers: [],
      consignees: [],
      payers: [],
      employees: [],
      paymentTerms: [],
      lastUpdated: new Date().toISOString(),
    }
  }
}

// Get records by type
export const getMasterDataByType = async (type, options = {}) => {
  try {
    const response = await masterDataApi.getMasterDataByType(type, { status: 'published', ...options })
    return response || []
  } catch (error) {
    console.error(`Failed to fetch ${type}:`, error)
    return []
  }
}

// Get a single record by ID
export const getMasterDataById = async (type, id) => {
  try {
    const response = await masterDataApi.getMasterDataById(type, id)
    return response || null
  } catch (error) {
    console.error(`Failed to fetch ${type} with id ${id}:`, error)
    return null
  }
}

// Save a master data record
export const saveMasterDataRecord = async (type, recordData) => {
  try {
    const response = await masterDataApi.saveMasterDataRecord(type, recordData)

    // Trigger custom event for real-time updates
    window.dispatchEvent(new CustomEvent('masterDataUpdated', { detail: { type, record: response } }))

    return response
  } catch (error) {
    console.error(`Failed to save ${type}:`, error)
    throw error
  }
}

// Delete a master data record
export const deleteMasterDataRecord = async (type, id) => {
  try {
    const response = await masterDataApi.deleteMasterDataRecord(type, id)

    // Trigger custom event
    window.dispatchEvent(new CustomEvent('masterDataUpdated', { detail: { type, id, deleted: true } }))

    return response
  } catch (error) {
    console.error(`Failed to delete ${type} with id ${id}:`, error)
    throw error
  }
}

// Get customers (for dropdowns)
// Returns all customer records from Master Data with complete field mapping
export const getCustomers = async () => {
  try {
    const records = await getMasterDataByType('customer-profile')
    return records.map((record) => {
      const values = record.values || {}
      return {
        id: record.id,
        name: values.customerName || values.name || 'Unnamed Customer',
        customerName: values.customerName || values.name || 'Unnamed Customer',
        legalEntityName: values.legalEntityName || '',
        gstin: values.gstNo || values.gstin || values.customerGSTIN || '',
        gstNo: values.gstNo || values.gstin || values.customerGSTIN || '',
        address: values.correspondenceAddress || values.corporateOfficeAddress || values.address || '',
        customerAddress: values.correspondenceAddress || values.corporateOfficeAddress || values.address || '',
        district: values.district || '',
        customerDistrict: values.district || '',
        state: values.state || '',
        customerState: values.state || '',
        country: values.country || 'India',
        customerCountry: values.country || 'India',
        pinCode: values.pinCode || values.customerPinCode || '',
        customerPinCode: values.pinCode || values.customerPinCode || '',
        city: values.city || '',
        segment: values.segment || '',
        contactPerson: values.poIssuingAuthority || values.contactPersonName || values.customerContactPerson || '',
        contactNumber: values.contactPersonContactNo || values.contactNumber || values.customerContactNumber || '',
        email: values.emailId || values.customerEmail || '',
        consigneeId: values.consigneeId || null,
        payerId: values.payerId || null,
        fullRecord: record,
      }
    })
  } catch (error) {
    console.error('Failed to fetch customers:', error)
    return []
  }
}

// Get companies
export const getCompanies = async () => {
  try {
    const records = await getMasterDataByType('company-profile')
    return records.map((record) => ({
      id: record.id,
      name: record.values?.companyName || 'Unnamed Company',
      gstin: record.values?.gstin || '',
      address: record.values?.corporateOfficeAddress || '',
      fullRecord: record,
    }))
  } catch (error) {
    console.error('Failed to fetch companies:', error)
    return []
  }
}

// Get consignees
export const getConsignees = async () => {
  try {
    const records = await getMasterDataByType('consignee-profile')
    return records.map((record) => ({
      id: record.id,
      name: record.values?.consigneeName || 'Unnamed Consignee',
      address: record.values?.address || '',
      fullRecord: record,
    }))
  } catch (error) {
    console.error('Failed to fetch consignees:', error)
    return []
  }
}

// Get payers
export const getPayers = async () => {
  try {
    const records = await getMasterDataByType('payer-profile')
    return records.map((record) => ({
      id: record.id,
      name: record.values?.payerName || 'Unnamed Payer',
      gstin: record.values?.gstin || '',
      address: record.values?.address || '',
      fullRecord: record,
    }))
  } catch (error) {
    console.error('Failed to fetch payers:', error)
    return []
  }
}

// Get employees
export const getEmployees = async () => {
  try {
    const records = await getMasterDataByType('employee-profile')
    return records.map((record) => ({
      id: record.id,
      name: record.values?.nameOfEmployee || 'Unnamed Employee',
      designation: record.values?.designation || '',
      department: record.values?.department || '',
      contactNumber: record.values?.contactNo || '',
      email: record.values?.emailId || '',
      fullRecord: record,
    }))
  } catch (error) {
    console.error('Failed to fetch employees:', error)
    return []
  }
}

// Get payment terms
export const getPaymentTerms = async () => {
  try {
    const records = await getMasterDataByType('payment-terms')
    return records.map((record) => ({
      id: record.id,
      name: record.values?.termName || record.values?.paymentTermsDescription || 'Unnamed Terms',
      description: record.values?.paymentTermsDescription || '',
      basic: record.values?.basic || '',
      freight: record.values?.freight || '',
      taxes: record.values?.taxes || '',
      fullRecord: record,
    }))
  } catch (error) {
    console.error('Failed to fetch payment terms:', error)
    return []
  }
}

// Search master data across all types
export const searchMasterData = async (query) => {
  try {
    const response = await masterDataApi.searchMasterData(query)
    return response || []
  } catch (error) {
    console.error('Failed to search master data:', error)
    return []
  }
}

// Get aggregated master data (all steps combined) - returns array of master data sets
export const getAggregatedMasterData = async () => {
  try {
    const response = await masterDataApi.getAggregatedMasterData()
    // Extract data from API response - should be an array
    const data = response?.data
    return Array.isArray(data) ? data : (data ? [data] : [])
  } catch (error) {
    console.error('Failed to fetch aggregated master data:', error)
    return []
  }
}

export const getDraftMasterData = async (options = {}) => {
  try {
    const response = await masterDataApi.getDraftMasterData(options)
    return response?.data || null
  } catch (error) {
    console.error('Failed to fetch draft master data:', error)
    return null
  }
}

export const createDraftFromPublished = async (companyId) => {
  try {
    const response = await masterDataApi.createDraftFromPublished(companyId)
    return response?.data || null
  } catch (error) {
    console.error('Failed to create draft from published:', error)
    throw error
  }
}

export const publishDraftMasterData = async (draftCompanyId) => {
  try {
    const response = await masterDataApi.publishDraftMasterData(draftCompanyId)
    return response?.data || null
  } catch (error) {
    console.error('Failed to publish draft:', error)
    throw error
  }
}

