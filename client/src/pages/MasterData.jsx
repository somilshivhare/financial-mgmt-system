import { useMemo, useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  RefreshCw,
  Plus,
  Search,
  ChevronDown,
  FileText,
  Edit,
  Trash2,
  Calendar,
  Eye,
  CheckCircle2,
  Circle,
} from 'lucide-react'
import { useMasterData } from '../contexts/MasterDataContext'
import '../styles/MasterData.css'

function MasterData() {
  const navigate = useNavigate()
  const location = useLocation()
  const { 
    masterData, 
    loadMasterData, 
    deleteRecord,
    aggregatedDataList,
    aggregatedLoading,
    loadAggregatedMasterData,
  } = useMasterData()
  const [query, setQuery] = useState('')
  const [tier, setTier] = useState('all')
  
  // Refresh data when navigating to this page
  useEffect(() => {
    if (location.pathname === '/master-data') {
      loadMasterData()
      loadAggregatedMasterData()
    }
  }, [location.pathname, loadMasterData, loadAggregatedMasterData])

  useEffect(() => {
    loadMasterData()
    loadAggregatedMasterData()
  }, [loadMasterData, loadAggregatedMasterData])

  // Listen for master data updates (e.g., after form submission)
  useEffect(() => {
    const handleUpdate = () => {
      loadMasterData()
      loadAggregatedMasterData()
    }

    window.addEventListener('masterDataUpdated', handleUpdate)
    
    // Also refresh when page becomes visible (user navigates back)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadMasterData()
        loadAggregatedMasterData()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      window.removeEventListener('masterDataUpdated', handleUpdate)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [loadMasterData, loadAggregatedMasterData])

  const handleRefresh = () => {
    loadMasterData()
    loadAggregatedMasterData()
  }

  const handleDelete = async (companyId) => {
    if (window.confirm('Are you sure you want to delete this master data record? This will remove the company profile and all associated data.')) {
      try {
        // Delete the company profile (which represents this master data set)
        await deleteRecord('company-profile', companyId)
        loadAggregatedMasterData()
      } catch (error) {
        console.error('Failed to delete master data:', error)
      }
    }
  }

  // Filter aggregated data list based on search query
  const filteredAggregatedDataList = useMemo(() => {
    if (!aggregatedDataList || aggregatedDataList.length === 0) return []
    
    if (!query.trim()) return aggregatedDataList
    
    const lowerQuery = query.toLowerCase()
    return aggregatedDataList.filter(aggregatedData => {
      const searchableText = [
        aggregatedData.primaryName,
        ...Object.values(aggregatedData.stepData || {}).map(step => {
          if (!step) return ''
          const values = step.values || {}
          return Object.values(values).join(' ')
        })
      ].join(' ').toLowerCase()
      
      return searchableText.includes(lowerQuery)
    })
  }, [aggregatedDataList, query])

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



  // Get completion status badges for each step
  const getCompletionBadges = (completionStatus) => {
    const stepLabels = {
      'company-profile': 'Company',
      'customer-profile': 'Customer',
      'consignee-profile': 'Consignee',
      'payer-profile': 'Payer',
      'employee-profile': 'Employee',
      'payment-terms': 'Payment Terms',
    }
    
    return Object.entries(completionStatus || {}).map(([step, completed]) => ({
      step,
      label: stepLabels[step] || step,
      completed: !!completed,
    }))
  }
  
  // Get primary contact info from aggregated data
  const getPrimaryContact = (aggregated) => {
    if (!aggregated || !aggregated.stepData) {
      return { email: 'N/A', phone: 'N/A' }
    }
    
    // Try to get from company-profile first, then customer-profile
    const companyData = aggregated.stepData['company-profile']
    if (companyData?.values) {
      return {
        email: companyData.values.emailId || 'N/A',
        phone: companyData.values.contactNumber || 'N/A',
      }
    }
    
    const customerData = aggregated.stepData['customer-profile']
    if (customerData?.values) {
      return {
        email: customerData.values.emailId || 'N/A',
        phone: customerData.values.contactNumber || customerData.values.contactPersonContactNo || 'N/A',
      }
    }
    
    return { email: 'N/A', phone: 'N/A' }
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

      {/* Consolidated Master Data Cards - Multiple Cards */}
      {aggregatedLoading ? (
        <div className="md-empty-card">
          <div className="md-empty-icon">
            <RefreshCw className="h-7 w-7 animate-spin" />
          </div>
          <h2 className="md-empty-title">Loading Master Data...</h2>
        </div>
      ) : filteredAggregatedDataList.length > 0 ? (
        <div className="md-records-grid">
          {filteredAggregatedDataList.map((aggregatedData) => (
            <div key={aggregatedData.id} className="md-record-card md-record-card-consolidated">
              {aggregatedData.primaryLogo && (
                <div className="md-record-logo">
                  <img 
                    src={aggregatedData.primaryLogo} 
                    alt={aggregatedData.primaryName} 
                    className="md-record-logo-image" 
                  />
                </div>
              )}
              <div className="md-record-header">
                <h3 className="md-record-title">{aggregatedData.primaryName}</h3>
                <div className="md-record-badges">
                  <span className="md-record-badge md-record-badge-completion">
                    {aggregatedData.completionPercentage}% Complete
                  </span>
                  <span className="md-record-badge">
                    {aggregatedData.completedSteps}/{aggregatedData.totalSteps} Steps
                  </span>
                </div>
              </div>
              <div className="md-record-body">
                <div className="md-record-field">
                  <span className="md-record-label">Email:</span>
                  <span className="md-record-value">{getPrimaryContact(aggregatedData).email}</span>
                </div>
                <div className="md-record-field">
                  <span className="md-record-label">Phone:</span>
                  <span className="md-record-value">{getPrimaryContact(aggregatedData).phone}</span>
                </div>
                <div className="md-record-field">
                  <span className="md-record-label">Last Updated:</span>
                  <span className="md-record-value">{formatDate(aggregatedData.lastUpdated)}</span>
                </div>
                
                {/* Completion Status */}
                <div className="md-record-steps">
                  <span className="md-record-label">Completed Steps:</span>
                  <div className="md-record-step-badges">
                    {getCompletionBadges(aggregatedData.completionStatus).map((badge) => (
                      <span
                        key={badge.step}
                        className={`md-record-step-badge ${badge.completed ? 'md-record-step-badge-completed' : 'md-record-step-badge-pending'}`}
                        title={badge.completed ? `${badge.label} completed` : `${badge.label} pending`}
                      >
                        {badge.completed ? '✓' : '○'} {badge.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="md-record-footer">
                <button
                  type="button"
                  className="md-record-action md-record-action-edit"
                  onClick={() => navigate(`/master-data/view/${aggregatedData.companyId}`)}
                >
                  <Eye className="md-record-action-icon" />
                  <span>View Details</span>
                </button>
                <button
                  type="button"
                  className="md-record-action md-record-action-edit"
                  onClick={() => navigate('/master-data/new')}
                >
                  <Edit className="md-record-action-icon" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  className="md-record-action md-record-action-delete"
                  onClick={() => handleDelete(aggregatedData.companyId)}
                >
                  <Trash2 className="md-record-action-icon" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
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
