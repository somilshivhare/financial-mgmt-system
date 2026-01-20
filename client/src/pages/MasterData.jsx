import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  RefreshCw,
  Plus,
  Search,
  ChevronDown,
  FileText,
  Edit,
  Trash2,
  Calendar,
} from 'lucide-react'
import { useMasterData } from '../contexts/MasterDataContext'
import '../styles/MasterData.css'

function MasterData() {
  const navigate = useNavigate()
  const { masterData, loadMasterData, deleteRecord } = useMasterData()
  const [query, setQuery] = useState('')
  const [tier, setTier] = useState('all')
  const [records, setRecords] = useState([])

  useEffect(() => {
    loadMasterData()
  }, [loadMasterData])

  useEffect(() => {
    // Combine all master data types into a single records array
    const allRecords = []
    Object.keys(masterData).forEach((key) => {
      if (Array.isArray(masterData[key]) && key !== 'loading' && key !== 'lastUpdated') {
        masterData[key].forEach((record) => {
          allRecords.push({
            ...record,
            _type: key,
          })
        })
      }
    })
    setRecords(allRecords)
  }, [masterData])

  const handleRefresh = () => {
    loadMasterData()
  }

  const handleDelete = (record) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        const typeMap = {
          companies: 'company-profile',
          customers: 'customer-profile',
          consignees: 'consignee-profile',
          payers: 'payer-profile',
          employees: 'employee-profile',
          paymentTerms: 'payment-terms',
        }
        const type = typeMap[record._type] || record._type
        deleteRecord(type, record.id)
      } catch (error) {
        console.error('Failed to delete record:', error)
      }
    }
  }

  const filteredRecords = useMemo(() => {
    if (!query.trim()) return records
    const lowerQuery = query.toLowerCase()
    return records.filter((record) => {
      const values = record.values || {}
      const searchableText = Object.values(values).join(' ').toLowerCase()
      return searchableText.includes(lowerQuery) || record.title?.toLowerCase().includes(lowerQuery)
    })
  }, [records, query])

  const subtitle = useMemo(() => {
    return 'Browse and manage all recorded master data.'
  }, [])

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    } catch {
      return dateString
    }
  }

  const getDisplayValue = (record, key) => {
    const values = record.values || {}
    const logoPreviews = record.logoPreviews || {}
    
    // Check for logo/photo preview
    if (logoPreviews[key]) {
      return logoPreviews[key]
    }
    
    // Check for "Other" custom value
    if (values[`${key}Other`]) {
      return values[`${key}Other`]
    }
    
    return values[key] || 'N/A'
  }

  const getPrimaryField = (record) => {
    const values = record.values || {}
    const type = record._type || record.type
    
    // Map storage type to form type for field lookup
    const typeMap = {
      companies: 'company-profile',
      customers: 'customer-profile',
      consignees: 'consignee-profile',
      payers: 'payer-profile',
      employees: 'employee-profile',
      paymentTerms: 'payment-terms',
    }
    
    const formType = typeMap[type] || type
    
    if (formType === 'company-profile') return values.companyName || 'Company Profile'
    if (formType === 'customer-profile') return values.customerName || 'Customer Profile'
    if (formType === 'consignee-profile') return values.consigneeName || 'Consignee Profile'
    if (formType === 'payer-profile') return values.payerName || 'Payer Profile'
    if (formType === 'employee-profile') return values.nameOfEmployee || 'Employee Profile'
    if (formType === 'payment-terms') return values.termName || values.paymentTermsDescription || 'Payment Terms'
    
    return record.title || 'Master Data'
  }

  const getCardDetails = (record) => {
    const values = record.values || {}
    const type = record._type || record.type
    
    const typeMap = {
      companies: 'company-profile',
      customers: 'customer-profile',
      consignees: 'consignee-profile',
      payers: 'payer-profile',
      employees: 'employee-profile',
      paymentTerms: 'payment-terms',
    }
    
    const formType = typeMap[type] || type
    
    // Handle different record types
    if (formType === 'company-profile') {
      return {
        name: values.companyName || 'Company Profile',
        email: values.emailId || 'N/A',
        phone: values.contactNumber || 'N/A',
        logo: record.logoPreviews?.logo,
      }
    }
    
    if (formType === 'customer-profile') {
      return {
        name: values.customerName || 'Customer Profile',
        email: values.emailId || 'N/A',
        phone: values.contactNumber || values.contactPersonContactNo || 'N/A',
        logo: record.logoPreviews?.logo,
      }
    }
    
    if (formType === 'employee-profile') {
      return {
        name: values.nameOfEmployee || 'Employee Profile',
        email: values.emailId || 'N/A',
        phone: values.contactNo || 'N/A',
        logo: record.logoPreviews?.photo,
      }
    }
    
    // Default fallback
    return {
      name: getPrimaryField(record),
      email: values.emailId || values.contactPersonContactNo || 'N/A',
      phone: values.contactNumber || values.contactPersonContactNo || values.contactNo || 'N/A',
      logo: record.logoPreviews?.logo || record.logoPreviews?.photo,
    }
  }

  return (
    <div className="md-page">
      {/* Header */}
      <div className="md-header-card">
        <div className="md-header-left">
          <div className="md-eyebrow">Structured Master Linked Form</div>
          <h1 className="md-title">Master Data Records</h1>
          <p className="md-subtitle">{subtitle}</p>
        </div>
        <div className="md-header-actions">
          <button
            type="button"
            className="md-btn md-btn-ghost"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/master-data/new')}
            className="md-btn md-btn-primary"
          >
            <Plus className="h-4 w-4" />
            <span>New Master Data</span>
          </button>
        </div>
      </div>

      {/* Filters / Search */}
      <div className="md-filter-card">
        <div className="md-search">
          <Search className="md-search-icon" />
          <input
            className="md-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, company, email, or phone..."
            type="text"
          />
        </div>
        <div className="md-select-wrap">
          <select
            className="md-select"
            value={tier}
            onChange={(e) => setTier(e.target.value)}
          >
            <option value="all">All Tiers</option>
            <option value="tier-1">Tier 1</option>
            <option value="tier-2">Tier 2</option>
            <option value="tier-3">Tier 3</option>
          </select>
          <ChevronDown className="md-select-chevron" />
        </div>
      </div>

      {/* Records Grid */}
      {filteredRecords.length > 0 ? (
        <div className="md-records-grid">
          {filteredRecords.map((record, index) => {
            const cardDetails = getCardDetails(record)
            const primaryValue = getPrimaryField(record)
            
            return (
              <div key={index} className="md-record-card">
                {cardDetails.logo && (
                  <div className="md-record-logo">
                    <img src={cardDetails.logo} alt={cardDetails.name} className="md-record-logo-image" />
                  </div>
                )}
                <div className="md-record-header">
                  <h3 className="md-record-title">{cardDetails.name}</h3>
                  <span className="md-record-type">{record.title}</span>
                </div>
                <div className="md-record-body">
                  <div className="md-record-field">
                    <span className="md-record-label">Email:</span>
                    <span className="md-record-value">{cardDetails.email}</span>
                  </div>
                  <div className="md-record-field">
                    <span className="md-record-label">Phone:</span>
                    <span className="md-record-value">{cardDetails.phone}</span>
                  </div>
                  <div className="md-record-field">
                    <span className="md-record-label">Submitted:</span>
                    <span className="md-record-value">{formatDate(record.submittedAt)}</span>
                  </div>
                </div>
                <div className="md-record-footer">
                  <button
                    type="button"
                    className="md-record-action md-record-action-edit"
                    onClick={() => {
                      if (record.type === 'combined') {
                        navigate('/master-data/review')
                      } else {
                        navigate(`/master-data/new/${record.type}`)
                      }
                    }}
                  >
                    <Edit className="md-record-action-icon" />
                    <span>View</span>
                  </button>
                  <button
                    type="button"
                    className="md-record-action md-record-action-delete"
                    onClick={() => handleDelete(record)}
                  >
                    <Trash2 className="md-record-action-icon" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Empty state */
        <div className="md-empty-card">
          <div className="md-empty-icon">
            <FileText className="h-7 w-7" />
          </div>
          <h2 className="md-empty-title">No master data found</h2>
          <p className="md-empty-subtitle">
            Create your first master data entry to get started. Fill out the complete form to see it displayed
            here as a card.
          </p>
          <button
            type="button"
            onClick={() => navigate('/master-data/new')}
            className="md-btn md-btn-primary"
          >
            <Plus className="h-4 w-4" />
            <span>Create Master Data</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default MasterData
