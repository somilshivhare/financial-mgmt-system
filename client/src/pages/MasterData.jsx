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
import { ConfirmDialog, useConfirmDialog } from '../components/ConfirmDialog'
import * as masterDataService from '../services/masterDataService'
import '../styles/MasterData.css'

function MasterData() {
  const navigate = useNavigate()
  const location = useLocation()
  const { confirm, dialogProps } = useConfirmDialog()
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
  const [statusFilter, setStatusFilter] = useState('all') // all | draft | published
  const [editLoadingId, setEditLoadingId] = useState(null)
  
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
    const confirmed = await confirm({
      title: 'Delete master data record?',
      message: 'This will remove the company profile and all associated data.',
      confirmText: 'Delete record',
      tone: 'danger',
    })
    if (!confirmed) return
    try {
      // Delete the company profile (which represents this master data set)
      await deleteRecord('company-profile', companyId)
      loadAggregatedMasterData()
    } catch (error) {
      console.error('Failed to delete master data:', error)
    }
  }

  // Edit opens the wizard through the index flow: index → step selection → form steps with prefilled values.
  // For draft: resume that draft. For published: create a new draft copy, then open index with that draftId.
  const handleEdit = async (aggregatedData) => {
    if (!aggregatedData) return
    if ((aggregatedData.status || 'published') === 'draft') {
      navigate(`/master-data/new?draftId=${aggregatedData.companyId}`)
      return
    }
    try {
      setEditLoadingId(aggregatedData.companyId)
      const draftCompany = await masterDataService.createDraftFromPublished(aggregatedData.companyId)
      if (draftCompany?.id) {
        navigate(`/master-data/new?draftId=${draftCompany.id}`)
      }
    } catch (error) {
      console.error('[MasterData] Failed to start draft edit:', error)
    } finally {
      setEditLoadingId(null)
    }
  }

  // Filter aggregated data list based on search query and status (draft / published)
  const filteredAggregatedDataList = useMemo(() => {
    if (!aggregatedDataList || aggregatedDataList.length === 0) return []
    
    let list = aggregatedDataList

    if (statusFilter === 'draft') {
      list = list.filter(item => (item.status || 'published') === 'draft')
    } else if (statusFilter === 'published') {
      list = list.filter(item => (item.status || 'published') === 'published')
    }

    if (!query.trim()) return list
    
    const lowerQuery = query.toLowerCase()
    return list.filter(aggregatedData => {
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
  }, [aggregatedDataList, query, statusFilter])

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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            title="Filter by draft or published"
          >
            <option value="all">All status</option>
            <option value="draft">Draft only</option>
            <option value="published">Published only</option>
          </select>
          <ChevronDown className="md-select-chevron" />
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
                  {(aggregatedData.status || 'published') === 'draft' ? (
                    <span className="md-record-badge md-record-badge-draft" title="Unfinished draft – resume to continue">
                      Draft
                    </span>
                  ) : (
                    <span className="md-record-badge md-record-badge-published" title="Published – edit creates a new draft">
                      Published
                    </span>
                  )}
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
                  onClick={() => handleEdit(aggregatedData)}
                  disabled={editLoadingId === aggregatedData.companyId}
                >
                  <Edit className="md-record-action-icon" />
                  <span>{aggregatedData.status === 'draft' ? 'Resume Draft' : 'Edit'}</span>
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
      <ConfirmDialog {...dialogProps} />
    </div>
  )
}

export default MasterData
