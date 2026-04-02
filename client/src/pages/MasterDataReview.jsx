import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowLeft,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import * as masterDataService from '../services/masterDataService'
import { FORM_DEFS, FORM_STEPS, FORM_TYPES } from '../utils/masterDataDefs'
import '../styles/MasterData.css'

const FORM_TITLES = {
  'company-profile': 'Company Profile',
  'customer-profile': 'Customer Profile',
  'consignee-profile': 'Consignee Profile',
  'payer-profile': 'Payer Profile',
  'employee-profile': 'Employee Profile',
  'payment-terms': 'Payment Terms',
}

function MasterDataReview() {
  const navigate = useNavigate()
  const location = useLocation()
  const [allFormData, setAllFormData] = useState({})
  const [loading, setLoading] = useState(true)
  const [draftCompanyId, setDraftCompanyId] = useState('')
  const [submitStatus, setSubmitStatus] = useState({ kind: 'idle', message: '' })
  const [expandedSections, setExpandedSections] = useState({})

  const draftIdFromQuery = useMemo(() => {
    try {
      return new URLSearchParams(location.search).get('draftId') || ''
    } catch {
      return ''
    }
  }, [location.search])

  const isWizardFlow = useMemo(() => {
    try {
      return new URLSearchParams(location.search).get('flow') === 'wizard'
    } catch {
      return false
    }
  }, [location.search])

  const wizardReviewPrevStepKey = useMemo(() => {
    const reviewIdx = FORM_STEPS.findIndex((s) => s.key === 'review-submit')
    if (reviewIdx <= 0) return null
    return FORM_STEPS[reviewIdx - 1]?.key || null
  }, [])

  const loadFormData = useCallback(async () => {
    try {
      setLoading(true)
      setAllFormData({})

      const formData = {}
      const draftMeta = draftIdFromQuery
        ? { companyId: draftIdFromQuery }
        : await masterDataService.getDraftMasterData()

      const activeDraftCompanyId = draftMeta?.companyId || ''
      setDraftCompanyId(activeDraftCompanyId)

      if (!activeDraftCompanyId) {
        setAllFormData({})
        return
      }

      const buildMultipleEntries = (values, groups) => {
        const nextMultipleEntries = {}
        if (!groups) return nextMultipleEntries

        const suffixIndexByBase = {}
        const addIndex = (base, idx) => {
          if (!suffixIndexByBase[base]) suffixIndexByBase[base] = new Set()
          suffixIndexByBase[base].add(idx)
        }

        Object.keys(values || {}).forEach((k) => {
          const m = k.match(/^(.*)_(\d+)$/)
          if (m) addIndex(m[1], Number(m[2]))
        })

        groups.forEach((group, groupIndex) => {
          if (!group.allowMultiple) return
          const indices = new Set()
          group.fields.forEach((f) => {
            const basesToCheck = [f.key, `${f.key}Other`]
            basesToCheck.forEach((base) => {
              const found = suffixIndexByBase[base]
              if (found) found.forEach((idx) => indices.add(idx))
            })
          })
          if (indices.size === 0) {
            const hasAnyBase = group.fields.some((f) => (
              values?.[f.key] !== undefined || values?.[`${f.key}Other`] !== undefined
            ))
            if (hasAnyBase) indices.add(0)
          }
          const sorted = Array.from(indices).sort((a, b) => a - b)
          nextMultipleEntries[groupIndex] = sorted.length > 0 ? sorted : [0]
        })

        return nextMultipleEntries
      }

      const loadPromises = FORM_TYPES.map(async (type) => {
        try {
          let records = []
          if (type === 'company-profile') {
            const recordResp = await masterDataService.getMasterDataById(type, activeDraftCompanyId)
            const record = recordResp?.data || recordResp
            records = record ? [record] : []
          } else {
            records = await masterDataService.getMasterDataByType(type, {
              companyId: activeDraftCompanyId,
              status: 'draft',
            })
          }
          const draftRecords = (records || []).filter(record => (record.status || 'published') === 'draft')
          if (draftRecords.length > 0) {
            const def = FORM_DEFS[type]
            formData[type] = draftRecords.map(record => {
              const values = record.values || {}
              const logoPreviews = values.logoPreviews || record.logoPreviews || {}
              const { logoPreviews: _lp, ...cleanValues } = values
              return {
                id: record.id,
                type,
                title: FORM_TITLES[type],
                values: cleanValues,
                logoPreviews,
                groups: def?.groups || [],
                multipleEntries: buildMultipleEntries(cleanValues, def?.groups || []),
                savedAt: record.created_at || record.updated_at || new Date().toISOString(),
              }
            })
          }
        } catch (error) {
          console.error(`Failed to load ${type} from backend:`, error)
        }
      })

      await Promise.allSettled(loadPromises)
      setAllFormData(formData)
    } catch (error) {
      console.error('[MasterDataReview] Failed to load form data:', error)
    } finally {
      setLoading(false)
    }
  }, [draftIdFromQuery])

  useEffect(() => {
    if (location.pathname === '/master-data/review') {
      loadFormData()
    }
  }, [location.pathname, loadFormData])

  useEffect(() => {
    loadFormData()

    const handleUpdate = () => {
      loadFormData()
    }
    
    const handleVisibilityChange = () => {
      if (!document.hidden && location.pathname === '/master-data/review') {
        loadFormData()
      }
    }
    
    window.addEventListener('masterDataUpdated', handleUpdate)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      window.removeEventListener('masterDataUpdated', handleUpdate)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [location.pathname, loadFormData])

  const hasAnyData = Object.keys(allFormData).some(type => {
    const records = allFormData[type]
    return Array.isArray(records) && records.length > 0
  })

  const visibleTypes = useMemo(
    () => FORM_TYPES.filter((type) => Array.isArray(allFormData[type]) && allFormData[type].length > 0),
    [allFormData]
  )

  useEffect(() => {
    if (visibleTypes.length === 0) {
      setExpandedSections({})
      return
    }
    setExpandedSections((prev) => {
      const next = {}
      visibleTypes.forEach((type, index) => {
        next[type] = prev[type] ?? index === 0
      })
      return next
    })
  }, [visibleTypes])

  const toggleSection = (type) => {
    setExpandedSections((prev) => ({ ...prev, [type]: !prev[type] }))
  }

  const expandAllSections = () => {
    setExpandedSections(Object.fromEntries(visibleTypes.map((type) => [type, true])))
  }

  const collapseAllSections = () => {
    setExpandedSections(Object.fromEntries(visibleTypes.map((type) => [type, false])))
  }

  const validateDraft = useCallback(() => {
    const errors = []

    FORM_TYPES.forEach((type) => {
      const def = FORM_DEFS[type]
      const records = allFormData[type] || []

      if (!def) return

      if (!records.length) {
        errors.push(`${FORM_TITLES[type]} is missing.`)
        return
      }

      const isArrayType = ['customer-profile', 'consignee-profile', 'payer-profile', 'employee-profile', 'payment-terms'].includes(type)

      records.forEach((record, recordIndex) => {
        const values = record.values || {}
        def.groups.forEach((group, groupIndex) => {
          const entries = isArrayType
            ? [null]
            : (group.allowMultiple ? (record.multipleEntries?.[groupIndex] || [0]) : [0])

          entries.forEach((entryIndex) => {
            group.fields.forEach((f) => {
              if (!f.required) return
              const key = isArrayType
                ? f.key
                : (group.allowMultiple ? `${f.key}_${entryIndex}` : f.key)
              const value = values[key]
              if (!String(value || '').trim()) {
                const label = isArrayType ? `Record ${recordIndex + 1}` : 'Record'
                errors.push(`${FORM_TITLES[type]} ${label}: ${f.label} is required.`)
              }
            })
          })
        })
      })
    })

    return errors
  }, [allFormData])

  const getPrimaryName = (type, values) => {
    if (type === 'company-profile') return values.companyName || 'Company Profile'
    if (type === 'customer-profile') return values.customerName || 'Customer Profile'
    if (type === 'consignee-profile') return values.consigneeName || 'Consignee Profile'
    if (type === 'payer-profile') return values.payerName || 'Payer Profile'
    if (type === 'employee-profile') return values.nameOfEmployee || 'Employee Profile'
    if (type === 'payment-terms') return values.termName || 'Payment Terms'
    return FORM_TITLES[type] || 'Master Data'
  }

  return (
    <div className="md-form-page">
      {/* Breadcrumb */}
      <button
        type="button"
        onClick={() => {
          if (draftCompanyId) {
            navigate(`/master-data/new?draftId=${draftCompanyId}`)
          } else {
            navigate('/master-data/new')
          }
        }}
        className="md-form-breadcrumb"
      >
        <ArrowLeft className="md-form-breadcrumb-icon" />
        Back to Index
      </button>

      {/* Page Header */}
      <div className="md-form-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <div className="md-form-eyebrow">Step 7</div>
            <h1 className="md-form-title">Review Draft Master Data</h1>
            <p className="md-form-description">Review the saved draft records before final submission.</p>
          </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={collapseAllSections}
                className="md-form-button md-form-button-secondary"
                disabled={loading || visibleTypes.length === 0}
                title="Collapse all sections"
              >
                Collapse All
              </button>
              <button
                type="button"
                onClick={expandAllSections}
                className="md-form-button md-form-button-secondary"
                disabled={loading || visibleTypes.length === 0}
                title="Expand all sections"
              >
                Expand All
              </button>
              <button
                type="button"
                onClick={loadFormData}
                className="md-form-button md-form-button-secondary"
                disabled={loading}
                title="Refresh data to show latest records"
              >
                <RefreshCw className={`md-form-button-icon ${loading ? 'animate-spin' : ''}`} style={{ width: '16px', height: '16px' }} />
                <span>Refresh</span>
              </button>
            </div>
        </div>
      </div>

      {/* Review Container */}
      <div className="md-form-container">
        {loading ? (
          <div className="md-form-review-empty">
            <p>Loading review data...</p>
          </div>
        ) : !hasAnyData ? (
          <div className="md-form-review-empty">
            <AlertTriangle className="md-form-review-empty-icon" />
            <h3 className="md-form-review-empty-title">No Master Data Records Yet</h3>
            <p className="md-form-review-empty-description">
              Start the wizard and save draft steps to review here.
            </p>
            <button
              type="button"
              className="md-form-button md-form-button-primary"
              onClick={() => navigate('/master-data/new')}
            >
              Create New Master Data
            </button>
          </div>
        ) : (
          <>
            <div className="md-form-review-body">
              {visibleTypes.map((type) => {
                const records = allFormData[type]
                const isExpanded = expandedSections[type]
                if (!records || !Array.isArray(records) || records.length === 0) return null

                return (
                  <div key={type} className="md-form-review-section">
                    <div className="md-form-review-section-header">
                      <button
                        type="button"
                        onClick={() => toggleSection(type)}
                        className="md-form-review-section-edit"
                        style={{ padding: '0.45rem 0.65rem' }}
                        aria-expanded={Boolean(isExpanded)}
                        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${FORM_TITLES[type]}`}
                      >
                        {isExpanded ? <ChevronDown className="md-form-review-section-edit-icon" /> : <ChevronRight className="md-form-review-section-edit-icon" />}
                        <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
                      </button>
                      <h3 className="md-form-review-section-title">
                        {FORM_TITLES[type]}
                        <span style={{ marginLeft: '12px', fontSize: '14px', fontWeight: 'normal', color: 'var(--color-text-tertiary)' }}>
                          ({records.length} {records.length === 1 ? 'record' : 'records'})
                        </span>
                      </h3>
                    </div>

                    {/* Render records only when expanded to reduce scroll */}
                    {isExpanded && records.map((formData, recordIndex) => {
                      const { values, logoPreviews, groups, id } = formData
                      const primaryName = getPrimaryName(type, values)

                      return (
                        <div key={id || recordIndex} className="md-form-review-record" style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-bg-secondary)' }}>
                          <div className="md-form-review-record-header" style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border-light)' }}>
                            <span className="md-form-review-section-primary" style={{ fontSize: '1rem', fontWeight: 600 }}>
                              {primaryName}
                            </span>
                            <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginLeft: '12px' }}>
                              Record #{recordIndex + 1}
                            </span>
                          </div>

                          {logoPreviews && logoPreviews.logo && (
                            <div className="md-form-review-section-logo" style={{ marginBottom: '1rem' }}>
                              <img src={logoPreviews.logo} alt="Logo" className="md-form-review-section-logo-image" />
                            </div>
                          )}

                          {groups && groups.length > 0 ? (
                            groups.map((group, groupIndex) => {
                              const entries = group.allowMultiple ? (formData.multipleEntries?.[groupIndex] || [0]) : [0]
                              
                              return (
                                <div key={groupIndex} className="md-form-review-group">
                                  <h4 className="md-form-review-group-title">{group.title}</h4>
                                  {entries.map((entryIndex) => (
                                    <div key={entryIndex} className="md-form-review-entry">
                                      {group.fields.map((f) => {
                                        const fieldKey = group.allowMultiple ? `${f.key}_${entryIndex}` : f.key
                                        const value = values[fieldKey] ?? values[f.key]
                                        const preview = logoPreviews?.[fieldKey] ?? logoPreviews?.[f.key]
                                        const otherValue = values[`${fieldKey}Other`] ?? values[`${f.key}Other`]
                                        
                                        if (!value && !preview) return null
                                        
                                        return (
                                          <div key={fieldKey} className="md-form-review-field">
                                            <span className="md-form-review-label">{f.label}:</span>
                                            <span className="md-form-review-value">
                                              {f.type === 'file' && preview ? (
                                                <img src={preview} alt="Preview" className="md-form-review-image" />
                                              ) : f.type === 'select' && value === 'Other' ? (
                                                otherValue || value
                                              ) : (
                                                String(value || '')
                                              )}
                                            </span>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  ))}
                                </div>
                              )
                            })
                          ) : (
                            <div className="md-form-review-group">
                              {Object.keys(values).filter(key => !key.includes('_') || key.match(/^[^_]+$/)).map((key) => {
                                const value = values[key]
                                const preview = logoPreviews?.[key]
                                if (!value && !preview) return null
                                
                                return (
                                  <div key={key} className="md-form-review-field">
                                    <span className="md-form-review-label">{key}:</span>
                                    <span className="md-form-review-value">
                                      {preview ? (
                                        <img src={preview} alt="Preview" className="md-form-review-image" />
                                      ) : (
                                        String(value || '')
                                      )}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>

            {submitStatus.kind !== 'idle' && (
              <div className={`md-form-status md-form-status-${submitStatus.kind}`}>
                <span>{submitStatus.message}</span>
                {submitStatus.errors && submitStatus.errors.length > 0 && (
                  <ul style={{ margin: '0.5rem 0 0 1.25rem', padding: 0 }}>
                    {submitStatus.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="md-form-actions">
              {isWizardFlow && draftCompanyId && wizardReviewPrevStepKey && (
                <button
                  type="button"
                  className="md-form-button md-form-button-secondary"
                  style={{ marginRight: 'auto' }}
                  onClick={() =>
                    navigate(
                      `/master-data/new/${wizardReviewPrevStepKey}?draftId=${draftCompanyId}&flow=wizard`
                    )
                  }
                >
                  Previous
                </button>
              )}
              <button
                type="button"
                className="md-form-button md-form-button-secondary"
                onClick={() => navigate('/master-data')}
              >
                Back to Master Data
              </button>
              <button
                type="button"
                className="md-form-button md-form-button-secondary"
                onClick={() => {
                  if (draftCompanyId) {
                    navigate(`/master-data/new?draftId=${draftCompanyId}`)
                  } else {
                    navigate('/master-data/new')
                  }
                }}
              >
                Back to Index
              </button>
              <div style={{ flex: 1 }} />
              <button
                type="button"
                className="md-form-button md-form-button-primary"
                onClick={async () => {
                  try {
                    setSubmitStatus({ kind: 'idle', message: '' })
                    const errors = validateDraft()
                    if (errors.length) {
                      setSubmitStatus({
                        kind: 'error',
                        message: errors.length === 1 ? errors[0] : `Please fix ${errors.length} issues:`,
                        errors,
                      })
                      return
                    }
                    if (!draftCompanyId) {
                      setSubmitStatus({ kind: 'error', message: 'Draft not found. Please restart the wizard.' })
                      return
                    }
                    await masterDataService.publishDraftMasterData(draftCompanyId)
                    window.dispatchEvent(new Event('masterDataUpdated'))
                    setSubmitStatus({ kind: 'success', message: 'Draft published successfully.' })
                    navigate('/master-data')
                  } catch (error) {
                    console.error('[MasterDataReview] Failed to publish draft:', error)
                    setSubmitStatus({ kind: 'error', message: 'Failed to publish draft. Please try again.' })
                  }
                }}
              >
                Final Submit
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default MasterDataReview

