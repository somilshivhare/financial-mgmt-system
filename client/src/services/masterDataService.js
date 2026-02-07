
import * as masterDataApi from '../api/masterData'

export const getAllMasterData = async () => {
  try {
    const [companies, customers, consignees, payers, employees, paymentTerms] = await Promise.allSettled([
      masterDataApi.getMasterDataByType('company-profile', { status: 'published' }),
      masterDataApi.getMasterDataByType('customer-profile', { status: 'published' }),
      masterDataApi.getMasterDataByType('consignee-profile', { status: 'published' }),
      masterDataApi.getMasterDataByType('payer-profile', { status: 'published' }),
      masterDataApi.getMasterDataByType('employee-profile', { status: 'published' }),
      masterDataApi.getMasterDataByType('payment-terms', { status: 'published' }),
    ])

    const transformRecords = (records) => {
      if (!Array.isArray(records)) return []
      return records.map(record => {
        const values = record.values || {}
        const logoPreviews = values.logoPreviews || {}
        
        const cleanValues = { ...values }
        if (cleanValues.logoPreviews) {
          delete cleanValues.logoPreviews
        }
        
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

export const getMasterDataByType = async (type, options = {}) => {
  try {
    const response = await masterDataApi.getMasterDataByType(type, { status: 'published', ...options })
    return response || []
  } catch (error) {
    console.error(`Failed to fetch ${type}:`, error)
    return []
  }
}

export const getMasterDataById = async (type, id) => {
  try {
    const response = await masterDataApi.getMasterDataById(type, id)
    return response || null
  } catch (error) {
    console.error(`Failed to fetch ${type} with id ${id}:`, error)
    return null
  }
}

export const saveMasterDataRecord = async (type, recordData) => {
  try {
    const response = await masterDataApi.saveMasterDataRecord(type, recordData)

    window.dispatchEvent(new CustomEvent('masterDataUpdated', { detail: { type, record: response } }))

    return response
  } catch (error) {
    console.error(`Failed to save ${type}:`, error)
    throw error
  }
}

export const deleteMasterDataRecord = async (type, id) => {
  try {
    const response = await masterDataApi.deleteMasterDataRecord(type, id)

    window.dispatchEvent(new CustomEvent('masterDataUpdated', { detail: { type, id, deleted: true } }))

    return response
  } catch (error) {
    console.error(`Failed to delete ${type} with id ${id}:`, error)
    throw error
  }
}

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

export const searchMasterData = async (query) => {
  try {
    const response = await masterDataApi.searchMasterData(query)
    return response || []
  } catch (error) {
    console.error('Failed to search master data:', error)
    return []
  }
}

export const getAggregatedMasterData = async () => {
  try {
    const response = await masterDataApi.getAggregatedMasterData()
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

