
import * as poApi from '../api/po'

export const generatePONumber = (businessUnit = 'MAIN', financialYear = null) => {
  if (!financialYear) {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    financialYear = month >= 4 ? `${year}-${year + 1}` : `${year - 1}-${year}`
  }

  const fyShort = financialYear.replace('-', '')
  const now = new Date()
  const timestampPart = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`
  const randomPart = Math.floor(100 + Math.random() * 900).toString()
  const sequence = `${timestampPart}${randomPart}`

  return `PO-${businessUnit}-${fyShort}-${sequence}`
}

export const getAllPOEntries = async () => {
  try {
    const raw = await poApi.getAllPOs({ page: 1, pageSize: 100 })
    if (raw === undefined || raw === null) return []

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

export const getPOEntryByPONumber = async (poNumber) => {
  try {
    const response = await poApi.getPOByPONumber(poNumber)
    const body = response && typeof response === 'object' ? response : null
    const po = body?.data ?? body ?? null
    return po && (po.id || po.po_number) ? po : null
  } catch (error) {
    console.error(`Failed to load PO ${poNumber}:`, error)
    return null
  }
}

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

export const getAllPONumbers = async () => {
  try {
    const response = await poApi.getAllPONumbers()
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

