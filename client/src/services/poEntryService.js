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

// Get all PO entries - backend returns { success, data: { data: [...], page, pageSize, total } }
export const getAllPOEntries = async () => {
  try {
    const raw = await poApi.getAllPOs({ page: 1, pageSize: 100 })
    if (raw === undefined || raw === null) return []

    // Support multiple response shapes so list always displays
    let list = []
    if (Array.isArray(raw?.data?.data)) {
      list = raw.data.data
    } else if (Array.isArray(raw?.data)) {
      list = raw.data
    } else if (Array.isArray(raw)) {
      list = raw
    }

    if (import.meta.env.DEV && list.length === 0 && raw?.data) {
      const dataObj = raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data) ? raw.data : null
      console.info('[PO List] API returned 0 entries. Response shape:', {
        hasData: !!raw.data,
        dataKeys: dataObj ? Object.keys(dataObj) : [],
        total: dataObj?.total,
      })
    }
    return Array.isArray(list) ? [...list] : []
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

// Get PO entry by ID (returns PO row; API wraps in { data: po })
export const getPOEntryById = async (id) => {
  try {
    const response = await poApi.getPOById(id)
    const body = response?.data ?? response
    return body?.data ?? body ?? null
  } catch (error) {
    console.error(`Failed to load PO ${id}:`, error)
    return null
  }
}

// Save PO entry (submit) - uses draft endpoint so all form fields + BOQ are saved to database (draft_data)
export const savePOEntry = async (poData) => {
  try {
    let result
    if (poData.id) {
      const response = await poApi.updatePO(poData.id, poData)
      result = response.data
    } else {
      // New PO: use upsertPODraft so full form + boqItems are saved in draft_data and lines in purchase_order_lines
      result = await poApi.upsertPODraft(poData)
    }

    if (result) {
      window.dispatchEvent(new CustomEvent('poEntryUpdated', { detail: { poEntry: result } }))
    }
    return result
  } catch (error) {
    console.error('Failed to save PO entry:', error)
    throw error
  }
}

// Delete PO entry by id
export const deletePOEntry = async (id) => {
  try {
    const result = await poApi.deletePO(id)
    window.dispatchEvent(new CustomEvent('poDeleted', { detail: { id } }))
    return result
  } catch (error) {
    console.error(`Failed to delete PO ${id}:`, error)
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

