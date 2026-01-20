import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Edit,
  X,
} from 'lucide-react'
import { useMasterData } from '../contexts/MasterDataContext'
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
  const { saveRecord } = useMasterData()
  const [allFormData, setAllFormData] = useState({})
  const [status, setStatus] = useState({ kind: 'idle', message: '' })

  useEffect(() => {
    // Load all form data from localStorage
    const formData = {}
    FORM_TYPES.forEach((type) => {
      const key = `masterDataForm_${type}`
      const stored = localStorage.getItem(key)
      if (stored) {
        try {
          formData[type] = JSON.parse(stored)
        } catch (error) {
          console.error(`Failed to parse ${type}:`, error)
        }
      }
    })
    setAllFormData(formData)
  }, [])

  const hasAnyData = Object.keys(allFormData).length > 0

  const handleSubmit = () => {
    if (!hasAnyData) {
      setStatus({ kind: 'error', message: 'No data to submit. Please complete at least one form.' })
      return
    }

    try {
      // Save each form type as individual records to centralized Master Data
      Object.keys(allFormData).forEach((type) => {
        const formData = allFormData[type]
        if (formData && formData.values) {
          saveRecord(type, {
            values: formData.values,
            logoPreviews: formData.logoPreviews || {},
            groups: formData.groups,
            multipleEntries: formData.multipleEntries,
          })
        }
      })

      // Clear form data from localStorage
      FORM_TYPES.forEach((type) => {
        localStorage.removeItem(`masterDataForm_${type}`)
      })

      setStatus({ kind: 'success', message: 'All master data saved successfully!' })
      setTimeout(() => navigate('/master-data'), 1500)
    } catch (error) {
      console.error('Failed to submit:', error)
      setStatus({ kind: 'error', message: 'Failed to save data. Please try again.' })
    }
  }

  const getDisplayValue = (value, logoPreviews, key) => {
    if (logoPreviews && logoPreviews[key]) {
      return logoPreviews[key]
    }
    if (typeof value === 'object' && value !== null) {
      return value.name || 'File uploaded'
    }
    return String(value || 'N/A')
  }

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
        <div className="md-form-eyebrow">Step 7</div>
        <h1 className="md-form-title">Review and Submit</h1>
        <p className="md-form-description">Review all master data entries before final submission.</p>
      </div>

      {/* Review Container */}
      <div className="md-form-container">
        {!hasAnyData ? (
          <div className="md-form-review-empty">
            <AlertTriangle className="md-form-review-empty-icon" />
            <h3 className="md-form-review-empty-title">No Data to Review</h3>
            <p className="md-form-review-empty-description">
              Please complete at least one master data form before reviewing.
            </p>
            <button
              type="button"
              className="md-form-button md-form-button-primary"
              onClick={() => navigate('/master-data/new')}
            >
              Go to Forms
            </button>
          </div>
        ) : (
          <>
            <div className="md-form-review-body">
              {FORM_TYPES.map((type) => {
                const formData = allFormData[type]
                if (!formData || !formData.values) return null

                const { values, logoPreviews, groups } = formData
                const primaryName = getPrimaryName(type, values)

                return (
                  <div key={type} className="md-form-review-section">
                    <div className="md-form-review-section-header">
                      <h3 className="md-form-review-section-title">{FORM_TITLES[type]}</h3>
                      <span className="md-form-review-section-primary">{primaryName}</span>
                      <button
                        type="button"
                        className="md-form-review-section-edit"
                        onClick={() => navigate(`/master-data/new/${type}`)}
                      >
                        <Edit className="md-form-review-section-edit-icon" />
                        <span>Edit</span>
                      </button>
                    </div>

                    {logoPreviews && logoPreviews.logo && (
                      <div className="md-form-review-section-logo">
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

            {/* Status Message */}
            {status.kind !== 'idle' && (
              <div className={`md-form-status md-form-status-${status.kind}`}>
                {status.kind === 'success' ? (
                  <CheckCircle2 className="md-form-status-icon" />
                ) : (
                  <AlertTriangle className="md-form-status-icon" />
                )}
                <span>{status.message}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="md-form-actions">
              <button
                type="button"
                className="md-form-button md-form-button-secondary"
                onClick={() => navigate('/master-data')}
              >
                Cancel
              </button>
              <button
                type="button"
                className="md-form-button md-form-button-primary"
                onClick={handleSubmit}
              >
                <CheckCircle2 className="md-form-button-icon" />
                <span>Submit All</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default MasterDataReview

