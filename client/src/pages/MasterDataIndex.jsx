import { useMemo, useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  Truck,
  CreditCard,
  IdCard,
  Users,
  ArrowRight,
  CheckCircle2,
  Circle,
  RefreshCw,
} from 'lucide-react'
import * as masterDataService from '../services/masterDataService'
import { FORM_DEFS, FORM_STEPS } from '../utils/masterDataDefs'
import '../styles/MasterData.css'

function MasterDataIndex() {
  const navigate = useNavigate()
  const location = useLocation()
  const [loadingDraft, setLoadingDraft] = useState(true)
  const [draftResumeError, setDraftResumeError] = useState('')
  const [draftData, setDraftData] = useState(null)
  const [autoStepHandled, setAutoStepHandled] = useState(false)

  const queryParams = useMemo(() => {
    try {
      const params = new URLSearchParams(location.search)
      return {
        draftId: params.get('draftId') || '',
        step: params.get('step') || '',
      }
    } catch {
      return { draftId: '', step: '' }
    }
  }, [location.search])

  useEffect(() => {
    let cancelled = false

    const loadDraftState = async () => {
      try {
        setLoadingDraft(true)
        setDraftResumeError('')
        const draft = await masterDataService.getDraftMasterData(
          queryParams.draftId ? { companyId: queryParams.draftId } : {}
        )
        if (cancelled) return
        setDraftData(draft || null)
        if (queryParams.draftId && !draft?.companyId) {
          setDraftResumeError('Draft not found. You can start a new master data entry.')
        }
      } catch (error) {
        console.error('[MasterDataIndex] Failed to load draft:', error)
        if (!cancelled) {
          setDraftResumeError('Unable to load draft. You can start a new master data entry.')
        }
      } finally {
        if (!cancelled) setLoadingDraft(false)
      }
    }

    loadDraftState()

    return () => {
      cancelled = true
    }
  }, [navigate, queryParams.draftId])

  useEffect(() => {
    if (loadingDraft || !draftData?.companyId || queryParams.draftId) return
    const expected = `${window.location.pathname}?draftId=${draftData.companyId}`
    if (window.location.search !== `?draftId=${draftData.companyId}`) {
      navigate(expected, { replace: true })
    }
  }, [loadingDraft, draftData?.companyId, queryParams.draftId, navigate])

  const activeDraftId = draftData?.companyId || ''
  const completionStatus = draftData?.completionStatus || {}
  const stepData = draftData?.stepData || {}

  const hasAnyDraftValues = (values) => {
    if (!values) return false
    return Object.values(values).some((value) => {
      if (value == null) return false
      if (typeof value === 'string') return value.trim().length > 0
      if (Array.isArray(value)) return value.length > 0
      if (typeof value === 'object') return Object.keys(value).length > 0
      return true
    })
  }

  const getEntryIndices = (values, group) => {
    const indices = new Set()
    Object.keys(values || {}).forEach((k) => {
      const match = k.match(/^(.*)_(\d+)$/)
      if (match) indices.add(Number(match[2]))
    })
    if (indices.size === 0 && group.fields.some((f) => values?.[f.key] !== undefined)) {
      indices.add(0)
    }
    return Array.from(indices).sort((a, b) => a - b)
  }

  const isArrayType = (stepKey) => (
    ['consignee-profile', 'payer-profile', 'employee-profile'].includes(stepKey)
  )

  const isStepComplete = (stepKey, values) => {
    const def = FORM_DEFS[stepKey]
    if (!def) return false
    if (!values) return false

    if (isArrayType(stepKey)) {
      return def.groups.every((group) =>
        group.fields.every((f) => !f.required || String(values[f.key] || '').trim())
      )
    }

    return def.groups.every((group) => {
      const entries = group.allowMultiple ? getEntryIndices(values, group) : [0]
      return entries.every((entryIndex) =>
        group.fields.every((f) => {
          if (!f.required) return true
          const key = group.allowMultiple ? `${f.key}_${entryIndex}` : f.key
          return String(values[key] || '').trim()
        })
      )
    })
  }

  const stepStatuses = useMemo(() => {
    return FORM_STEPS.reduce((acc, step) => {
      if (step.key === 'review-submit') {
        acc[step.key] = activeDraftId ? 'review' : 'locked'
        return acc
      }
      if (!activeDraftId) {
        acc[step.key] = step.key === 'company-profile' ? 'start' : 'locked'
        return acc
      }
      const stepValues = stepData?.[step.key]?.values || {}
      if (!completionStatus?.[step.key] && !hasAnyDraftValues(stepValues)) {
        acc[step.key] = 'incomplete'
        return acc
      }
      acc[step.key] = isStepComplete(step.key, stepValues) ? 'completed' : 'draft'
      return acc
    }, {})
  }, [activeDraftId, completionStatus, stepData])

  const resumeStep = useMemo(() => {
    if (!activeDraftId) return 'company-profile'
    const nextIncomplete = FORM_STEPS.find(
      (step) => step.key !== 'review-submit' && stepStatuses[step.key] !== 'completed'
    )
    return nextIncomplete?.key || 'review-submit'
  }, [activeDraftId, stepStatuses])

  useEffect(() => {
    if (autoStepHandled || !queryParams.step) return
    if (loadingDraft) return

    if (!activeDraftId && queryParams.step !== 'company-profile') {
      setAutoStepHandled(true)
      navigate('/master-data/new/company-profile?flow=wizard')
      return
    }

    if (queryParams.step === 'review-submit') {
      if (activeDraftId) {
        setAutoStepHandled(true)
        navigate(`/master-data/review?draftId=${activeDraftId}&flow=wizard`)
      }
      return
    }

    if (activeDraftId) {
      setAutoStepHandled(true)
      navigate(`/master-data/new/${queryParams.step}?draftId=${activeDraftId}&flow=wizard`)
    }
  }, [autoStepHandled, queryParams.step, activeDraftId, loadingDraft, navigate])

  const items = useMemo(
    () => [
      {
        key: 'company-profile',
        title: 'Company Profile',
        description: 'Organization details, GSTIN, address, banking info.',
        icon: Building2,
        step: 1,
      },
      {
        key: 'customer-profile',
        title: 'Customer Profile',
        description: 'Customer master for invoicing and contact info.',
        icon: Users,
        step: 2,
      },
      {
        key: 'consignee-profile',
        title: 'Consignee Profile',
        description: 'Ship-to location details and delivery preferences.',
        icon: Truck,
        step: 3,
      },
      {
        key: 'payer-profile',
        title: 'Payer Profile',
        description: 'Bill-to and payment responsible party details.',
        icon: CreditCard,
        step: 4,
      },
      {
        key: 'employee-profile',
        title: 'Employee Profile',
        description: 'Sales/ops team profiles for approvals and tracking.',
        icon: IdCard,
        step: 5,
      },
      {
        key: 'review-submit',
        title: 'Review & Final Submit',
        description: 'Review all draft data and publish when ready.',
        icon: CheckCircle2,
        step: 6,
      },
    ],
    [],
  )

  const handleRowClick = (key) => {
    if (key === 'review-submit') {
      if (!activeDraftId) return
      navigate(`/master-data/review?draftId=${activeDraftId}&flow=wizard`)
      return
    }

    if (!activeDraftId) {
      navigate('/master-data/new/company-profile?flow=wizard')
      return
    }

    navigate(`/master-data/new/${key}?draftId=${activeDraftId}&flow=wizard`)
  }

  return (
    <div>
      {/* Breadcrumb */}
      <button
        type="button"
        onClick={() => navigate('/master-data')}
        className="md-breadcrumb-link"
      >
        <ArrowLeft className="md-breadcrumb-icon" />
        Back to Master Data
      </button>

      {/* Page Header */}
      <div className="md-index-header">
        <div className="md-eyebrow">Wizard</div>
        <h1 className="md-title">Master Data Wizard</h1>
        <p className="md-subtitle">Resume a draft or start a new master data workflow.</p>
      </div>

      <div className="md-index-table-container">
        <div className="md-index-header" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              type="button"
              className="md-btn md-btn-primary"
              onClick={() => {
                if (activeDraftId) {
                  const target = resumeStep === 'review-submit'
                    ? `/master-data/review?draftId=${activeDraftId}&flow=wizard`
                    : `/master-data/new/${resumeStep}?draftId=${activeDraftId}&flow=wizard`
                  navigate(target)
                } else {
                  navigate('/master-data/new/company-profile?flow=wizard')
                }
              }}
              disabled={loadingDraft}
              title={activeDraftId ? 'Continue your saved draft' : 'Begin a new master data entry'}
            >
              {activeDraftId ? 'Resume Draft' : 'Start New Master Data'}
            </button>
            <button
              type="button"
              className="md-btn md-btn-ghost"
              onClick={() => navigate('/master-data/new/company-profile?flow=wizard')}
              disabled={loadingDraft}
              title={activeDraftId ? 'Ignore current draft and start a blank new entry' : 'Start a new entry from step 1'}
            >
              Start Fresh
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <RefreshCw className={`h-4 w-4 ${loadingDraft ? 'animate-spin' : ''}`} />
            <span style={{ fontSize: '0.9rem', color: 'var(--color-text-tertiary)' }}>
              {draftResumeError || (activeDraftId ? 'Draft session detected.' : 'No draft in progress.')}
            </span>
          </div>
        </div>

        <table className="md-index-table">
          <thead>
            <tr>
              <th className="md-index-table-header md-index-table-step">Step</th>
              <th className="md-index-table-header md-index-table-module">Module Name</th>
              <th className="md-index-table-header md-index-table-description">Description</th>
              <th className="md-index-table-header md-index-table-action">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const Icon = item.icon
              const status = stepStatuses[item.key]
              const isLocked = status === 'locked'
              const isReviewStep = item.key === 'review-submit'

              return (
                <tr
                  key={item.key}
                  className={`md-index-table-row ${isReviewStep ? 'md-index-table-row-review' : ''}`}
                  onClick={() => {
                    if (!isLocked) handleRowClick(item.key)
                  }}
                  tabIndex={isLocked ? -1 : 0}
                  role="button"
                  aria-label={`Open ${item.title}`}
                >
                  <td className="md-index-table-cell md-index-table-step">
                    <span className="md-index-step-number">{item.step}</span>
                  </td>
                  <td className="md-index-table-cell md-index-table-module">
                    <div className="md-index-module-content">
                      <div className="md-index-module-icon-wrapper">
                        <Icon className="md-index-module-icon" />
                      </div>
                      <span className="md-index-module-title">
                        {item.title}
                      </span>
                    </div>
                  </td>
                  <td className="md-index-table-cell md-index-table-description">
                    <span className="md-index-module-description">
                      {item.description}
                    </span>
                  </td>
                  <td className="md-index-table-cell md-index-table-action">
                    {status === 'completed' && (
                      <span className="md-record-step-badge md-record-step-badge-completed">
                        <CheckCircle2 className="h-4 w-4" /> Completed
                      </span>
                    )}
                    {status === 'draft' && (
                      <span className="md-record-step-badge md-record-step-badge-pending">
                        <Circle className="h-4 w-4" /> Draft Saved
                      </span>
                    )}
                    {status === 'incomplete' && (
                      <span className="md-record-step-badge md-record-step-badge-pending">
                        <Circle className="h-4 w-4" /> Incomplete
                      </span>
                    )}
                    {status === 'start' && (
                      <span className="md-record-step-badge md-record-step-badge-pending">
                        <Circle className="h-4 w-4" /> Start Here
                      </span>
                    )}
                    {status === 'locked' && (
                      <span className="md-record-step-badge md-record-step-badge-pending">
                        <Circle className="h-4 w-4" /> Locked
                      </span>
                    )}
                    {status === 'review' && (
                      <span className="md-record-step-badge md-record-step-badge-completed">
                        <CheckCircle2 className="h-4 w-4" /> Review
                      </span>
                    )}
                    {!status && (
                      <ArrowRight className="md-index-action-icon" />
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default MasterDataIndex
