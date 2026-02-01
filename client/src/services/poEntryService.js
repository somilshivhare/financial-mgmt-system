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

// Get PO entry by PO Number (Key ID); returns full PO with formData/boqItems
export const getPOEntryByPONumber = async (poNumber) => {
  try {
    const response = await poApi.getPOByPONumber(poNumber)
    // API returns { success, data: po }; axios response.data is that body
    const body = response && typeof response === 'object' ? response : null
    const po = body?.data ?? body ?? null
    return po && (po.id || po.po_number) ? po : null
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

// Save PO entry (draft or submit) - always use draft endpoint so status (draft/approved) is persisted
// Server has no PUT /pos/:id; POST /pos/:id/draft updates the row and sets status from payload
export const savePOEntry = async (poData) => {
  try {
    const id = poData.id || null
    const result = await poApi.upsertPODraft(poData, id)
    const po = result && (result.data !== undefined ? result.data : result)

    if (po) {
      window.dispatchEvent(new CustomEvent('poEntryUpdated', { detail: { poEntry: po } }))
      window.dispatchEvent(new CustomEvent('poUpdated', { detail: { poEntry: po } }))
    }
    return po || result
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

// Get all PO numbers for dropdown (returns array of { id, poNumber })
export const getAllPONumbers = async () => {
  try {
    const response = await poApi.getAllPONumbers()
    // API returns { success, data: list }; handle both body and raw array
    const list = Array.isArray(response) ? response : (response?.data ?? [])
    const arr = Array.isArray(list) ? list : []
    return arr.map((p) => ({
      id: p.id,
      poNumber: String(p.po_number ?? p.poNumber ?? ''),
    })).filter((p) => p.poNumber)
  } catch (error) {
    console.error('Failed to load PO numbers:', error)
    return []
  }
}

