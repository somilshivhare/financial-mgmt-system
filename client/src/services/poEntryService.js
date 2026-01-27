/**
 * PO Entry Service
 * Manages PO Entry data and provides access to PO records
 */

import * as poApi from '../api/po'

// Generate unique PO Number based on business rules
export const generatePONumber = (businessUnit = 'MAIN', financialYear = null) => {
  // Get current financial year if not provided (assuming April-March cycle)
  if (!financialYear) {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    financialYear = month >= 4 ? `${year}-${year + 1}` : `${year - 1}-${year}`
  }

  // Format: PO-{BU}-{FY}-{SEQUENCE}
  // Example: PO-MAIN-20242025-0001
  const fyShort = financialYear.replace('-', '')

  return `PO-${businessUnit}-${fyShort}-XXXX` // Backend will handle sequence
}

// Get all PO entries
export const getAllPOEntries = async () => {
  try {
    const response = await poApi.getAllPOs()
    // Handle different response structures
    if (Array.isArray(response)) {
      return response
    }
    if (response && Array.isArray(response.data)) {
      return response.data
    }
    if (response && response.success && Array.isArray(response.data)) {
      return response.data
    }
    return []
  } catch (error) {
    console.error('Failed to load PO entries:', error)
    return []
  }
}

// Get PO entry by PO Number (Key ID)
export const getPOEntryByPONumber = async (poNumber) => {
  try {
    const response = await poApi.getPOByPONumber(poNumber)
    return response.data || null
  } catch (error) {
    console.error(`Failed to load PO ${poNumber}:`, error)
    return null
  }
}

// Get PO entry by ID
export const getPOEntryById = async (id) => {
  try {
    const response = await poApi.getPOById(id)
    return response.data || null
  } catch (error) {
    console.error(`Failed to load PO ${id}:`, error)
    return null
  }
}

// Save PO entry
export const savePOEntry = async (poData) => {
  try {
    let response
    if (poData.id) {
      response = await poApi.updatePO(poData.id, poData)
    } else {
      response = await poApi.createPO(poData)
    }

    // Trigger update event
    window.dispatchEvent(new CustomEvent('poEntryUpdated', { detail: { poEntry: response.data } }))

    return response.data
  } catch (error) {
    console.error('Failed to save PO entry:', error)
    throw error
  }
}

// Get all PO numbers for dropdown
export const getAllPONumbers = async () => {
  try {
    const response = await poApi.getAllPONumbers()
    return response.data || []
  } catch (error) {
    console.error('Failed to load PO numbers:', error)
    return []
  }
}

