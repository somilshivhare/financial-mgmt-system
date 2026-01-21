/**
 * Centralized Master Data Service
 * Single source of truth for all Master Data across the application
 */

import * as masterDataApi from '../api/masterData'

// Get all master data
export const getAllMasterData = async () => {
  try {
    // For now, we'll fetch each type separately since the API doesn't have a single endpoint
    // In a real app, you'd want a single endpoint that returns all master data
    const companies = await masterDataApi.getMasterDataByType('company-profile')
    const customers = await masterDataApi.getMasterDataByType('customer-profile')
    const consignees = await masterDataApi.getMasterDataByType('consignee-profile')
    const payers = await masterDataApi.getMasterDataByType('payer-profile')
    const employees = await masterDataApi.getMasterDataByType('employee-profile')
    const paymentTerms = await masterDataApi.getMasterDataByType('payment-terms')

    return {
      companies: companies || [],
      customers: customers || [],
      consignees: consignees || [],
      payers: payers || [],
      employees: employees || [],
      paymentTerms: paymentTerms || [],
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
export const getMasterDataByType = async (type) => {
  try {
    const response = await masterDataApi.getMasterDataByType(type)
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
export const getCustomers = async () => {
  try {
    const records = await getMasterDataByType('customer-profile')
    return records.map((record) => ({
      id: record.id,
      name: record.values?.customerName || record.values?.name || 'Unnamed Customer',
      gstin: record.values?.gstin || record.values?.customerGSTIN || '',
      address: record.values?.corporateOfficeAddress || record.values?.address || '',
      city: record.values?.city || '',
      state: record.values?.state || '',
      pinCode: record.values?.pinCode || record.values?.customerPinCode || '',
      contactPerson: record.values?.contactPersonName || record.values?.customerContactPerson || '',
      contactNumber: record.values?.contactNumber || record.values?.customerContactNumber || '',
      email: record.values?.emailId || record.values?.customerEmail || '',
      consigneeId: record.values?.consigneeId || null,
      payerId: record.values?.payerId || null,
      fullRecord: record,
    }))
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

