import { useMemo, useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  RefreshCw,
  Plus,
  Search,
  FileText,
  Edit,
  Trash2,
  Eye,
  X,
} from 'lucide-react'
import { useMasterData } from '../contexts/MasterDataContext'
import { ConfirmDialog, useConfirmDialog } from '../components/ConfirmDialog'
import * as masterDataService from '../services/masterDataService'
import '../styles/MasterData.css'

function MasterData() {
  const ACTIVE_STEP_KEYS = ['company-profile', 'customer-profile', 'consignee-profile', 'payer-profile', 'employee-profile']

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
  const [statusFilter, setStatusFilter] = useState('all')
  const [completionFilter, setCompletionFilter] = useState('all')
  const [updatedFilter, setUpdatedFilter] = useState('all')
  const [missingStepFilter, setMissingStepFilter] = useState('all')
  const [quickFilter, setQuickFilter] = useState('none')
  const [editLoadingId, setEditLoadingId] = useState(null)
  
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

  useEffect(() => {
    const handleUpdate = () => {
      loadMasterData()
      loadAggregatedMasterData()
    }

    window.addEventListener('masterDataUpdated', handleUpdate)
    
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
      await deleteRecord('company-profile', companyId)
      loadAggregatedMasterData()
    } catch (error) {
      console.error('Failed to delete master data:', error)
    }
  }

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

  const filteredAggregatedDataList = useMemo(() => {
    if (!aggregatedDataList || aggregatedDataList.length === 0) return []

    const normalizeCompletion = (item) => {
      const rawStatus = item?.completionStatus || {}
      const normalizedStatus = ACTIVE_STEP_KEYS.reduce((acc, key) => {
        acc[key] = !!rawStatus[key]
        return acc
      }, {})
      const completedSteps = ACTIVE_STEP_KEYS.filter((key) => normalizedStatus[key]).length
      const totalSteps = ACTIVE_STEP_KEYS.length
      const completionPercentage = totalSteps > 0
        ? Math.round((completedSteps / totalSteps) * 100)
        : 0

      return {
        ...item,
        completionStatus: normalizedStatus,
        completedSteps,
        totalSteps,
        completionPercentage,
      }
    }
    
    // Hide archived sets from the active master-data board.
    let list = aggregatedDataList.map(normalizeCompletion).filter((item) => {
      const status = (item?.status || '').toLowerCase()
      return status === 'draft' || status === 'published'
    })

    if (statusFilter === 'draft') {
      list = list.filter(item => (item.status || 'published') === 'draft')
    } else if (statusFilter === 'published') {
      list = list.filter(item => (item.status || 'published') === 'published')
    }

    if (completionFilter === 'incomplete') {
      list = list.filter((item) => Number(item.completionPercentage || 0) < 100)
    } else if (completionFilter === 'complete') {
      list = list.filter((item) => Number(item.completionPercentage || 0) === 100)
    }

    if (missingStepFilter !== 'all') {
      list = list.filter((item) => !item?.completionStatus?.[missingStepFilter])
    }

    if (updatedFilter !== 'all') {
      const now = Date.now()
      const limitMs =
        updatedFilter === '24h'
          ? 24 * 60 * 60 * 1000
          : updatedFilter === '7d'
            ? 7 * 24 * 60 * 60 * 1000
            : 30 * 24 * 60 * 60 * 1000

      list = list.filter((item) => {
        const lastUpdated = new Date(item.lastUpdated || item.createdAt || 0).getTime()
        if (!lastUpdated || Number.isNaN(lastUpdated)) return false
        return (now - lastUpdated) <= limitMs
      })
    }

    if (quickFilter === 'attention') {
      list = list.filter((item) => Number(item.completionPercentage || 0) < 100)
    } else if (quickFilter === 'recent') {
      const now = Date.now()
      list = list.filter((item) => {
        const ts = new Date(item.lastUpdated || item.createdAt || 0).getTime()
        if (!ts || Number.isNaN(ts)) return false
        return (now - ts) <= (7 * 24 * 60 * 60 * 1000)
      })
    } else if (quickFilter === 'drafts') {
      list = list.filter((item) => (item.status || 'published') === 'draft')
    } else if (quickFilter === 'readyToPublish') {
      list = list.filter((item) => (item.status || 'published') === 'draft' && Number(item.completionPercentage || 0) === 100)
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
  }, [aggregatedDataList, query, statusFilter, completionFilter, updatedFilter, missingStepFilter, quickFilter])

  const totalRecords = useMemo(() => {
    return (aggregatedDataList || []).filter((item) => {
      const status = (item?.status || '').toLowerCase()
      return status === 'draft' || status === 'published'
    }).length
  }, [aggregatedDataList])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (query.trim()) count += 1
    if (statusFilter !== 'all') count += 1
    if (completionFilter !== 'all') count += 1
    if (updatedFilter !== 'all') count += 1
    if (missingStepFilter !== 'all') count += 1
    if (quickFilter !== 'none') count += 1
    return count
  }, [query, statusFilter, completionFilter, updatedFilter, missingStepFilter, quickFilter])

  const resetFilters = () => {
    setQuery('')
    setStatusFilter('all')
    setCompletionFilter('all')
    setUpdatedFilter('all')
    setMissingStepFilter('all')
    setQuickFilter('none')
  }

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



  const getCompletionBadges = (completionStatus) => {
    const stepLabels = {
      'company-profile': 'Company',
      'customer-profile': 'Customer',
      'consignee-profile': 'Consignee',
      'payer-profile': 'Payer',
      'employee-profile': 'Employee',
    }
    
    return ACTIVE_STEP_KEYS.map((step) => ({
      step,
      label: stepLabels[step] || step,
      completed: !!(completionStatus || {})[step],
    }))
  }
  
  const getPrimaryContact = (aggregated) => {
    if (!aggregated || !aggregated.stepData) {
      return { email: 'N/A', phone: 'N/A' }
    }
    
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
        <div className="md-filter-top">
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
          <div className="md-filter-meta">
            <span className="md-filter-result-count">
              Showing {filteredAggregatedDataList.length} of {totalRecords}
            </span>
            {activeFilterCount > 0 && (
              <button
                type="button"
                className="md-filter-reset"
                onClick={resetFilters}
                title="Clear all filters"
              >
                <X className="h-4 w-4" />
                <span>Clear ({activeFilterCount})</span>
              </button>
            )}
          </div>
        </div>

        <div className="md-quick-filters">
          <button type="button" className={`md-quick-chip ${quickFilter === 'none' ? 'is-active' : ''}`} onClick={() => setQuickFilter('none')}>
            All
          </button>
          <button type="button" className={`md-quick-chip ${quickFilter === 'attention' ? 'is-active' : ''}`} onClick={() => setQuickFilter('attention')}>
            Needs Attention
          </button>
          <button type="button" className={`md-quick-chip ${quickFilter === 'recent' ? 'is-active' : ''}`} onClick={() => setQuickFilter('recent')}>
            Updated in 7 days
          </button>
          <button type="button" className={`md-quick-chip ${quickFilter === 'drafts' ? 'is-active' : ''}`} onClick={() => setQuickFilter('drafts')}>
            Drafts
          </button>
          <button type="button" className={`md-quick-chip ${quickFilter === 'readyToPublish' ? 'is-active' : ''}`} onClick={() => setQuickFilter('readyToPublish')}>
            Ready to Publish
          </button>
        </div>

        <div className="md-filter-grid">
          <div className="md-select-wrap">
            <select
              className="md-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              title="Filter by record status"
            >
              <option value="all">All status</option>
              <option value="draft">Draft only</option>
              <option value="published">Published only</option>
            </select>
          </div>

          <div className="md-select-wrap">
            <select
              className="md-select"
              value={completionFilter}
              onChange={(e) => setCompletionFilter(e.target.value)}
              title="Filter by completion percentage"
            >
              <option value="all">All completion</option>
              <option value="complete">100% complete</option>
              <option value="incomplete">Below 100%</option>
            </select>
          </div>

          <div className="md-select-wrap">
            <select
              className="md-select"
              value={updatedFilter}
              onChange={(e) => setUpdatedFilter(e.target.value)}
              title="Filter by last updated date"
            >
              <option value="all">Any time</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </div>

          <div className="md-select-wrap">
            <select
              className="md-select"
              value={missingStepFilter}
              onChange={(e) => setMissingStepFilter(e.target.value)}
              title="Filter by missing step"
            >
              <option value="all">Any missing step</option>
              <option value="company-profile">Missing Company</option>
              <option value="customer-profile">Missing Customer</option>
              <option value="consignee-profile">Missing Consignee</option>
              <option value="payer-profile">Missing Payer</option>
              <option value="employee-profile">Missing Employee</option>
            </select>
          </div>
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
