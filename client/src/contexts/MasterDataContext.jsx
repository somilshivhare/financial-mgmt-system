import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import * as masterDataService from '../services/masterDataService'
import * as masterDataApi from '../api/masterData'

const MasterDataContext = createContext(null)

export const useMasterData = () => {
  const context = useContext(MasterDataContext)
  if (!context) {
    throw new Error('useMasterData must be used within MasterDataProvider')
  }
  return context
}

export const MasterDataProvider = ({ children }) => {
  const [masterData, setMasterData] = useState({
    companies: [],
    customers: [],
    consignees: [],
    payers: [],
    employees: [],
    paymentTerms: [],
    loading: false,
    lastUpdated: null,
  })
  
  // Aggregated master data (array of consolidated records - multiple cards)
  const [aggregatedDataList, setAggregatedDataList] = useState([])
  const [aggregatedLoading, setAggregatedLoading] = useState(false)

  const loadMasterData = useCallback(async () => {
    // Only load master data if user is authenticated
    const token = localStorage.getItem('token')
    if (!token) {
      // Not authenticated, skip loading
      return
    }

    setMasterData((prev) => ({ ...prev, loading: true }))
    try {
      const data = await masterDataService.getAllMasterData()
      setMasterData({
        companies: data.companies || [],
        customers: data.customers || [],
        consignees: data.consignees || [],
        payers: data.payers || [],
        employees: data.employees || [],
        paymentTerms: data.paymentTerms || [],
        loading: false,
        lastUpdated: data.lastUpdated,
      })
    } catch (error) {
      // Only log errors if authenticated (suppress errors on login page)
      if (token) {
        console.error('Failed to load master data:', error)
      }
      setMasterData((prev) => ({ ...prev, loading: false }))
    }
  }, [])
  
  // Load aggregated master data (array of consolidated records - multiple cards)
  const loadAggregatedMasterData = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      return
    }
    
    setAggregatedLoading(true)
    try {
      const dataList = await masterDataService.getAggregatedMasterData()
      // Ensure it's an array
      setAggregatedDataList(Array.isArray(dataList) ? dataList : (dataList ? [dataList] : []))
    } catch (error) {
      console.error('Failed to load aggregated master data:', error)
      setAggregatedDataList([])
    } finally {
      setAggregatedLoading(false)
    }
  }, [])

  useEffect(() => {
    // Check authentication before loading
    const token = localStorage.getItem('token')
    if (token) {
      loadMasterData()
      loadAggregatedMasterData() // Also load aggregated data
    }

    // Listen for updates
    const handleUpdate = () => {
      loadMasterData()
      loadAggregatedMasterData() // Refresh aggregated data too
    }

    // Listen for authentication changes
    const handleAuthChange = () => {
      const currentToken = localStorage.getItem('token')
      if (currentToken) {
        loadMasterData()
        loadAggregatedMasterData()
      } else {
        // Clear master data on logout
        setMasterData({
          companies: [],
          customers: [],
          consignees: [],
          payers: [],
          employees: [],
          paymentTerms: [],
          loading: false,
          lastUpdated: null,
        })
        setAggregatedDataList([])
      }
    }

    window.addEventListener('masterDataUpdated', handleUpdate)
    window.addEventListener('storage', handleAuthChange)
    
    return () => {
      window.removeEventListener('masterDataUpdated', handleUpdate)
      window.removeEventListener('storage', handleAuthChange)
    }
  }, [loadMasterData, loadAggregatedMasterData])

  const saveRecord = useCallback(async (type, recordData) => {
    try {
      const saved = await masterDataService.saveMasterDataRecord(type, recordData)
      loadMasterData()
      return saved
    } catch (error) {
      console.error('Failed to save master data:', error)
      throw error
    }
  }, [loadMasterData])

  const deleteRecord = useCallback(async (type, id) => {
    try {
      const deleted = await masterDataService.deleteMasterDataRecord(type, id)
      loadMasterData()
      return deleted
    } catch (error) {
      console.error('Failed to delete master data:', error)
      throw error
    }
  }, [loadMasterData])

  // IMPORTANT: These getters must be synchronous because many pages call them during render/effects
  // and expect arrays immediately (not Promises). The source of truth is the provider state.
  const getCustomers = useCallback(() => masterData.customers || [], [masterData.customers])
  const getCompanies = useCallback(() => masterData.companies || [], [masterData.companies])
  const getConsignees = useCallback(() => masterData.consignees || [], [masterData.consignees])
  const getPayers = useCallback(() => masterData.payers || [], [masterData.payers])
  const getEmployees = useCallback(() => masterData.employees || [], [masterData.employees])
  const getPaymentTerms = useCallback(() => masterData.paymentTerms || [], [masterData.paymentTerms])

  const getRecordById = useCallback((type, id) => {
    const typeMap = {
      'company-profile': 'companies',
      'customer-profile': 'customers',
      'consignee-profile': 'consignees',
      'payer-profile': 'payers',
      'employee-profile': 'employees',
      'payment-terms': 'paymentTerms',
    }
    const storageKey = typeMap[type] || type
    const records = masterData[storageKey] || []
    return records.find((r) => r.id === id) || null
  }, [masterData])

  const search = useCallback((query) => {
    const q = String(query || '').toLowerCase().trim()
    if (!q) return []
    const results = []
    Object.keys(masterData).forEach((key) => {
      const arr = masterData[key]
      if (!Array.isArray(arr)) return
      arr.forEach((record) => {
        const searchableText = JSON.stringify(record.values || record).toLowerCase()
        if (searchableText.includes(q)) {
          results.push({ type: key, record })
        }
      })
    })
    return results
  }, [masterData])

  const value = {
    masterData,
    loadMasterData,
    saveRecord,
    deleteRecord,
    getCustomers,
    getCompanies,
    getConsignees,
    getPayers,
    getEmployees,
    getPaymentTerms,
    getRecordById,
    search,
    // Aggregated master data (array of cards)
    aggregatedDataList,
    aggregatedLoading,
    loadAggregatedMasterData,
  }

  return <MasterDataContext.Provider value={value}>{children}</MasterDataContext.Provider>
}

