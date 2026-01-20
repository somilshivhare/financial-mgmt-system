import { useMemo, useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Plus,
  X,
  Eye,
  Edit,
} from 'lucide-react'
import { COUNTRIES, INDIA_STATES } from '../utils/indiaStates'
import '../styles/MasterData.css'

const FORM_DEFS = {
  'company-profile': {
    title: 'Company Profile',
    description: 'Create or update your organization master details.',
    groups: [
      {
        title: 'Company Information',
        fields: [
          { key: 'logo', label: 'Logo', type: 'file', accept: 'image/*' },
          { key: 'companyName', label: 'Company Name / Legal Entity Name', type: 'text', required: true },
        ],
      },
      {
        title: 'Corporate Office Address',
        fields: [
          { key: 'corporateOfficeAddress', label: 'Corporate Office Address', type: 'textarea' },
          { key: 'corporateDistrict', label: 'District', type: 'text' },
          { key: 'corporateState', label: 'State', type: 'state' },
          { key: 'corporateCountry', label: 'Country', type: 'country' },
          { key: 'corporatePinCode', label: 'Pin Code', type: 'text' },
        ],
      },
      {
        title: 'Correspondence Address',
        fields: [
          { key: 'correspondenceAddress', label: 'Correspondence Address', type: 'textarea' },
          { key: 'correspondenceDistrict', label: 'District', type: 'text' },
          { key: 'correspondenceState', label: 'State', type: 'state' },
          { key: 'correspondenceCountry', label: 'Country', type: 'country' },
          { key: 'correspondencePinCode', label: 'Pin Code', type: 'text' },
        ],
      },
      {
        title: 'Other Office / Plant Details',
        allowMultiple: true,
        fields: [
          { key: 'officeType', label: 'Other Office / Plant Details', type: 'select', options: ['Plant Address', 'Site Office', 'Marketing Office', 'Other'] },
          { key: 'otherOfficeAddress', label: 'Address', type: 'textarea' },
          { key: 'otherOfficeGST', label: 'GST No', type: 'text' },
          { key: 'otherOfficeDistrict', label: 'District', type: 'text' },
          { key: 'otherOfficeState', label: 'State', type: 'state' },
          { key: 'otherOfficeCountry', label: 'Country', type: 'country' },
          { key: 'otherOfficePinCode', label: 'Pin Code', type: 'text' },
        ],
      },
      {
        title: 'Contact Information',
        fields: [
          { key: 'contactPersonName', label: 'Contact Person Name', type: 'text' },
          { key: 'contactNumber', label: 'Contact Number', type: 'tel' },
          { key: 'emailId', label: 'Email ID', type: 'email' },
        ],
      },
    ],
  },
  'customer-profile': {
    title: 'Customer Profile',
    description: 'Maintain customer master for invoicing and follow-ups.',
    groups: [
      {
        title: 'Customer Information',
        fields: [
          { key: 'logo', label: 'Logo', type: 'file', accept: 'image/*' },
          { key: 'customerName', label: 'Customer Name', type: 'text', required: true },
          { key: 'legalEntityName', label: 'Legal Entity Name', type: 'text' },
        ],
      },
      {
        title: 'Corporate Office Address',
        allowMultiple: true,
        fields: [
          { key: 'corporateOfficeAddress', label: 'Corporate Office Address', type: 'textarea' },
        ],
      },
      {
        title: 'Correspondence Address',
        allowMultiple: true,
        fields: [
          { key: 'correspondenceAddress', label: 'Correspondence Address', type: 'textarea' },
          { key: 'district', label: 'District', type: 'text' },
          { key: 'state', label: 'State', type: 'state' },
          { key: 'country', label: 'Country', type: 'country' },
          { key: 'pinCode', label: 'Pin Code', type: 'text' },
        ],
      },
      {
        title: 'Business Details',
        fields: [
          { key: 'segment', label: 'Segment', type: 'select', options: ['Domestic', 'Export', 'Other'] },
          { key: 'gstNo', label: 'GST No', type: 'text' },
        ],
      },
      {
        title: 'Contact Information',
        fields: [
          { key: 'poIssuingAuthority', label: 'PO Issuing Authority / Contact Person Name', type: 'text' },
          { key: 'designation', label: 'Designation', type: 'text' },
          { key: 'contactPersonContactNo', label: 'Contact Person Contact No', type: 'tel' },
          { key: 'emailId', label: 'Email ID', type: 'email' },
        ],
      },
    ],
  },
  'consignee-profile': {
    title: 'Consignee Profile',
    description: 'Ship-to location master for delivery and compliance.',
    groups: [
      {
        title: 'Consignee Information',
        fields: [
          { key: 'logo', label: 'Logo', type: 'file', accept: 'image/*' },
          { key: 'consigneeName', label: 'Consignee Name', type: 'text', required: true },
        ],
      },
      {
        title: 'Consignee Address',
        allowMultiple: true,
        fields: [
          { key: 'consigneeAddress', label: 'Consignee Address', type: 'textarea' },
        ],
      },
      {
        title: 'Customer Details',
        fields: [
          { key: 'customerName', label: 'Customer Name', type: 'text' },
          { key: 'legalEntityName', label: 'Legal Entity Name', type: 'text' },
        ],
      },
      {
        title: 'Location Details',
        fields: [
          { key: 'city', label: 'City', type: 'text' },
          { key: 'state', label: 'State', type: 'state' },
          { key: 'consigneeGSTNo', label: 'Consignee GST No', type: 'text' },
        ],
      },
      {
        title: 'Contact Information',
        fields: [
          { key: 'contactPersonName', label: 'Contact Person Name', type: 'text' },
          { key: 'designation', label: 'Designation', type: 'text' },
          { key: 'contactPersonContactNo', label: 'Contact Person Contact No', type: 'tel' },
          { key: 'emailId', label: 'Email ID', type: 'email' },
        ],
      },
    ],
  },
  'payer-profile': {
    title: 'Payer Profile',
    description: 'Bill-to party master for payments and credit control.',
    groups: [
      {
        title: 'Payer Information',
        fields: [
          { key: 'logo', label: 'Logo', type: 'file', accept: 'image/*' },
          { key: 'payerName', label: 'Payer Name', type: 'text', required: true },
        ],
      },
      {
        title: 'Payer Address',
        allowMultiple: true,
        fields: [
          { key: 'payerAddress', label: 'Payer Address', type: 'textarea' },
        ],
      },
      {
        title: 'Customer Details',
        fields: [
          { key: 'customerName', label: 'Customer Name', type: 'text' },
          { key: 'legalEntityName', label: 'Legal Entity Name', type: 'text' },
        ],
      },
      {
        title: 'Location Details',
        fields: [
          { key: 'city', label: 'City', type: 'text' },
          { key: 'state', label: 'State', type: 'state' },
          { key: 'payerGSTNo', label: 'Payer GST No', type: 'text' },
        ],
      },
      {
        title: 'Contact Information',
        fields: [
          { key: 'contactPersonName', label: 'Contact Person Name', type: 'text' },
          { key: 'designation', label: 'Designation', type: 'text' },
          { key: 'contactPersonContactNo', label: 'Contact Person Contact No', type: 'tel' },
          { key: 'emailId', label: 'Email ID', type: 'email' },
        ],
      },
    ],
  },
  'employee-profile': {
    title: 'Employee Profile',
    description: 'Employee master for sales operations and approvals.',
    groups: [
      {
        title: 'Role & Identity',
        allowMultiple: true,
        fields: [
          { key: 'role', label: 'Role', type: 'select', options: ['Sales Manager', 'Sales Head', 'Business Head', 'Collection Incharge', 'Sales Agent', 'Collection Agent', 'Project Manager', 'Project Head', 'Other'] },
          { key: 'photo', label: 'Photo', type: 'file', accept: 'image/*' },
          { key: 'nameOfEmployee', label: 'Name of Employee', type: 'text', required: true },
          { key: 'designation', label: 'Designation', type: 'text' },
        ],
      },
      {
        title: 'Contact Information',
        allowMultiple: true,
        fields: [
          { key: 'contactNo', label: 'Contact No', type: 'tel' },
          { key: 'emailId', label: 'Email ID', type: 'email' },
        ],
      },
      {
        title: 'Employment Details',
        fields: [
          { key: 'department', label: 'Department', type: 'text' },
          { key: 'jobRole', label: 'Job Role', type: 'text' },
        ],
      },
    ],
  },
  'payment-terms': {
    title: 'Payment Terms',
    description: 'Define payment terms used across invoices and contracts.',
    groups: [
      {
        title: 'Payment Structure',
        fields: [
          { key: 'basic', label: 'Basic', type: 'number' },
          { key: 'freight', label: 'Freight', type: 'number' },
          { key: 'taxes', label: 'Taxes', type: 'number' },
        ],
      },
      {
        title: 'Due Dates',
        fields: [
          { key: 'firstDue', label: '1st Due', type: 'number' },
          { key: 'secondDue', label: '2nd Due', type: 'number' },
          { key: 'thirdDue', label: '3rd Due', type: 'number' },
          { key: 'finalDue', label: 'Final Due', type: 'number' },
        ],
      },
      {
        title: 'Description',
        fields: [
          { key: 'paymentTermsDescription', label: 'Payment Terms Description', type: 'textarea' },
        ],
      },
    ],
  },
}

