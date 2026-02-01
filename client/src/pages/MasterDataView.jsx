import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Edit,
  CheckCircle2,
  Circle,
  FileText,
  RefreshCw,
} from 'lucide-react'
import { useMasterData } from '../contexts/MasterDataContext'
import * as masterDataService from '../services/masterDataService'
import '../styles/MasterData.css'

const FORM_TITLES = {
  'company-profile': 'Company Profile',
  'customer-profile': 'Customer Profile',
  'consignee-profile': 'Consignee Profile',
  'payer-profile': 'Payer Profile',
  'employee-profile': 'Employee Profile',
  'payment-terms': 'Payment Terms',
}

const FORM_STEPS = [
  { key: 'company-profile', order: 1 },
  { key: 'customer-profile', order: 2 },
  { key: 'consignee-profile', order: 3 },
  { key: 'payer-profile', order: 4 },
  { key: 'employee-profile', order: 5 },
  { key: 'payment-terms', order: 6 },
]

function MasterDataView() {
  const navigate = useNavigate()
  const { companyId } = useParams()
  const { aggregatedDataList, aggregatedLoading, loadAggregatedMasterData } = useMasterData()
  const [aggregatedData, setAggregatedData] = useState(null)
  const [expandedSections, setExpandedSections] = useState({})
  const [editLoading, setEditLoading] = useState(false)

  useEffect(() => {
    loadAggregatedMasterData()
  }, [loadAggregatedMasterData])

  useEffect(() => {
    // Find the specific company's aggregated data
    if (companyId && aggregatedDataList.length > 0) {
      const found = aggregatedDataList.find(item => item.companyId === companyId || item.id === companyId)
      setAggregatedData(found || null)
    } else if (!companyId && aggregatedDataList.length > 0) {
      // If no companyId, show the first one
      setAggregatedData(aggregatedDataList[0])
    } else {
      setAggregatedData(null)
    }
  }, [companyId, aggregatedDataList])

  useEffect(() => {
    // Expand all completed sections by default
    if (aggregatedData?.completionStatus) {
      const expanded = {}
      Object.entries(aggregatedData.completionStatus).forEach(([step, completed]) => {
        if (completed) {
          expanded[step] = true
        }
      })
      setExpandedSections(expanded)
    }
  }, [aggregatedData])

  const toggleSection = (step) => {
    setExpandedSections(prev => ({
      ...prev,
      [step]: !prev[step],
    }))
  }

  const startDraftForStep = async (stepKey) => {
    if (!aggregatedData) return
    if (aggregatedData.status === 'draft') {
      navigate(`/master-data/new?draftId=${aggregatedData.companyId}&step=${stepKey}`)
      return
    }
    try {
      setEditLoading(true)
      const draftCompany = await masterDataService.createDraftFromPublished(aggregatedData.companyId)
      if (draftCompany?.id) {
        navigate(`/master-data/new?draftId=${draftCompany.id}&step=${stepKey}`)
      }
    } catch (error) {
      console.error('[MasterDataView] Failed to start draft step:', error)
    } finally {
      setEditLoading(false)
    }
  }

  const getDisplayValue = (value, logoPreviews, key) => {
    if (logoPreviews && logoPreviews[key]) {
      return logoPreviews[key]
    }
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return JSON.stringify(value)
    }
    if (Array.isArray(value)) {
      return value.join(', ')
    }
    return String(value || 'N/A')
  }

  const renderField = (label, value, logoPreviews, key) => {
    if (logoPreviews && logoPreviews[key]) {
      return (
        <div key={key} className="md-view-field">
          <span className="md-view-label">{label}:</span>
          <div className="md-view-logo-preview">
            <img src={logoPreviews[key]} alt={label} className="md-view-logo-image" />
          </div>
        </div>
      )
    }
    
    return (
      <div key={key} className="md-view-field">
        <span className="md-view-label">{label}:</span>
        <span className="md-view-value">{getDisplayValue(value, logoPreviews, key)}</span>
      </div>
    )
  }

  const renderStepSection = (step) => {
    const stepData = aggregatedData?.stepData?.[step.key]
    const isCompleted = aggregatedData?.completionStatus?.[step.key] || false
    const isExpanded = expandedSections[step.key] || false
    const values = stepData?.values || {}
    const logoPreviews = stepData?.logoPreviews || {}
    const recordId = stepData?.id

    return (
      <div key={step.key} className="md-view-section">
        <div 
          className="md-view-section-header"
          onClick={() => toggleSection(step.key)}
        >
          <div className="md-view-section-title">
            {isCompleted ? (
              <CheckCircle2 className="md-view-section-icon md-view-section-icon-completed" />
            ) : (
              <Circle className="md-view-section-icon md-view-section-icon-pending" />
            )}
            <h3>{FORM_TITLES[step.key]}</h3>
            {isCompleted && (
              <span className="md-view-section-badge">Completed</span>
            )}
          </div>
          <button
            type="button"
            className="md-view-section-edit"
            onClick={(e) => {
              e.stopPropagation()
              startDraftForStep(step.key)
            }}
          >
            <Edit className="h-4 w-4" />
            <span>Edit</span>
          </button>
        </div>
        
        {isExpanded && (
          <div className="md-view-section-content">
            {isCompleted ? (
              <div className="md-view-section-fields">
                {Object.entries(values).map(([key, value]) => {
                  // Skip logoPreviews as it's handled separately
                  if (key === 'logoPreviews') return null
                  
                  // Format field label
                  const label = key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, str => str.toUpperCase())
                    .trim()
                  
                  return renderField(label, value, logoPreviews, key)
                })}
              </div>
            ) : (
              <div className="md-view-section-empty">
                <p>This step has not been completed yet.</p>
                <button
                  type="button"
                  className="md-btn md-btn-primary"
                  onClick={() => startDraftForStep(step.key)}
                >
                  Complete {FORM_TITLES[step.key]}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const handleEditMasterData = async () => {
    if (!aggregatedData) return
    if (aggregatedData.status === 'draft') {
      navigate(`/master-data/new?draftId=${aggregatedData.companyId}`)
      return
    }
    try {
      setEditLoading(true)
      const draftCompany = await masterDataService.createDraftFromPublished(aggregatedData.companyId)
      if (draftCompany?.id) {
        navigate(`/master-data/new?draftId=${draftCompany.id}`)
      }
    } catch (error) {
      console.error('[MasterDataView] Failed to start draft edit:', error)
    } finally {
      setEditLoading(false)
    }
  }

  if (aggregatedLoading) {
    return (
      <div className="md-page">
        <div className="md-empty-card">
          <RefreshCw className="h-7 w-7 animate-spin" />
          <h2 className="md-empty-title">Loading Master Data...</h2>
        </div>
      </div>
    )
  }

  if (!aggregatedData) {
    return (
      <div className="md-page">
        <div className="md-empty-card">
          <FileText className="h-7 w-7" />
          <h2 className="md-empty-title">No Master Data Found</h2>
          <p className="md-empty-subtitle">
            Start filling out the master data forms to see your consolidated record here.
          </p>
          <button
            type="button"
            onClick={() => navigate('/master-data/new')}
            className="md-btn md-btn-primary"
          >
            Start Master Data Entry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="md-page">
      {/* Header */}
      <div className="md-header-card">
        <div className="md-header-left">
          <button
            type="button"
            onClick={() => navigate('/master-data')}
            className="md-btn md-btn-ghost"
            style={{ marginBottom: '1rem' }}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Records</span>
          </button>
          <div className="md-eyebrow">Consolidated Master Data</div>
          <h1 className="md-title">{aggregatedData.primaryName}</h1>
          <p className="md-subtitle">
            Complete overview of all master data steps ({aggregatedData.completedSteps}/{aggregatedData.totalSteps} completed)
          </p>
        </div>
        <div className="md-header-actions">
          <button
            type="button"
            onClick={handleEditMasterData}
            className="md-btn md-btn-primary"
            disabled={editLoading}
          >
            <Edit className="h-4 w-4" />
            <span>{aggregatedData?.status === 'draft' ? 'Resume Draft' : 'Edit Master Data'}</span>
          </button>
        </div>
      </div>

      {/* Completion Summary */}
      <div className="md-view-summary-card">
        <div className="md-view-summary-item">
          <span className="md-view-summary-label">Completion Status</span>
          <div className="md-view-progress-bar">
            <div 
              className="md-view-progress-fill"
              style={{ width: `${aggregatedData.completionPercentage}%` }}
            />
          </div>
          <span className="md-view-summary-value">{aggregatedData.completionPercentage}%</span>
        </div>
        <div className="md-view-summary-item">
          <span className="md-view-summary-label">Last Updated</span>
          <span className="md-view-summary-value">
            {new Date(aggregatedData.lastUpdated).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>

      {/* Step Sections */}
      <div className="md-view-sections">
        {FORM_STEPS.map(step => renderStepSection(step))}
      </div>
    </div>
  )
}

export default MasterDataView
