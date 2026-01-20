/**
 * PO Entry Service
 * Manages PO Entry data and provides access to PO records
 */

const STORAGE_KEY = 'nbaurum_po_entries'
const PO_NUMBER_COUNTER_KEY = 'nbaurum_po_number_counter'

// Generate unique PO Number based on business rules
export const generatePONumber = (businessUnit = 'MAIN', financialYear = null) => {
  // Get current financial year if not provided (assuming April-March cycle)
  if (!financialYear) {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    financialYear = month >= 4 ? `${year}-${year + 1}` : `${year - 1}-${year}`
  }
  
  // Get or initialize counter
  let counter = parseInt(localStorage.getItem(PO_NUMBER_COUNTER_KEY) || '0', 10)
  counter += 1
  localStorage.setItem(PO_NUMBER_COUNTER_KEY, String(counter))
  
  // Format: PO-{BU}-{FY}-{SEQUENCE}
  // Example: PO-MAIN-20242025-0001
  const sequence = String(counter).padStart(4, '0')
  const fyShort = financialYear.replace('-', '')
  
  return `PO-${businessUnit}-${fyShort}-${sequence}`
}

// Get all PO entries
export const getAllPOEntries = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Failed to load PO entries:', error)
    return []
  }
}

// Get PO entry by PO Number (Key ID)
export const getPOEntryByPONumber = (poNumber) => {
  const entries = getAllPOEntries()
  return entries.find((po) => po.poNumber === poNumber)
}

// Get PO entry by ID
export const getPOEntryById = (id) => {
  const entries = getAllPOEntries()
  return entries.find((po) => po.id === id)
}

// Save PO entry
export const savePOEntry = (poData) => {
  try {
    const entries = getAllPOEntries()
    
    if (!poData.id) {
      poData.id = `po_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      poData.createdAt = new Date().toISOString()
    }
    
    // Generate PO Number if not present
    if (!poData.poNumber) {
      poData.poNumber = generatePONumber(poData.businessUnit || 'MAIN')
    }
    
    // Ensure PO Number is immutable once created
    const existing = entries.find((po) => po.id === poData.id)
    if (existing && existing.poNumber) {
      poData.poNumber = existing.poNumber // Preserve existing PO Number
    }
    
    poData.updatedAt = new Date().toISOString()
    
    const index = entries.findIndex((po) => po.id === poData.id)
    if (index >= 0) {
      entries[index] = poData
    } else {
      entries.push(poData)
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
    
    // Trigger update event
    window.dispatchEvent(new CustomEvent('poEntryUpdated', { detail: { poEntry: poData } }))
    
    return poData
  } catch (error) {
    console.error('Failed to save PO entry:', error)
    throw error
  }
}

// Get all PO numbers for dropdown
export const getAllPONumbers = () => {
  const entries = getAllPOEntries()
  return entries.map((po) => ({
    poNumber: po.poNumber,
    id: po.id,
    customerName: po.customerName,
    poDate: po.poDate,
    poValue: po.poValue,
  }))
}