function MasterDataForm() {
  const navigate = useNavigate()
  const { type } = useParams()

  const def = FORM_DEFS[type]
  const [values, setValues] = useState({})
  const [status, setStatus] = useState({ kind: 'idle', message: '' })
  const [multipleEntries, setMultipleEntries] = useState({})
  const [logoPreviews, setLogoPreviews] = useState({})
  const [showReview, setShowReview] = useState(false)

  const title = def?.title || 'Master Data'
  const description = def?.description || 'Fill the form to continue.'

  // Initialize multiple entries for groups that allow it
  useEffect(() => {
    if (!def) return
    const initialEntries = {}
    def.groups.forEach((group, groupIndex) => {
      if (group.allowMultiple) {
        initialEntries[groupIndex] = [0] // Start with one entry
      }
    })
    setMultipleEntries(initialEntries)
  }, [def])

  const requiredMissing = useMemo(() => {
    if (!def) return false
    return def.groups.some((group, groupIndex) => {
      const entries = group.allowMultiple ? (multipleEntries[groupIndex] || [0]) : [0]
      return entries.some((entryIndex) =>
        group.fields.some((f) => {
          const key = group.allowMultiple ? `${f.key}_${entryIndex}` : f.key
          return f.required && !String(values[key] || '').trim()
        })
      )
    })
  }, [def, values, multipleEntries])

  const onChange = (key, next, entryIndex = null) => {
    const finalKey = entryIndex !== null ? `${key}_${entryIndex}` : key
    setValues((prev) => ({ ...prev, [finalKey]: next }))
    setStatus({ kind: 'idle', message: '' })
  }

  const onFileChange = (key, file, entryIndex = null) => {
    const finalKey = entryIndex !== null ? `${key}_${entryIndex}` : key
    setValues((prev) => ({ ...prev, [finalKey]: file }))
    setStatus({ kind: 'idle', message: '' })
    
    // Create preview for logo/photo files
    if (file && (key === 'logo' || key === 'photo')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreviews((prev) => ({ ...prev, [finalKey]: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const getStateOptions = (stateKey, entryIndex = null, groupFields = []) => {
    // Find corresponding country field in the same group
    const countryField = groupFields.find(f => 
      (f.key.includes('Country') || f.key.includes('country')) &&
      (stateKey.includes('State') || stateKey.includes('state')) &&
      stateKey.replace('State', '').replace('state', '') === f.key.replace('Country', '').replace('country', '')
    )
    
    if (!countryField) return []
    
    const countryFieldKey = entryIndex !== null ? `${countryField.key}_${entryIndex}` : countryField.key
    const selectedCountry = values[countryFieldKey]
    return selectedCountry === 'India' ? INDIA_STATES : []
  }

  const handleAddEntry = (groupIndex) => {
    setMultipleEntries((prev) => {
      const currentEntries = prev[groupIndex] || [0]
      const newIndex = Math.max(...currentEntries) + 1
      return {
        ...prev,
        [groupIndex]: [...currentEntries, newIndex],
      }
    })
  }

  const handleRemoveEntry = (groupIndex, entryIndex) => {
    setMultipleEntries((prev) => {
      const currentEntries = prev[groupIndex] || [0]
      const newEntries = currentEntries.filter((idx) => idx !== entryIndex)
      
      // Remove values for this entry
      const group = def.groups[groupIndex]
      group.fields.forEach((f) => {
        const key = `${f.key}_${entryIndex}`
        setValues((prevValues) => {
          const newValues = { ...prevValues }
          delete newValues[key]
          return newValues
        })
      })
      
      return {
        ...prev,
        [groupIndex]: newEntries.length > 0 ? newEntries : [0],
      }
    })
  }

  const handleReview = () => {
    if (requiredMissing) {
      setStatus({ kind: 'error', message: 'Please fill all required fields.' })
      return
    }
    
    // Save current form data before showing review
    const formData = {
      type,
      title: def.title,
      values,
      logoPreviews,
      groups: def.groups,
      multipleEntries,
      savedAt: new Date().toISOString(),
    }
    localStorage.setItem(`masterDataForm_${type}`, JSON.stringify(formData))
    
    setShowReview(true)
  }

  const handleEdit = () => {
    setShowReview(false)
  }

  const handleSaveAndContinue = () => {
    // Save current form and navigate to next form or review
    const formData = {
      type,
      title: def.title,
      values,
      logoPreviews,
      groups: def.groups,
      multipleEntries,
      savedAt: new Date().toISOString(),
    }
    localStorage.setItem(`masterDataForm_${type}`, JSON.stringify(formData))
    setStatus({ kind: 'success', message: 'Form saved! You can continue with other forms.' })
  }

  const onSubmit = (e) => {
    e.preventDefault()
    if (!def) return

    if (requiredMissing) {
      setStatus({ kind: 'error', message: 'Please fill all required fields.' })
      return
    }

    // Save form data to localStorage for review step
    const formData = {
      type,
      title: def.title,
      values,
      logoPreviews,
      groups: def.groups,
      multipleEntries,
      savedAt: new Date().toISOString(),
    }
    
    localStorage.setItem(`masterDataForm_${type}`, JSON.stringify(formData))

    setStatus({ kind: 'success', message: 'Form saved! Proceed to Review & Submit to finalize.' })
    setTimeout(() => {
      setStatus({ kind: 'idle', message: '' })
    }, 2000)
  }

  if (!def) {
    return (
      <div className="md-form-error-container">
        <h1 className="md-form-error-title">Unknown Master Data Type</h1>
        <p className="md-form-error-description">The selected module does not exist.</p>
        <button
          type="button"
          className="md-form-error-button"
          onClick={() => navigate('/master-data/new')}
        >
          Go back
        </button>
      </div>
    )
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
        <div className="md-form-eyebrow">{title}</div>
        <h1 className="md-form-title">Create {title}</h1>
        <p className="md-form-description">{description}</p>
      </div>

      {/* Review Step */}
      {showReview ? (
        <div className="md-form-container">
          <div className="md-form-review-header">
            <h2 className="md-form-review-title">Review & Submit</h2>
            <p className="md-form-review-description">Please review all information before submitting.</p>
          </div>
          <div className="md-form-review-body">
            {def.groups.map((group, groupIndex) => {
              const entries = group.allowMultiple ? (multipleEntries[groupIndex] || [0]) : [0]
              return (
                <div key={groupIndex} className="md-form-review-group">
                  <h3 className="md-form-review-group-title">{group.title}</h3>
                  {entries.map((entryIndex) => (
                    <div key={entryIndex} className="md-form-review-entry">
                      {group.fields.map((f) => {
                        const fieldKey = group.allowMultiple ? `${f.key}_${entryIndex}` : f.key
                        const value = values[fieldKey]
                        const preview = logoPreviews[fieldKey]
                        
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
            })}
          </div>
          <div className="md-form-actions">
            <button
              type="button"
              className="md-form-button md-form-button-secondary"
              onClick={handleEdit}
            >
              <Edit className="md-form-button-icon" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              className="md-form-button md-form-button-primary"
              onClick={onSubmit}
            >
              Submit
            </button>
          </div>
        </div>
      ) : (
        /* Form Container */
        <form className="md-form-container" onSubmit={(e) => { e.preventDefault(); handleReview(); }}>
        <div className="md-form-body">
          {def.groups.map((group, groupIndex) => {
            const entries = group.allowMultiple ? (multipleEntries[groupIndex] || [0]) : [0]
            
            return (
              <div key={groupIndex} className="md-form-group">
                {group.title && (
                  <div className="md-form-group-title">{group.title}</div>
                )}
                
                {entries.map((entryIndex, entryArrayIndex) => (
                  <div key={entryIndex} className="md-form-entry-block">
                    {group.allowMultiple && entries.length > 1 && (
                      <div className="md-form-entry-header">
                        <span className="md-form-entry-number">Entry {entryArrayIndex + 1}</span>
                        <button
                          type="button"
                          className="md-form-entry-remove"
                          onClick={() => handleRemoveEntry(groupIndex, entryIndex)}
                          aria-label="Remove entry"
                        >
                          <X className="md-form-entry-remove-icon" />
                        </button>
                      </div>
                    )}
                    
                    <div className="md-form-grid">
                      {group.fields.map((f) => {
                        const fieldKey = group.allowMultiple ? `${f.key}_${entryIndex}` : f.key
                        const fieldId = `${f.key}_${entryIndex}`
                        
                        return (
                          <div
                            key={fieldKey}
                            className={`md-form-field ${f.type === 'textarea' || f.type === 'file' ? 'md-form-field-full' : ''}`}
                          >
                            <label className="md-form-label" htmlFor={fieldId}>
                              {f.label}
                              {f.required && <span className="md-form-required">*</span>}
                            </label>
                            {f.type === 'file' ? (
                              <div className="md-form-logo-viewer">
                                {logoPreviews[fieldKey] ? (
                                  <div className="md-form-logo-preview">
                                    <img src={logoPreviews[fieldKey]} alt="Preview" className="md-form-logo-image" />
                                    <button
                                      type="button"
                                      className="md-form-logo-remove"
                                      onClick={() => {
                                        setValues((prev) => {
                                          const newValues = { ...prev }
                                          delete newValues[fieldKey]
                                          return newValues
                                        })
                                        setLogoPreviews((prev) => {
                                          const newPreviews = { ...prev }
                                          delete newPreviews[fieldKey]
                                          return newPreviews
                                        })
                                      }}
                                    >
                                      <X className="md-form-logo-remove-icon" />
                                    </button>
                                  </div>
                                ) : (
                                  <label htmlFor={fieldId} className="md-form-logo-upload">
                                    <div className="md-form-logo-upload-icon">
                                      <Plus />
                                    </div>
                                    <span className="md-form-logo-upload-text">Upload {f.label}</span>
                                    <input
                                      id={fieldId}
                                      className="md-form-file-input"
                                      type="file"
                                      accept={f.accept}
                                      onChange={(e) => onFileChange(f.key, e.target.files[0], group.allowMultiple ? entryIndex : null)}
                                    />
                                  </label>
                                )}
                              </div>
                            ) : f.type === 'country' ? (
                              <select
                                id={fieldId}
                                className="md-form-select"
                                value={values[fieldKey] || ''}
                                onChange={(e) => {
                                  onChange(f.key, e.target.value, group.allowMultiple ? entryIndex : null)
                                  // Clear state when country changes - find state field in same group
                                  const stateField = group.fields.find(field => 
                                    (field.key.includes('State') || field.key.includes('state')) &&
                                    f.key.replace('Country', '').replace('country', '') === field.key.replace('State', '').replace('state', '')
                                  )
                                  if (stateField) {
                                    const stateFieldKey = group.allowMultiple ? `${stateField.key}_${entryIndex}` : stateField.key
                                    onChange(stateField.key, '', group.allowMultiple ? entryIndex : null)
                                  }
                                }}
                              >
                                <option value="">Select country...</option>
                                {COUNTRIES.map((country) => (
                                  <option key={country} value={country}>
                                    {country}
                                  </option>
                                ))}
                              </select>
                            ) : f.type === 'state' ? (
                              <select
                                id={fieldId}
                                className="md-form-select"
                                value={values[fieldKey] || ''}
                                onChange={(e) => onChange(f.key, e.target.value, group.allowMultiple ? entryIndex : null)}
                                disabled={!getStateOptions(f.key, group.allowMultiple ? entryIndex : null, group.fields).length}
                              >
                                <option value="">Select state...</option>
                                {getStateOptions(f.key, group.allowMultiple ? entryIndex : null, group.fields).map((state) => (
                                  <option key={state} value={state}>
                                    {state}
                                  </option>
                                ))}
                              </select>
                            ) : f.type === 'textarea' ? (
                              <textarea
                                id={fieldId}
                                className="md-form-textarea"
                                rows={4}
                                value={values[fieldKey] || ''}
                                onChange={(e) => onChange(f.key, e.target.value, group.allowMultiple ? entryIndex : null)}
                                placeholder={`Enter ${f.label.toLowerCase()}...`}
                              />
                            ) : f.type === 'select' ? (
                              <>
                                <select
                                  id={fieldId}
                                  className="md-form-select"
                                  value={values[fieldKey] || ''}
                                  onChange={(e) => onChange(f.key, e.target.value, group.allowMultiple ? entryIndex : null)}
                                >
                                  <option value="">Select {f.label.toLowerCase()}...</option>
                                  {f.options?.map((option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                                {values[fieldKey] === 'Other' && (
                                  <input
                                    id={`${fieldKey}Other`}
                                    className="md-form-input md-form-input-other"
                                    type="text"
                                    value={values[`${fieldKey}Other`] || ''}
                                    onChange={(e) => onChange(`${f.key}Other`, e.target.value, group.allowMultiple ? entryIndex : null)}
                                    placeholder={`Enter ${f.label.toLowerCase()}...`}
                                  />
                                )}
                              </>
                            ) : (
                              <input
                                id={fieldId}
                                className="md-form-input"
                                type={f.type}
                                value={values[fieldKey] || ''}
                                onChange={(e) => onChange(f.key, e.target.value, group.allowMultiple ? entryIndex : null)}
                                placeholder={`Enter ${f.label.toLowerCase()}...`}
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>
                    
                    {group.allowMultiple && entryArrayIndex < entries.length - 1 && (
                      <div className="md-form-entry-divider" />
                    )}
                  </div>
                ))}
                
                {group.allowMultiple && (
                  <div className="md-form-entry-add-wrapper">
                    <button
                      type="button"
                      className="md-form-button md-form-button-add"
                      onClick={() => handleAddEntry(groupIndex)}
                    >
                      <Plus className="md-form-button-icon" />
                      <span>Add {group.title}</span>
                    </button>
                  </div>
                )}
                
                {groupIndex < def.groups.length - 1 && <div className="md-form-group-divider" />}
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
            className="md-form-button md-form-button-secondary"
            onClick={handleSaveAndContinue}
          >
            Save & Continue
          </button>
          <button
            type="submit"
            className="md-form-button md-form-button-primary"
          >
            Review & Submit
          </button>
        </div>
      </form>
      )}
    </div>
  )
}

export default MasterDataForm
