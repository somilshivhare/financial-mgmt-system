import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import * as masterDataService from '../services/masterDataService'

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

  const loadMasterData = useCallback(() => {
    setMasterData((prev) => ({ ...prev, loading: true }))
    try {
      const data = masterDataService.getAllMasterData()
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
      console.error('Failed to load master data:', error)
      setMasterData((prev) => ({ ...prev, loading: false }))
    }
  }, [])

  useEffect(() => {
    loadMasterData()

    // Listen for updates
    const handleUpdate = () => {
      loadMasterData()
    }

    window.addEventListener('masterDataUpdated', handleUpdate)
    return () => {
      window.removeEventListener('masterDataUpdated', handleUpdate)
    }
  }, [loadMasterData])

  const saveRecord = useCallback((type, recordData) => {
    try {
      const saved = masterDataService.saveMasterDataRecord(type, recordData)
      loadMasterData()
      return saved
    } catch (error) {
      console.error('Failed to save master data:', error)
      throw error
    }
  }, [loadMasterData])

  const deleteRecord = useCallback((type, id) => {
    try {
      const deleted = masterDataService.deleteMasterDataRecord(type, id)
      loadMasterData()
      return deleted
    } catch (error) {
      console.error('Failed to delete master data:', error)
      throw error
    }
  }, [loadMasterData])

  const getCustomers = useCallback(() => {
    return masterDataService.getCustomers()
  }, [])

  const getCompanies = useCallback(() => {
    return masterDataService.getCompanies()
  }, [])

  const getConsignees = useCallback(() => {
    return masterDataService.getConsignees()
  }, [])

  const getPayers = useCallback(() => {
    return masterDataService.getPayers()
  }, [])

  const getEmployees = useCallback(() => {
    return masterDataService.getEmployees()
  }, [])

  const getPaymentTerms = useCallback(() => {
    return masterDataService.getPaymentTerms()
  }, [])

  const getRecordById = useCallback((type, id) => {
    return masterDataService.getMasterDataById(type, id)
  }, [])

  const search = useCallback((query) => {
    return masterDataService.searchMasterData(query)
  }, [])

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
  }

  return <MasterDataContext.Provider value={value}>{children}</MasterDataContext.Provider>
}

