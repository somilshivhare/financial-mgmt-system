import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowLeft,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import * as masterDataService from '../services/masterDataService'
import '../styles/MasterData.css'

const FORM_TYPES = ['company-profile', 'customer-profile', 'consignee-profile', 'payer-profile', 'employee-profile', 'payment-terms']

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

  /**
   * Load all form data from backend (all records for each type)
   * CRITICAL: This function fetches fresh data from the backend
   * Ensures Review page always shows the latest master data records
   */
  const loadFormData = useCallback(async () => {
    try {
      setLoading(true)
      // Clear existing data first to ensure fresh start
      setAllFormData({})
      
      const formData = {}
      
      // Fetch all records for each form type from backend
      const loadPromises = FORM_TYPES.map(async (type) => {
        try {
          const records = await masterDataService.getMasterDataByType(type)
          if (records && records.length > 0) {
            // Store all records, not just the latest
            formData[type] = records.map(record => ({
              id: record.id,
              type,
              title: FORM_TITLES[type],
              values: record.values || {},
              logoPreviews: record.values?.logoPreviews || record.logoPreviews || {},
              groups: [], // Groups structure not stored in backend
              multipleEntries: {},
              savedAt: record.created_at || record.updated_at || new Date().toISOString(),
            }))
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
  }, [])

  useEffect(() => {
    // Always reload data when navigating to Review page
    // This ensures fresh data is displayed, especially after creating new records
    if (location.pathname === '/master-data/review') {
      loadFormData()
    }
  }, [location.pathname, loadFormData])

  useEffect(() => {
    // Initial load
    loadFormData()
    
    // Listen for updates when new master data is created/saved
    const handleUpdate = () => {
      // Reload data when master data is updated
      loadFormData()
    }
    
    // Also refresh when page becomes visible (user navigates back)
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
        onClick={() => navigate('/master-data/new')}
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
            <h1 className="md-form-title">Review All Master Data</h1>
            <p className="md-form-description">Review all saved master data records. You can continue creating new records at any time.</p>
          </div>
          <button
            type="button"
            onClick={loadFormData}
            className="md-form-button md-form-button-secondary"
            disabled={loading}
            style={{ marginTop: '0.5rem', whiteSpace: 'nowrap' }}
            title="Refresh data to show latest records"
          >
            <RefreshCw className={`md-form-button-icon ${loading ? 'animate-spin' : ''}`} style={{ width: '16px', height: '16px' }} />
            <span>Refresh</span>
          </button>
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
              Create your first master data record to see it displayed here. You can create multiple records of each type.
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
              {FORM_TYPES.map((type) => {
                const records = allFormData[type]
                if (!records || !Array.isArray(records) || records.length === 0) return null

                return (
                  <div key={type} className="md-form-review-section">
                    <div className="md-form-review-section-header">
                      <h3 className="md-form-review-section-title">
                        {FORM_TITLES[type]}
                        <span style={{ marginLeft: '12px', fontSize: '14px', fontWeight: 'normal', color: 'var(--color-text-tertiary)' }}>
                          ({records.length} {records.length === 1 ? 'record' : 'records'})
                        </span>
                      </h3>
                    </div>

                    {/* Render all records for this type */}
                    {records.map((formData, recordIndex) => {
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
                                        const value = values[fieldKey]
                                        const preview = logoPreviews?.[fieldKey]
                                        
                                        if (!value && !preview) return null
                                        
                                        return (
                                          <div key={fieldKey} className="md-form-review-field">
                                            <span className="md-form-review-label">{f.label}:</span>
                                            <span className="md-form-review-value">
                                              {f.type === 'file' && preview ? (
                                                <img src={preview} alt="Preview" className="md-form-review-image" />
                                              ) : f.type === 'select' && value === 'Other' ? (
                                                values[`${fieldKey}Other`] || value
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
                            // Fallback: show all values if groups structure not available
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

            {/* Action Buttons */}
            <div className="md-form-actions">
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
                onClick={() => navigate('/master-data/new')}
              >
                Create New Record
              </button>
              <div style={{ flex: 1 }} />
              <div style={{ padding: '0.75rem 1rem', backgroundColor: '#eff6ff', border: '1px solid #3b82f6', borderRadius: '6px', color: '#1e40af', fontSize: '14px' }}>
                <strong>Review Mode:</strong> This page shows all saved master data records. You can create new records at any time.
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default MasterDataReview

