/**
 * Centralized Master Data Service
 * Single source of truth for all Master Data across the application
 */

const STORAGE_KEY = 'nbaurum_master_data'
const STORAGE_VERSION = '1.0'

// Initialize storage structure
const initializeStorage = () => {
  const existing = localStorage.getItem(STORAGE_KEY)
  if (!existing) {
    const initialData = {
      version: STORAGE_VERSION,
      companies: [],
      customers: [],
      consignees: [],
      payers: [],
      employees: [],
      paymentTerms: [],
      lastUpdated: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData))
    return initialData
  }
  try {
    return JSON.parse(existing)
  } catch (error) {
    console.error('Failed to parse master data:', error)
    return {
      version: STORAGE_VERSION,
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

// Get all master data
export const getAllMasterData = () => {
  return initializeStorage()
}

// Get records by type
export const getMasterDataByType = (type) => {
  const data = getAllMasterData()
  const typeMap = {
    'company-profile': 'companies',
    'customer-profile': 'customers',
    'consignee-profile': 'consignees',
    'payer-profile': 'payers',
    'employee-profile': 'employees',
    'payment-terms': 'paymentTerms',
  }
  const storageKey = typeMap[type] || type
  return data[storageKey] || []
}

// Get a single record by ID
export const getMasterDataById = (type, id) => {
  const records = getMasterDataByType(type)
  return records.find((r) => r.id === id)
}

// Save a master data record
export const saveMasterDataRecord = (type, recordData) => {
  const data = getAllMasterData()
  const typeMap = {
    'company-profile': 'companies',
    'customer-profile': 'customers',
    'consignee-profile': 'consignees',
    'payer-profile': 'payers',
    'employee-profile': 'employees',
    'payment-terms': 'paymentTerms',
  }
  
  const storageKey = typeMap[type] || type
  
  if (!data[storageKey]) {
    data[storageKey] = []
  }
  
  // Generate ID if not present
  if (!recordData.id) {
    recordData.id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  // Set timestamps
  const existingIndex = data[storageKey].findIndex((r) => r.id === recordData.id)
  if (existingIndex >= 0) {
    // Update existing
    recordData.updatedAt = new Date().toISOString()
    recordData.createdAt = data[storageKey][existingIndex].createdAt || new Date().toISOString()
    data[storageKey][existingIndex] = recordData
  } else {
    // Create new
    recordData.createdAt = new Date().toISOString()
    recordData.updatedAt = new Date().toISOString()
    data[storageKey].push(recordData)
  }
  
  data.lastUpdated = new Date().toISOString()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  
  // Trigger custom event for real-time updates
  window.dispatchEvent(new CustomEvent('masterDataUpdated', { detail: { type, record: recordData } }))
  
  return recordData
}

// Delete a master data record
export const deleteMasterDataRecord = (type, id) => {
  const data = getAllMasterData()
  const typeMap = {
    'company-profile': 'companies',
    'customer-profile': 'customers',
    'consignee-profile': 'consignees',
    'payer-profile': 'payers',
    'employee-profile': 'employees',
    'payment-terms': 'paymentTerms',
  }
  
  const storageKey = typeMap[type] || type
  
  if (!data[storageKey]) {
    return false
  }
  
  const index = data[storageKey].findIndex((r) => r.id === id)
  if (index >= 0) {
    data[storageKey].splice(index, 1)
    data.lastUpdated = new Date().toISOString()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    
    // Trigger custom event
    window.dispatchEvent(new CustomEvent('masterDataUpdated', { detail: { type, id, deleted: true } }))
    
    return true
  }
  
  return false
}

// Get customers (for dropdowns)
export const getCustomers = () => {
  return getMasterDataByType('customer-profile').map((record) => ({
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
}

// Get companies
export const getCompanies = () => {
  return getMasterDataByType('company-profile').map((record) => ({
    id: record.id,
    name: record.values?.companyName || 'Unnamed Company',
    gstin: record.values?.gstin || '',
    address: record.values?.corporateOfficeAddress || '',
    fullRecord: record,
  }))
}

// Get consignees
export const getConsignees = () => {
  return getMasterDataByType('consignee-profile').map((record) => ({
    id: record.id,
    name: record.values?.consigneeName || 'Unnamed Consignee',
    address: record.values?.address || '',
    fullRecord: record,
  }))
}

// Get payers
export const getPayers = () => {
  return getMasterDataByType('payer-profile').map((record) => ({
    id: record.id,
    name: record.values?.payerName || 'Unnamed Payer',
    gstin: record.values?.gstin || '',
    address: record.values?.address || '',
    fullRecord: record,
  }))
}

// Get employees
export const getEmployees = () => {
  return getMasterDataByType('employee-profile').map((record) => ({
    id: record.id,
    name: record.values?.nameOfEmployee || 'Unnamed Employee',
    designation: record.values?.designation || '',
    department: record.values?.department || '',
    contactNumber: record.values?.contactNo || '',
    email: record.values?.emailId || '',
    fullRecord: record,
  }))
}

// Get payment terms
export const getPaymentTerms = () => {
  return getMasterDataByType('payment-terms').map((record) => ({
    id: record.id,
    name: record.values?.termName || record.values?.paymentTermsDescription || 'Unnamed Terms',
    description: record.values?.paymentTermsDescription || '',
    basic: record.values?.basic || '',
    freight: record.values?.freight || '',
    taxes: record.values?.taxes || '',
    fullRecord: record,
  }))
}

// Search master data across all types
export const searchMasterData = (query) => {
  const data = getAllMasterData()
  const results = []
  const lowerQuery = query.toLowerCase()
  
  Object.keys(data).forEach((key) => {
    if (Array.isArray(data[key])) {
      data[key].forEach((record) => {
        const searchableText = JSON.stringify(record.values || {}).toLowerCase()
        if (searchableText.includes(lowerQuery)) {
          results.push({
            type: key,
            record,
          })
        }
      })
    }
  })
  
  return results
}

// Migrate old localStorage format to new format
export const migrateOldData = () => {
  try {
    const oldRecords = localStorage.getItem('masterDataRecords')
    if (oldRecords) {
      const parsed = JSON.parse(oldRecords)
      if (Array.isArray(parsed) && parsed.length > 0) {
        const data = initializeStorage()
        
        parsed.forEach((oldRecord) => {
          if (oldRecord.forms) {
            // Combined record - extract individual forms
            Object.keys(oldRecord.forms).forEach((type) => {
              const formData = oldRecord.forms[type]
              if (formData && formData.values) {
                saveMasterDataRecord(type, {
                  values: formData.values,
                  logoPreviews: formData.logoPreviews || {},
                  createdAt: oldRecord.submittedAt || new Date().toISOString(),
                })
              }
            })
          } else if (oldRecord.type && oldRecord.values) {
            // Single record
            saveMasterDataRecord(oldRecord.type, {
              values: oldRecord.values,
              logoPreviews: oldRecord.logoPreviews || {},
              createdAt: oldRecord.submittedAt || oldRecord.createdAt || new Date().toISOString(),
            })
          }
        })
        
        // Clear old storage
        localStorage.removeItem('masterDataRecords')
        console.log('Migrated old master data format')
      }
    }
  } catch (error) {
    console.error('Migration error:', error)
  }
}

// Initialize migration on load
if (typeof window !== 'undefined') {
  migrateOldData()
}

