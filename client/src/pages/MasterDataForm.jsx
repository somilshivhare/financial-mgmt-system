import { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Plus,
  X,
  Zap,
} from 'lucide-react'
import DatePicker from '../components/DatePicker'
import { COUNTRIES, INDIA_STATES } from '../utils/indiaStates'
import { saveMasterDataRecord, updateMasterDataRecord, upsertMasterDataRecord, getMasterDataById, getMasterDataByType, getLatestMasterDataByType } from '../api/masterData'
import '../styles/MasterData.css'
import { FORM_DEFS, FORM_STEPS } from '../utils/masterDataDefs'
import { capLogoPreviewsPayload } from '../utils/logoPayloadHelper'


/**
 * MasterDataForm Component
 * 
 * CRITICAL ISOLATION REQUIREMENTS:
 * - Each master data record is completely independent and isolated
 * - When creating new records (no ID in URL), form starts completely fresh with no prefilled data
 * - No data from previous records is ever reused, merged, auto-linked, or mixed
 * - Each save creates a NEW record (never updates when creating new)
 * - Form persistence is ONLY enabled when editing existing records (ID present)
 * - All steps (Company, Customer, Consignee, etc.) belong only to that specific master data
 * - Each master data generates its own independent card on the Master Data Records page
 */
function MasterDataForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const { type, id } = useParams() // Get ID if editing existing record (null when creating new)
  const isEditMode = !!id
  const [isLocked, setIsLocked] = useState(false)
  const [checkingLock, setCheckingLock] = useState(true)

  const wizardParams = useMemo(() => {
    try {
      const params = new URLSearchParams(location.search)
      return {
        isWizardFlow: params.get('flow') === 'wizard',
        draftId: params.get('draftId') || '',
      }
    } catch {
      return { isWizardFlow: false, draftId: '' }
    }
  }, [location.search])

  const isWizardFlow = wizardParams.isWizardFlow

  const initialCompanyIdFromQuery = useMemo(() => {
    try {
      return new URLSearchParams(location.search).get('companyId') || ''
    } catch {
      return ''
    }
  }, [location.search])

  const [draftCompanyId, setDraftCompanyId] = useState(wizardParams.draftId)
  const [selectedCompanyId, setSelectedCompanyId] = useState(initialCompanyIdFromQuery)
  const [companyOptions, setCompanyOptions] = useState([])
  const [companyOptionsLoading, setCompanyOptionsLoading] = useState(false)

  useEffect(() => {
    setDraftCompanyId(wizardParams.draftId)
  }, [wizardParams.draftId])

  useEffect(() => {
    setDraftRecordId('')
  }, [type, draftCompanyId])

  // Check if step is locked (has been saved)
  // Only lock when editing a specific record (id present) - allow multiple new records
  useEffect(() => {
    const checkLockStatus = async () => {
      // Don't check lock status if editing specific record (id present)
      if (id) {
        setCheckingLock(false)
        setIsLocked(false) // Allow editing when ID is present (explicit edit mode)
        return
      }
      
      // For new records, never lock - allow creating multiple records
      setCheckingLock(false)
      setIsLocked(false)
    }
    
    checkLockStatus()
  }, [type, id, navigate])

  // Load company profiles so non-company modules can be linked to a specific company
  useEffect(() => {
    let cancelled = false

    const loadCompanies = async () => {
      if (!type || type === 'company-profile') return
      if (isWizardFlow && draftCompanyId) {
        try {
          setCompanyOptionsLoading(true)
          const record = await getMasterDataById('company-profile', draftCompanyId)
          if (!cancelled && record?.data) {
            setCompanyOptions([record.data])
            setSelectedCompanyId(draftCompanyId)
          } else if (!cancelled && record?.id) {
            setCompanyOptions([record])
            setSelectedCompanyId(draftCompanyId)
          }
        } catch (error) {
          console.error('[MasterDataForm] Failed to load draft company profile:', error)
          if (!cancelled) setCompanyOptions([])
        } finally {
          if (!cancelled) setCompanyOptionsLoading(false)
        }
        return
      }
      setCompanyOptionsLoading(true)
      try {
        const companies = await getMasterDataByType('company-profile', { status: 'published' })
        if (!cancelled) setCompanyOptions(Array.isArray(companies) ? companies : [])
      } catch (error) {
        console.error('[MasterDataForm] Failed to load company profiles:', error)
        if (!cancelled) setCompanyOptions([])
      } finally {
        if (!cancelled) setCompanyOptionsLoading(false)
      }
    }

    loadCompanies()
    return () => {
      cancelled = true
    }
  }, [type, isWizardFlow, draftCompanyId])

  // When creating a new record, keep selectedCompanyId in sync with ?companyId=...
  useEffect(() => {
    if (!type || type === 'company-profile') return
    if (id) return // edit mode: derive from record
    if (isWizardFlow && draftCompanyId) {
      setSelectedCompanyId(draftCompanyId)
      return
    }
    setSelectedCompanyId(initialCompanyIdFromQuery || '')
  }, [type, id, initialCompanyIdFromQuery, isWizardFlow, draftCompanyId])

  // Validate type exists - prevent crashes
  if (!type || !FORM_DEFS[type]) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Invalid Form Type</h2>
          <p className="text-gray-600 mb-4">The form type "{type}" is not recognized.</p>
          <button
            onClick={() => navigate('/master-data/new')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back to Master Data
          </button>
        </div>
      </div>
    )
  }

  const def = FORM_DEFS[type]
  const [status, setStatus] = useState({ kind: 'idle', message: '' })
  const [values, setValues] = useState({})
  const [multipleEntries, setMultipleEntries] = useState({})
  const [logoPreviews, setLogoPreviews] = useState({})
  const [showSaveOptions, setShowSaveOptions] = useState(false)
  const [savingInProgress, setSavingInProgress] = useState(false)
  const [draftRecordId, setDraftRecordId] = useState('')
  
  // Special state for array-based forms: array of complete objects
  const [consignees, setConsignees] = useState([{ id: 0, recordId: null, values: {}, logoPreviews: {} }])
  const [payers, setPayers] = useState([{ id: 0, recordId: null, values: {}, logoPreviews: {} }])
  const [employees, setEmployees] = useState([{ id: 0, recordId: null, values: {}, logoPreviews: {} }])
  const [paymentTerms, setPaymentTerms] = useState([{ id: 0, recordId: null, values: {} }])

  const title = def?.title || 'Master Data'
  const description = def?.description || 'Fill the form to continue.'
  
  const isConsigneeProfile = type === 'consignee-profile'
  const isPayerProfile = type === 'payer-profile'
  const isEmployeeProfile = type === 'employee-profile'
  const isPaymentTerms = type === 'payment-terms'
  const isArrayBasedForm = isConsigneeProfile || isPayerProfile || isEmployeeProfile || isPaymentTerms

  const parseApiRecord = useCallback((apiResponse) => {
    if (!apiResponse) return null
    if (apiResponse.data && typeof apiResponse.data === 'object') return apiResponse.data
    return apiResponse
  }, [])

  const applyRecordToFormState = useCallback((record) => {
    if (!record || !def) return

    const recordCompanyId = record.companyId || record.company_id || null
    if (recordCompanyId && type !== 'company-profile') {
      setSelectedCompanyId(recordCompanyId)
    }

    const stored = record.values || {}
    const storedLogoPreviews = stored.logoPreviews || {}
    const { logoPreviews: _lp, ...rawValues } = stored

    const normalizeAllowMultiple = (rawVals, rawLogos) => {
      const nextValues = { ...(rawVals || {}) }
      const nextLogoPreviews = { ...(rawLogos || {}) }
      const nextMultipleEntries = {}

      // Index any suffixed keys once: foo_0, foo_1, ...
      const suffixIndexByBase = {}
      const addIndex = (base, idx) => {
        if (!suffixIndexByBase[base]) suffixIndexByBase[base] = new Set()
        suffixIndexByBase[base].add(idx)
      }

      Object.keys(nextValues).forEach((k) => {
        const m = k.match(/^(.*)_(\d+)$/)
        if (m) addIndex(m[1], Number(m[2]))
      })
      Object.keys(nextLogoPreviews).forEach((k) => {
        const m = k.match(/^(.*)_(\d+)$/)
        if (m) addIndex(m[1], Number(m[2]))
      })

      def.groups.forEach((group, groupIndex) => {
        if (!group.allowMultiple) return

        const indices = new Set()

        group.fields.forEach((f) => {
          const basesToCheck = [f.key, `${f.key}Other`]
          basesToCheck.forEach((base) => {
            const found = suffixIndexByBase[base]
            if (found) found.forEach((idx) => indices.add(idx))
          })
        })

        // If no suffixed keys exist, but base keys exist, treat it as entry 0.
        if (indices.size === 0) {
          const hasAnyBase = group.fields.some((f) => (
            nextValues[f.key] !== undefined ||
            nextValues[`${f.key}Other`] !== undefined ||
            nextLogoPreviews[f.key] !== undefined
          ))
          if (hasAnyBase) indices.add(0)
        }

        const sorted = Array.from(indices).sort((a, b) => a - b)
        nextMultipleEntries[groupIndex] = sorted.length > 0 ? sorted : [0]

        // Ensure allowMultiple fields exist as suffixed keys (so UI renders them)
        nextMultipleEntries[groupIndex].forEach((idx) => {
          group.fields.forEach((f) => {
            const suffixedKey = `${f.key}_${idx}`
            const baseKey = f.key
            if (nextValues[suffixedKey] === undefined && idx === 0 && nextValues[baseKey] !== undefined) {
              nextValues[suffixedKey] = nextValues[baseKey]
              delete nextValues[baseKey]
            }

            const suffixedOtherKey = `${f.key}Other_${idx}`
            const baseOtherKey = `${f.key}Other`
            if (nextValues[suffixedOtherKey] === undefined && idx === 0 && nextValues[baseOtherKey] !== undefined) {
              nextValues[suffixedOtherKey] = nextValues[baseOtherKey]
              delete nextValues[baseOtherKey]
            }

            if (nextLogoPreviews[suffixedKey] === undefined && idx === 0 && nextLogoPreviews[baseKey] !== undefined) {
              nextLogoPreviews[suffixedKey] = nextLogoPreviews[baseKey]
              delete nextLogoPreviews[baseKey]
            }
          })
        })
      })

      return { nextValues, nextLogoPreviews, nextMultipleEntries }
    }

    if (isArrayBasedForm) {
      const item = (type === 'payment-terms')
        ? { id: 0, values: rawValues }
        : { id: 0, values: rawValues, logoPreviews: storedLogoPreviews }

      if (isConsigneeProfile) setConsignees([item])
      else if (isPayerProfile) setPayers([item])
      else if (isEmployeeProfile) setEmployees([item])
      else if (isPaymentTerms) setPaymentTerms([item])

      setValues({})
      setLogoPreviews({})
      setMultipleEntries({})
      setStatus({ kind: 'idle', message: '' })
      return
    }

    const { nextValues, nextLogoPreviews, nextMultipleEntries } = normalizeAllowMultiple(rawValues, storedLogoPreviews)
    setValues(nextValues)
    setLogoPreviews(nextLogoPreviews)
    setMultipleEntries(nextMultipleEntries)
    setStatus({ kind: 'idle', message: '' })
  }, [def, isArrayBasedForm, isConsigneeProfile, isPayerProfile, isEmployeeProfile, isPaymentTerms, type])

  // Use ref for logoPreviews to avoid stale closures
  const logoPreviewsRef = useRef(logoPreviews)
  useEffect(() => {
    logoPreviewsRef.current = logoPreviews
  }, [logoPreviews])

  // Track previous type/id to detect navigation to new record
  const prevTypeRef = useRef(type)
  const prevIdRef = useRef(id)
  
  /**
   * RESET LOGIC FOR NEW RECORDS
   * 
   * This effect ensures that when clicking "New Master Data" from any page:
   * 1. The form starts completely fresh with no prefilled data
   * 2. All form state is reset to initial empty values
   * 3. No data from previous records is carried over
   * 4. The reset happens immediately on mount and when type/id changes
   * 
   * This is critical for data isolation - each master data record must be independent
   */
  useEffect(() => {
    const typeChanged = prevTypeRef.current !== type
    const idChanged = prevIdRef.current !== id
    const isNewRecord = !id && type
    
    // Update refs for next comparison
    prevTypeRef.current = type
    prevIdRef.current = id
    
    const isDraftResume = isWizardFlow && draftCompanyId

    // Always reset when creating new (no ID) - don't wait for anything
    // Reset triggers:
    // - On initial mount with no ID (new record)
    // - When type changes and no ID (navigating between form types for new records)
    // - When ID changes from present to absent (switching from edit to create)
    if (isNewRecord && !isDraftResume && (typeChanged || idChanged || !prevTypeRef.current)) {
      // Immediately reset all form state when creating new
      // This ensures a completely fresh start every time "New Master Data" is clicked
      setValues({})
      setLogoPreviews({})
      setMultipleEntries({})
      setStatus({ kind: 'idle', message: '' })
      setShowSaveOptions(false)
      setSavingInProgress(false)
      
      // Reset array-based form states to initial empty state
      if (isConsigneeProfile) {
        setConsignees([{ id: 0, recordId: null, values: {}, logoPreviews: {} }])
      } else if (isPayerProfile) {
        setPayers([{ id: 0, recordId: null, values: {}, logoPreviews: {} }])
      } else if (isEmployeeProfile) {
        setEmployees([{ id: 0, recordId: null, values: {}, logoPreviews: {} }])
      } else if (isPaymentTerms) {
        setPaymentTerms([{ id: 0, recordId: null, values: {} }])
      }
    }
  }, [id, type, isConsigneeProfile, isPayerProfile, isEmployeeProfile, isPaymentTerms, setValues, isWizardFlow, draftCompanyId])
  
  /**
   * CLEANUP: Reset form state when component unmounts
   * 
   * When user navigates away from creating a new record (no ID),
   * clear all form state to ensure fresh start on next mount.
   * This prevents any stale state from persisting between navigations.
   */
  useEffect(() => {
    return () => {
      // Only reset if we were creating a new record (no ID)
      // Don't reset if editing existing record (ID present)
      if (!id) {
        setValues({})
        setLogoPreviews({})
        setMultipleEntries({})
        setStatus({ kind: 'idle', message: '' })
        setShowSaveOptions(false)
        setSavingInProgress(false)
      }
    }
  }, [id, setValues])

  // Initialize multiple entries for groups that allow it (skip for array-based forms)
  // CRITICAL: Only initialize when creating new (no ID) to ensure fresh start
  useEffect(() => {
    if (!def || isArrayBasedForm || id) return // Skip if editing existing record (id present)
    const initialEntries = {}
    def.groups.forEach((group, groupIndex) => {
      if (group.allowMultiple) {
        initialEntries[groupIndex] = [0] // Start with one entry
      }
    })
    setMultipleEntries(initialEntries)
  }, [def, isArrayBasedForm, id])

  /**
   * EDIT MODE PREFILL
   *
   * When an ID is present, we load that exact record and normalize it into the current UI model:
   * - Extract `logoPreviews` from stored values
   * - For allowMultiple groups, rebuild `multipleEntries` indices and ensure suffixed keys exist
   * - For array-based forms, load a single item into the array list (editing one record)
   */
  useEffect(() => {
    if (!id || !def) return

    let cancelled = false

    const loadForEdit = async () => {
      try {
        setStatus({ kind: 'idle', message: 'Loading record for editing...' })
        setShowSaveOptions(false)
        setSavingInProgress(false)

        const resp = await getMasterDataById(type, id)
        const record = parseApiRecord(resp)
        if (!record) return
        if (cancelled) return
        applyRecordToFormState(record)
      } catch (error) {
        console.error(`[MasterDataForm] Failed to load ${type} (ID: ${id}) for edit:`, error)
        if (!cancelled) setStatus({ kind: 'error', message: 'Failed to load record for editing.' })
      }
    }

    loadForEdit()

    return () => {
      cancelled = true
    }
  }, [id, def, type, applyRecordToFormState, parseApiRecord])

  /**
   * DRAFT PREFILL (Wizard flow)
   * Load saved draft data for the current step when resuming a wizard flow.
   */
  useEffect(() => {
    if (!isWizardFlow || !def || id) return

    let cancelled = false

    const loadDraft = async () => {
      try {
        if (!type) return
        if (type !== 'company-profile' && !draftCompanyId) return

        setStatus({ kind: 'idle', message: 'Loading draft data...' })
        setShowSaveOptions(false)
        setSavingInProgress(false)

        if (type === 'company-profile') {
          if (!draftCompanyId) return
          const resp = await getMasterDataById(type, draftCompanyId)
          const record = parseApiRecord(resp)
          if (!record || record.status !== 'draft') return
          if (cancelled) return
          setDraftRecordId(record.id)
          applyRecordToFormState(record)
          return
        }

        if (isArrayBasedForm) {
          const records = await getMasterDataByType(type, { companyId: draftCompanyId, status: 'draft' })
          if (cancelled) return

          if (records.length > 0) {
            const items = records.map((record, index) => {
              const stored = record.values || {}
              const storedLogoPreviews = stored.logoPreviews || {}
              const { logoPreviews: _lp, ...rawValues } = stored
              if (type === 'payment-terms') {
                return { id: index, recordId: record.id, values: rawValues }
              }
              return { id: index, recordId: record.id, values: rawValues, logoPreviews: storedLogoPreviews }
            })

            if (isConsigneeProfile) setConsignees(items)
            else if (isPayerProfile) setPayers(items)
            else if (isEmployeeProfile) setEmployees(items)
            else if (isPaymentTerms) setPaymentTerms(items)
          }
          setStatus({ kind: 'idle', message: '' })
          return
        }

        const latest = await getLatestMasterDataByType(type, { companyId: draftCompanyId, status: 'draft' })
        if (!latest) return
        if (cancelled) return
        setDraftRecordId(latest.id)
        applyRecordToFormState(latest)
      } catch (error) {
        console.error('[MasterDataForm] Failed to load draft data:', error)
        if (!cancelled) setStatus({ kind: 'error', message: 'Failed to load draft data.' })
      }
    }

    loadDraft()

    return () => {
      cancelled = true
    }
  }, [isWizardFlow, def, id, type, draftCompanyId, isArrayBasedForm, isConsigneeProfile, isPayerProfile, isEmployeeProfile, isPaymentTerms, applyRecordToFormState, parseApiRecord])
  
  // Generic handler factory for array-based forms
  const createArrayHandlers = (items, setItems, formType, itemName) => {
    const handleAdd = () => {
      const newId = Math.max(...items.map(item => item.id), -1) + 1
      const newItem = formType === 'payment-terms' 
        ? { id: newId, recordId: null, values: {} }
        : { id: newId, recordId: null, values: {}, logoPreviews: {} }
      setItems(prev => [...prev, newItem])
      
      // Scroll to new item after a brief delay
      setTimeout(() => {
        const element = document.getElementById(`${itemName}-${newId}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
          element.focus()
        }
      }, 100)
    }
    
    const handleRemove = (itemId) => {
      if (items.length === 1) {
        setStatus({ kind: 'error', message: `At least one ${itemName} is required.` })
        return
      }
      setItems(prev => prev.filter(item => item.id !== itemId))
    }
    
    const handleChange = (itemId, key, value) => {
      setItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, values: { ...item.values, [key]: value } }
          : item
      ))
      setStatus({ kind: 'idle', message: '' })
    }
    
    const handleFileChange = (itemId, key, file) => {
      setItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, values: { ...item.values, [key]: file } }
          : item
      ))
      
      // Create preview for ALL file uploads - convert to base64 data URL for database storage
      if (file && file instanceof File) {
        const reader = new FileReader()
        reader.onloadend = () => {
          // Store base64 data URL in logoPreviews for database saving
          setItems(prev => prev.map(item => 
            item.id === itemId 
              ? { ...item, logoPreviews: { ...item.logoPreviews, [key]: reader.result } }
              : item
          ))
        }
        reader.onerror = () => {
          console.error('[MasterDataForm] Failed to read file:', key)
          setStatus({ kind: 'error', message: `Failed to process ${key}. Please try again.` })
        }
        reader.readAsDataURL(file)
      } else if (!file) {
        // Remove preview if file is cleared
        setItems(prev => prev.map(item => 
          item.id === itemId 
            ? { 
                ...item, 
                logoPreviews: Object.fromEntries(
                  Object.entries(item.logoPreviews || {}).filter(([k]) => k !== key)
                )
              }
            : item
        ))
      }
      setStatus({ kind: 'idle', message: '' })
    }
    
    return { handleAdd, handleRemove, handleChange, handleFileChange }
  }
  
  // Consignee-specific handlers
  const consigneeHandlers = createArrayHandlers(consignees, setConsignees, 'consignee-profile', 'consignee')
  const handleAddConsignee = consigneeHandlers.handleAdd
  const handleRemoveConsignee = consigneeHandlers.handleRemove
  const handleConsigneeChange = consigneeHandlers.handleChange
  const handleConsigneeFileChange = consigneeHandlers.handleFileChange
  
  // Payer-specific handlers
  const payerHandlers = createArrayHandlers(payers, setPayers, 'payer-profile', 'payer')
  const handleAddPayer = payerHandlers.handleAdd
  const handleRemovePayer = payerHandlers.handleRemove
  const handlePayerChange = payerHandlers.handleChange
  const handlePayerFileChange = payerHandlers.handleFileChange
  
  // Employee-specific handlers
  const employeeHandlers = createArrayHandlers(employees, setEmployees, 'employee-profile', 'employee')
  const handleAddEmployee = employeeHandlers.handleAdd
  const handleRemoveEmployee = employeeHandlers.handleRemove
  const handleEmployeeChange = employeeHandlers.handleChange
  const handleEmployeeFileChange = employeeHandlers.handleFileChange
  
  // Payment Terms-specific handlers
  const paymentTermsHandlers = createArrayHandlers(paymentTerms, setPaymentTerms, 'payment-terms', 'payment term')
  const handleAddPaymentTerm = paymentTermsHandlers.handleAdd
  const handleRemovePaymentTerm = paymentTermsHandlers.handleRemove
  const handlePaymentTermChange = paymentTermsHandlers.handleChange

  const requiredMissing = useMemo(() => {
    if (!def) return false
    
    // Special handling for array-based forms
    if (isArrayBasedForm) {
      let items = []
      if (isConsigneeProfile) items = consignees
      else if (isPayerProfile) items = payers
      else if (isEmployeeProfile) items = employees
      else if (isPaymentTerms) items = paymentTerms
      
      return items.some(item =>
        def.groups.some(group =>
          group.fields.some(f => 
            f.required && !String(item.values[f.key] || '').trim()
          )
        )
      )
    }
    
    return def.groups.some((group, groupIndex) => {
      const entries = group.allowMultiple ? (multipleEntries[groupIndex] || [0]) : [0]
      return entries.some((entryIndex) =>
        group.fields.some((f) => {
          const key = group.allowMultiple ? `${f.key}_${entryIndex}` : f.key
          return f.required && !String(values[key] || '').trim()
        })
      )
    })
  }, [def, values, multipleEntries, isArrayBasedForm, isConsigneeProfile, isPayerProfile, isEmployeeProfile, isPaymentTerms, consignees, payers, employees, paymentTerms])

  const wizardStepIndex = useMemo(() => {
    return FORM_STEPS.findIndex((step) => step.key === type)
  }, [type])

  const wizardNextStep = useMemo(() => {
    if (wizardStepIndex < 0) return null
    return FORM_STEPS[wizardStepIndex + 1] || null
  }, [wizardStepIndex])

  const buildWizardStepUrl = useCallback((stepKey, nextDraftId) => {
    if (stepKey === 'review-submit') {
      return `/master-data/review?draftId=${nextDraftId}&flow=wizard`
    }
    return `/master-data/new/${stepKey}?draftId=${nextDraftId}&flow=wizard`
  }, [])

  const onChange = (key, next, entryIndex = null) => {
    const finalKey = entryIndex !== null ? `${key}_${entryIndex}` : key
    setValues((prev) => ({ ...prev, [finalKey]: next }))
    setStatus({ kind: 'idle', message: '' })
  }

  const onFileChange = (key, file, entryIndex = null) => {
    const finalKey = entryIndex !== null ? `${key}_${entryIndex}` : key
    setValues((prev) => ({ ...prev, [finalKey]: file }))
    setStatus({ kind: 'idle', message: '' })
    
    // Create preview for ALL file uploads (logo, photo, profilePhoto, etc.)
    // Convert to base64 data URL for database storage
    if (file && file instanceof File) {
      const reader = new FileReader()
      reader.onloadend = () => {
        // Store base64 data URL in logoPreviews for database saving
        setLogoPreviews((prev) => ({ ...prev, [finalKey]: reader.result }))
      }
      reader.onerror = () => {
        console.error('[MasterDataForm] Failed to read file:', key)
        setStatus({ kind: 'error', message: `Failed to process ${key}. Please try again.` })
      }
      reader.readAsDataURL(file)
    } else if (!file) {
      // Remove preview if file is cleared
      setLogoPreviews((prev) => {
        const newPreviews = { ...prev }
        delete newPreviews[finalKey]
        return newPreviews
      })
    }
  }

  const getStateOptions = (stateKey, entryIndex = null, groupFields = [], itemValues = null) => {
    // Find corresponding country field in the same group
    const countryField = groupFields.find(f => 
      (f.key.includes('Country') || f.key.includes('country')) &&
      (stateKey.includes('State') || stateKey.includes('state')) &&
      stateKey.replace('State', '').replace('state', '') === f.key.replace('Country', '').replace('country', '')
    )
    
    if (!countryField) return []
    
    // Use item values if provided, otherwise use regular values
    const selectedCountry = itemValues 
      ? itemValues[countryField.key]
      : (entryIndex !== null ? values[`${countryField.key}_${entryIndex}`] : values[countryField.key])
    return selectedCountry === 'India' ? INDIA_STATES : []
  }

  // Generate sample value for a field based on its type and key
  const generateSampleValue = (field, entryIndex = null) => {
    const key = entryIndex !== null ? `${field.key}_${entryIndex}` : field.key
    const baseValue = field.key.toLowerCase()
    
    // Skip file fields (logo, photo) - they need actual file uploads
    if (field.type === 'file') {
      return null // Don't auto-fill file fields
    }
    
    // Generate values based on field key patterns
    if (field.key.includes('Name') || field.key.includes('name')) {
      if (field.key.includes('Customer') || field.key.includes('customer')) {
        return 'ABC Corporation Pvt Ltd'
      } else if (field.key.includes('Company') || field.key.includes('company')) {
        return 'XYZ Industries Limited'
      } else if (field.key.includes('Legal') || field.key.includes('legal')) {
        return 'ABC Corporation Private Limited'
      } else if (field.key.includes('Consignee') || field.key.includes('consignee')) {
        return 'DEF Logistics Solutions'
      } else if (field.key.includes('Payer') || field.key.includes('payer')) {
        return 'GHI Trading Company'
      } else if (field.key.includes('Employee') || field.key.includes('employee')) {
        return 'Sarah Williams'
      } else if (field.key.includes('Person') || field.key.includes('person')) {
        return 'John Doe'
      } else if (field.key.includes('Transporter') || field.key.includes('transporter')) {
        return 'Fast Track Logistics'
      }
      return 'Sample Name'
    }
    
    if (field.key.includes('Address') || field.key.includes('address')) {
      if (field.key.includes('Corporate') || field.key.includes('corporate')) {
        return '123 Business Park, Sector 5, Noida, Uttar Pradesh 201301'
      } else if (field.key.includes('Correspondence') || field.key.includes('correspondence')) {
        return '456 Corporate Tower, MG Road, Bangalore, Karnataka 560001'
      } else if (field.key.includes('Consignee') || field.key.includes('consignee')) {
        return '321 Warehouse Complex, Industrial Estate, Andheri East, Mumbai, Maharashtra 400093'
      } else if (field.key.includes('Payer') || field.key.includes('payer')) {
        return '654 Commercial Street, T Nagar, Chennai, Tamil Nadu 600017'
      } else if (field.key.includes('Other') || field.key.includes('other')) {
        return '999 Manufacturing Unit, Industrial Zone, Pune, Maharashtra 411014'
      }
      return '123 Sample Street, City, State 123456'
    }
    
    if (field.key.includes('District') || field.key.includes('district')) {
      if (field.key.includes('Corporate') || field.key.includes('corporate')) {
        return 'Gurgaon'
      } else if (field.key.includes('Correspondence') || field.key.includes('correspondence')) {
        return 'Bangalore Urban'
      }
      return 'Sample District'
    }
    
    if (field.key.includes('State') || field.key.includes('state')) {
      if (field.key.includes('Corporate') || field.key.includes('corporate')) {
        return 'Haryana'
      } else if (field.key.includes('Correspondence') || field.key.includes('correspondence')) {
        return 'Karnataka'
      } else if (field.key.includes('Other') || field.key.includes('other')) {
        return 'Maharashtra'
      }
      return 'Karnataka'
    }
    
    if (field.key.includes('Country') || field.key.includes('country')) {
      return 'India'
    }
    
    if (field.key.includes('PinCode') || field.key.includes('pinCode') || field.key.includes('pin_code')) {
      if (field.key.includes('Corporate') || field.key.includes('corporate')) {
        return '122002'
      } else if (field.key.includes('Correspondence') || field.key.includes('correspondence')) {
        return '560001'
      } else if (field.key.includes('Other') || field.key.includes('other')) {
        return '411014'
      }
      return '560001'
    }
    
    if (field.key.includes('GST') || field.key.includes('gst')) {
      if (field.key.includes('Consignee') || field.key.includes('consignee')) {
        return '27DEFLG1234L1Z5'
      } else if (field.key.includes('Payer') || field.key.includes('payer')) {
        return '33GHITC5678M2N6'
      } else if (field.key.includes('Other') || field.key.includes('other')) {
        return '27XYZIN7890P2Q3'
      }
      return '29AABCU9603R1ZX'
    }
    
    if (field.key.includes('Email') || field.key.includes('email')) {
      return 'sample@example.com'
    }
    
    if (field.key.includes('Contact') || field.key.includes('contact') || field.key.includes('Phone') || field.key.includes('phone')) {
      return '+91-9876543210'
    }
    
    if (field.key.includes('Designation') || field.key.includes('designation')) {
      return 'Manager'
    }
    
    if (field.key.includes('Segment') || field.key.includes('segment')) {
      return 'Domestic'
    }
    
    if (field.key.includes('Role') || field.key.includes('role')) {
      return 'Sales Manager'
    }
    
    if (field.key.includes('Department') || field.key.includes('department')) {
      return 'Sales & Marketing'
    }
    
    if (field.key.includes('JobRole') || field.key.includes('jobRole') || field.key.includes('job_role')) {
      return 'Regional Sales Manager'
    }
    
    if (field.key.includes('City') || field.key.includes('city')) {
      return 'Bangalore'
    }
    
    if (field.type === 'select' && field.options && field.options.length > 0) {
      return field.options[0]
    }
    
    if (field.type === 'number') {
      if (field.key.includes('Due') || field.key.includes('due')) {
        if (field.key.includes('First') || field.key.includes('first') || field.key.includes('1st')) {
          return '30'
        } else if (field.key.includes('Second') || field.key.includes('second') || field.key.includes('2nd')) {
          return '60'
        } else if (field.key.includes('Third') || field.key.includes('third') || field.key.includes('3rd')) {
          return '90'
        } else if (field.key.includes('Final') || field.key.includes('final')) {
          return '120'
        }
      }
      if (field.key.includes('Basic') || field.key.includes('basic')) {
        return '70'
      } else if (field.key.includes('Freight') || field.key.includes('freight')) {
        return '10'
      } else if (field.key.includes('Tax') || field.key.includes('tax')) {
        return '20'
      }
      return '100'
    }
    
    if (field.type === 'textarea') {
      if (field.key.includes('Description') || field.key.includes('description')) {
        return 'Sample description: This is a test entry for development and testing purposes. All fields are filled with realistic sample data.'
      }
      return 'Sample text area content for testing purposes.'
    }
    
    if (field.type === 'text') {
      return 'Sample Text'
    }
    
    return ''
  }

  // Auto-fill sample data for testing/development - fills ALL fields dynamically
  const handleAutoFill = () => {
    if (!def) return
    
    const sampleData = {}
    const sampleLogoPreviews = {}
    const updatedMultipleEntries = { ...multipleEntries }
    
    // Initialize multiple entries for allowMultiple groups if needed
    def.groups.forEach((group, groupIndex) => {
      if (group.allowMultiple && !updatedMultipleEntries[groupIndex]) {
        updatedMultipleEntries[groupIndex] = [0]
      }
    })
    
    // Dynamically fill ALL fields from form definition
    def.groups.forEach((group, groupIndex) => {
      const entries = group.allowMultiple ? (updatedMultipleEntries[groupIndex] || [0]) : [0]
      
      entries.forEach((entryIndex) => {
        group.fields.forEach((field) => {
          // Skip file fields (logo, photo) - they need actual file uploads
          if (field.type === 'file') {
            return
          }
          
          const fieldKey = group.allowMultiple ? `${field.key}_${entryIndex}` : field.key
          const sampleValue = generateSampleValue(field, group.allowMultiple ? entryIndex : null)
          
          if (sampleValue !== null && sampleValue !== undefined && sampleValue !== '') {
            sampleData[fieldKey] = sampleValue
          }
        })
      })
    })
    
    // Generate comprehensive sample data based on form type (override with specific values)
    if (type === 'customer-profile') {
      // Override with more specific values
      sampleData.customerName = 'ABC Corporation Pvt Ltd'
      sampleData.legalEntityName = 'ABC Corporation Private Limited'
      sampleData.corporateOfficeAddress_0 = '123 Business Park, Sector 5, Noida, Uttar Pradesh 201301'
      sampleData.correspondenceAddress_0 = '456 Corporate Tower, MG Road, Bangalore, Karnataka 560001'
      sampleData.district_0 = 'Bangalore Urban'
      sampleData.state_0 = 'Karnataka'
      sampleData.country_0 = 'India'
      sampleData.pinCode_0 = '560001'
      sampleData.segment = 'Domestic'
      sampleData.gstNo = '29AABCU9603R1ZX'
      sampleData.poIssuingAuthority = 'John Doe'
      sampleData.designation = 'Purchase Manager'
      sampleData.contactPersonContactNo = '+91-9876543210'
      sampleData.emailId = 'john.doe@abccorp.com'
      
    } else if (type === 'company-profile') {
      // Override with more specific values
      sampleData.companyName = 'XYZ Industries Limited'
      sampleData.corporateOfficeAddress_0 = '789 Industrial Area, Phase 2, Gurgaon, Haryana 122002'
      sampleData.corporateDistrict_0 = 'Gurgaon'
      sampleData.corporateState_0 = 'Haryana'
      sampleData.corporateCountry_0 = 'India'
      sampleData.corporatePinCode_0 = '122002'
      sampleData.correspondenceAddress_0 = '789 Industrial Area, Phase 2, Gurgaon, Haryana 122002'
      sampleData.correspondenceDistrict_0 = 'Gurgaon'
      sampleData.correspondenceState_0 = 'Haryana'
      sampleData.correspondenceCountry_0 = 'India'
      sampleData.correspondencePinCode_0 = '122002'
      sampleData.officeType_0 = 'Plant Address'
      sampleData.otherOfficeAddress_0 = '999 Manufacturing Unit, Industrial Zone, Pune, Maharashtra 411014'
      sampleData.otherOfficeGST_0 = '27XYZIN7890P2Q3'
      sampleData.otherOfficeDistrict_0 = 'Pune'
      sampleData.otherOfficeState_0 = 'Maharashtra'
      sampleData.otherOfficeCountry_0 = 'India'
      sampleData.otherOfficePinCode_0 = '411014'
      sampleData.contactPersonName = 'Michael Chen'
      sampleData.contactNumber = '+91-9876543214'
      sampleData.emailId = 'michael.chen@xyzindustries.com'
      
    } else if (type === 'consignee-profile') {
      // Sample data templates for multiple entries
      const sampleConsigneeTemplates = [
        {
          consigneeName: 'DEF Logistics Solutions',
          consigneeAddress: '321 Warehouse Complex, Industrial Estate, Andheri East, Mumbai, Maharashtra 400093',
          customerName: 'ABC Corporation Pvt Ltd',
          legalEntityName: 'ABC Corporation Private Limited',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          consigneeGSTNo: '27DEFLG1234L1Z5',
          contactPersonName: 'Jane Smith',
          designation: 'Warehouse Manager',
          contactPersonContactNo: '+91-9876543211',
          emailId: 'jane.smith@deflogistics.com',
        },
        {
          consigneeName: 'JKL Distribution Hub',
          consigneeAddress: '789 Freight Terminal, Sector 18, Noida, Uttar Pradesh 201301',
          customerName: 'ABC Corporation Pvt Ltd',
          legalEntityName: 'ABC Corporation Private Limited',
          city: 'Noida',
          state: 'Uttar Pradesh',
          country: 'India',
          consigneeGSTNo: '09JKLDH5678M3N7',
          contactPersonName: 'Michael Brown',
          designation: 'Operations Manager',
          contactPersonContactNo: '+91-9876543215',
          emailId: 'michael.brown@jkldistribution.com',
        },
        {
          consigneeName: 'MNO Storage Facilities',
          consigneeAddress: '456 Cold Storage Complex, Whitefield, Bangalore, Karnataka 560066',
          customerName: 'ABC Corporation Pvt Ltd',
          legalEntityName: 'ABC Corporation Private Limited',
          city: 'Bangalore',
          state: 'Karnataka',
          country: 'India',
          consigneeGSTNo: '29MNOST9012P4Q8',
          contactPersonName: 'Emily Davis',
          designation: 'Logistics Coordinator',
          contactPersonContactNo: '+91-9876543216',
          emailId: 'emily.davis@mnostorage.com',
        },
        {
          consigneeName: 'PQR Freight Services',
          consigneeAddress: '123 Transport Yard, Sector 63, Noida, Uttar Pradesh 201301',
          customerName: 'ABC Corporation Pvt Ltd',
          legalEntityName: 'ABC Corporation Private Limited',
          city: 'Noida',
          state: 'Uttar Pradesh',
          country: 'India',
          consigneeGSTNo: '09PQRFS3456Q5R9',
          contactPersonName: 'Thomas Lee',
          designation: 'Transport Manager',
          contactPersonContactNo: '+91-9876543221',
          emailId: 'thomas.lee@pqrfreight.com',
        },
        {
          consigneeName: 'VWX Cargo Solutions',
          consigneeAddress: '789 Logistics Park, Hinjewadi, Pune, Maharashtra 411057',
          customerName: 'ABC Corporation Pvt Ltd',
          legalEntityName: 'ABC Corporation Private Limited',
          city: 'Pune',
          state: 'Maharashtra',
          country: 'India',
          consigneeGSTNo: '27VWXCS7890R6S0',
          contactPersonName: 'Rachel Green',
          designation: 'Cargo Coordinator',
          contactPersonContactNo: '+91-9876543222',
          emailId: 'rachel.green@vwxcargo.com',
        },
      ]
      
      // Fill ALL existing entries, or create minimum 3 if none exist
      const currentCount = consignees.length
      const targetCount = Math.max(currentCount, 3)
      const maxId = consignees.length > 0 ? Math.max(...consignees.map(item => item.id), -1) : -1
      
      const filledConsignees = Array.from({ length: targetCount }, (_, idx) => {
        const existingItem = consignees[idx]
        const templateIndex = idx % sampleConsigneeTemplates.length
        const sampleData = sampleConsigneeTemplates[templateIndex]
        
        const filledValues = {}
        
        // Fill all fields from form definition first
        def.groups.forEach((group) => {
          group.fields.forEach((field) => {
            if (field.type !== 'file') {
              const sampleValue = generateSampleValue(field)
              if (sampleValue !== null && sampleValue !== undefined && sampleValue !== '') {
                filledValues[field.key] = sampleValue
              }
            }
          })
        })
        
        // Override with specific sample data for this entry
        Object.assign(filledValues, sampleData)
        
        // Preserve existing ID and recordId if updating existing entry
        if (existingItem) {
          return {
            ...existingItem,
            values: filledValues,
            logoPreviews: existingItem.logoPreviews || {},
          }
        }
        
        // Create new entry
        return {
          id: maxId + 1 + idx,
          recordId: null,
          values: filledValues,
          logoPreviews: {},
        }
      })
      
      setConsignees(filledConsignees)
      setStatus({ kind: 'idle', message: `Filled ${filledConsignees.length} consignee entries with sample data!` })
      return
      
    } else if (type === 'payer-profile') {
      // Sample data templates for multiple entries
      const samplePayerTemplates = [
        {
          payerName: 'GHI Trading Company',
          payerAddress: '654 Commercial Street, T Nagar, Chennai, Tamil Nadu 600017',
          customerName: 'ABC Corporation Pvt Ltd',
          legalEntityName: 'ABC Corporation Private Limited',
          city: 'Chennai',
          state: 'Tamil Nadu',
          country: 'India',
          payerGSTNo: '33GHITC5678M2N6',
          contactPersonName: 'Robert Johnson',
          designation: 'Accounts Manager',
          contactPersonContactNo: '+91-9876543212',
          emailId: 'robert.j@ghitrading.com',
        },
        {
          payerName: 'PQR Enterprises Limited',
          payerAddress: '123 Business Center, Salt Lake, Kolkata, West Bengal 700091',
          customerName: 'ABC Corporation Pvt Ltd',
          legalEntityName: 'ABC Corporation Private Limited',
          city: 'Kolkata',
          state: 'West Bengal',
          country: 'India',
          payerGSTNo: '19PQREL2345N3O9',
          contactPersonName: 'David Wilson',
          designation: 'Finance Manager',
          contactPersonContactNo: '+91-9876543217',
          emailId: 'david.wilson@pqrenterprises.com',
        },
        {
          payerName: 'STU Commerce Pvt Ltd',
          payerAddress: '789 Trade Tower, Banjara Hills, Hyderabad, Telangana 500034',
          customerName: 'ABC Corporation Pvt Ltd',
          legalEntityName: 'ABC Corporation Private Limited',
          city: 'Hyderabad',
          state: 'Telangana',
          country: 'India',
          payerGSTNo: '36STUCP6789O4P0',
          contactPersonName: 'Lisa Anderson',
          designation: 'Payment Coordinator',
          contactPersonContactNo: '+91-9876543218',
          emailId: 'lisa.anderson@stcommerce.com',
        },
        {
          payerName: 'VWX Financial Services',
          payerAddress: '456 Banking Square, MG Road, Bangalore, Karnataka 560001',
          customerName: 'ABC Corporation Pvt Ltd',
          legalEntityName: 'ABC Corporation Private Limited',
          city: 'Bangalore',
          state: 'Karnataka',
          country: 'India',
          payerGSTNo: '29VWXFS0123T7U1',
          contactPersonName: 'Mark Thompson',
          designation: 'Payment Manager',
          contactPersonContactNo: '+91-9876543223',
          emailId: 'mark.thompson@vwxfinancial.com',
        },
        {
          payerName: 'YZA Billing Solutions',
          payerAddress: '789 Accounts Plaza, Connaught Place, New Delhi, Delhi 110001',
          customerName: 'ABC Corporation Pvt Ltd',
          legalEntityName: 'ABC Corporation Private Limited',
          city: 'New Delhi',
          state: 'Delhi',
          country: 'India',
          payerGSTNo: '07YZABS4567U8V2',
          contactPersonName: 'Nancy White',
          designation: 'Billing Coordinator',
          contactPersonContactNo: '+91-9876543224',
          emailId: 'nancy.white@yzabilling.com',
        },
      ]
      
      // Fill ALL existing entries, or create minimum 3 if none exist
      const currentCount = payers.length
      const targetCount = Math.max(currentCount, 3)
      const maxId = payers.length > 0 ? Math.max(...payers.map(item => item.id), -1) : -1
      
      const filledPayers = Array.from({ length: targetCount }, (_, idx) => {
        const existingItem = payers[idx]
        const templateIndex = idx % samplePayerTemplates.length
        const sampleData = samplePayerTemplates[templateIndex]
        
        const filledValues = {}
        
        // Fill all fields from form definition first
        def.groups.forEach((group) => {
          group.fields.forEach((field) => {
            if (field.type !== 'file') {
              const sampleValue = generateSampleValue(field)
              if (sampleValue !== null && sampleValue !== undefined && sampleValue !== '') {
                filledValues[field.key] = sampleValue
              }
            }
          })
        })
        
        // Override with specific sample data for this entry
        Object.assign(filledValues, sampleData)
        
        // Preserve existing ID and recordId if updating existing entry
        if (existingItem) {
          return {
            ...existingItem,
            values: filledValues,
            logoPreviews: existingItem.logoPreviews || {},
          }
        }
        
        // Create new entry
        return {
          id: maxId + 1 + idx,
          recordId: null,
          values: filledValues,
          logoPreviews: {},
        }
      })
      
      setPayers(filledPayers)
      setStatus({ kind: 'idle', message: `Filled ${filledPayers.length} payer entries with sample data!` })
      return
      
    } else if (type === 'employee-profile') {
      // Sample data templates for multiple entries
      const sampleEmployeeTemplates = [
        {
          role: 'Sales Manager',
          nameOfEmployee: 'Sarah Williams',
          designation: 'Senior Sales Manager',
          transporterName: 'Fast Track Logistics',
          contactNo: '+91-9876543213',
          emailId: 'sarah.williams@company.com',
          department: 'Sales & Marketing',
          jobRole: 'Regional Sales Manager',
        },
        {
          role: 'Business Head',
          nameOfEmployee: 'James Taylor',
          designation: 'Business Development Head',
          transporterName: 'Express Cargo Services',
          contactNo: '+91-9876543219',
          emailId: 'james.taylor@company.com',
          department: 'Business Development',
          jobRole: 'Head of Business Development',
        },
        {
          role: 'Collection Agent',
          nameOfEmployee: 'Priya Sharma',
          designation: 'Senior Collection Agent',
          transporterName: 'Reliable Transport Co',
          contactNo: '+91-9876543220',
          emailId: 'priya.sharma@company.com',
          department: 'Finance & Collections',
          jobRole: 'Collection Specialist',
        },
        {
          role: 'Project Manager',
          nameOfEmployee: 'Rajesh Kumar',
          designation: 'Senior Project Manager',
          transporterName: 'Swift Delivery Services',
          contactNo: '+91-9876543225',
          emailId: 'rajesh.kumar@company.com',
          department: 'Project Management',
          jobRole: 'Project Lead',
        },
        {
          role: 'Sales Agent',
          nameOfEmployee: 'Anita Patel',
          designation: 'Sales Executive',
          transporterName: 'Quick Transport',
          contactNo: '+91-9876543226',
          emailId: 'anita.patel@company.com',
          department: 'Sales & Marketing',
          jobRole: 'Field Sales Executive',
        },
      ]
      
      // Fill ALL existing entries, or create minimum 3 if none exist
      const currentCount = employees.length
      const targetCount = Math.max(currentCount, 3)
      const maxId = employees.length > 0 ? Math.max(...employees.map(item => item.id), -1) : -1
      
      const filledEmployees = Array.from({ length: targetCount }, (_, idx) => {
        const existingItem = employees[idx]
        const templateIndex = idx % sampleEmployeeTemplates.length
        const sampleData = sampleEmployeeTemplates[templateIndex]
        
        const filledValues = {}
        
        // Fill all fields from form definition first
        def.groups.forEach((group) => {
          group.fields.forEach((field) => {
            if (field.type !== 'file') {
              const sampleValue = generateSampleValue(field)
              if (sampleValue !== null && sampleValue !== undefined && sampleValue !== '') {
                filledValues[field.key] = sampleValue
              }
            }
          })
        })
        
        // Override with specific sample data for this entry
        Object.assign(filledValues, sampleData)
        
        // Preserve existing ID and recordId if updating existing entry
        if (existingItem) {
          return {
            ...existingItem,
            values: filledValues,
            logoPreviews: existingItem.logoPreviews || {},
          }
        }
        
        // Create new entry
        return {
          id: maxId + 1 + idx,
          recordId: null,
          values: filledValues,
          logoPreviews: {},
        }
      })
      
      setEmployees(filledEmployees)
      setStatus({ kind: 'idle', message: `Filled ${filledEmployees.length} employee entries with sample data!` })
      return
    } else if (type === 'payment-terms') {
      if (paymentTerms.length > 0) {
        const updatedPaymentTerms = paymentTerms.map((item, idx) => {
          if (idx === 0) {
            const filledValues = { ...item.values }
            
            // Fill all fields from form definition
            def.groups.forEach((group) => {
              group.fields.forEach((field) => {
                if (field.type !== 'file') {
                  const sampleValue = generateSampleValue(field)
                  if (sampleValue !== null && sampleValue !== undefined && sampleValue !== '') {
                    filledValues[field.key] = sampleValue
                  }
                }
              })
            })
            
            // Override with specific values
            filledValues.basic = '70'
            filledValues.freight = '10'
            filledValues.taxes = '20'
            filledValues.firstDue = '30'
            filledValues.secondDue = '60'
            filledValues.thirdDue = '90'
            filledValues.finalDue = '120'
            filledValues.paymentTermsDescription = 'Payment terms: 30% advance, 40% on delivery, 20% after 30 days, 10% retention after 90 days. All payments subject to GST as applicable.'
            
            return {
              ...item,
              values: filledValues
            }
          }
          return item
        })
        setPaymentTerms(updatedPaymentTerms)
        setStatus({ kind: 'idle', message: 'Sample data filled! You can modify any field as needed.' })
        return
      }
    }
    
    // For regular forms, set values directly
    if (Object.keys(sampleData).length > 0) {
      setValues(sampleData)
      if (Object.keys(sampleLogoPreviews).length > 0) {
        setLogoPreviews(sampleLogoPreviews)
      }
      // Update multiple entries if initialized
      if (Object.keys(updatedMultipleEntries).length > 0) {
        setMultipleEntries(updatedMultipleEntries)
      }
      setStatus({ kind: 'idle', message: 'Sample data filled! You can modify any field as needed.' })
    }
  }
  
  // Generic render function for array-based forms
  const renderArrayForm = (item, index, formType, itemName, items, handlers) => {
    const itemValues = item.values
    const itemLogoPreviews = item.logoPreviews || {}
    const { handleChange, handleFileChange, handleRemove } = handlers
    
    const getItemLabel = () => {
      if (formType === 'consignee-profile') return `Consignee #${index + 1}`
      if (formType === 'payer-profile') return `Payer #${index + 1}`
      if (formType === 'employee-profile') return `Employee #${index + 1}`
      if (formType === 'payment-terms') return `Payment Term #${index + 1}`
      return `${itemName} #${index + 1}`
    }
    
    return (
      <div 
        key={item.id} 
        id={`${itemName}-${item.id}`}
        className="md-form-entry-block"
        style={{ marginBottom: '2rem' }}
      >
        <div className="md-form-entry-header">
          <span className="md-form-entry-number" style={{ fontSize: '1.125rem', fontWeight: 700 }}>
            {getItemLabel()}
          </span>
          {items.length > 1 && (
            <button
              type="button"
              className="md-form-entry-remove"
              onClick={() => handleRemove(item.id)}
              aria-label={`Remove ${itemName}`}
            >
              <X className="md-form-entry-remove-icon" />
            </button>
          )}
        </div>
        
        {def.groups.map((group, groupIndex) => (
          <div key={groupIndex} className="md-form-group" style={{ marginBottom: '1.5rem' }}>
            {group.title && (
              <div className="md-form-group-title">{group.title}</div>
            )}
            
            <div className="md-form-grid">
              {group.fields.map((f) => {
                const fieldId = `${itemName}-${item.id}-${f.key}`
                const fieldValue = itemValues[f.key] || ''
                
                return (
                  <div
                    key={f.key}
                    className={`md-form-field ${f.type === 'textarea' || f.type === 'file' ? 'md-form-field-full' : ''}`}
                  >
                    <label className="md-form-label" htmlFor={fieldId}>
                      {f.label}
                      {f.required && <span className="md-form-required">*</span>}
                    </label>
                    {f.type === 'file' ? (
                      <div className="md-form-logo-viewer">
                        {itemLogoPreviews[f.key] ? (
                          <div className="md-form-logo-preview">
                            <img src={itemLogoPreviews[f.key]} alt="Preview" className="md-form-logo-image" />
                            <button
                              type="button"
                              className="md-form-logo-remove"
                              onClick={() => {
                                handleChange(item.id, f.key, null)
                                if (formType !== 'payment-terms') {
                                  // Update logoPreviews for forms that have it
                                  const setter = formType === 'consignee-profile' ? setConsignees
                                    : formType === 'payer-profile' ? setPayers
                                    : setEmployees
                                  setter(prev => prev.map(i => 
                                    i.id === item.id 
                                      ? { ...i, logoPreviews: { ...i.logoPreviews, [f.key]: null } }
                                      : i
                                  ))
                                }
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
                              disabled={isLocked}
                              onChange={(e) => handleFileChange(item.id, f.key, e.target.files[0])}
                            />
                          </label>
                        )}
                      </div>
                    ) : f.type === 'country' ? (
                      <select
                        id={fieldId}
                        className="md-form-select"
                        value={fieldValue}
                        disabled={isLocked}
                        onChange={(e) => {
                          handleChange(item.id, f.key, e.target.value)
                          // Clear state when country changes
                          const stateField = group.fields.find(field => 
                            (field.key.includes('State') || field.key.includes('state')) &&
                            f.key.replace('Country', '').replace('country', '') === field.key.replace('State', '').replace('state', '')
                          )
                          if (stateField) {
                            handleChange(item.id, stateField.key, '')
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
                        value={fieldValue}
                        disabled={isLocked || !getStateOptions(f.key, null, group.fields, itemValues).length}
                        onChange={(e) => handleChange(item.id, f.key, e.target.value)}
                      >
                        <option value="">Select state...</option>
                        {getStateOptions(f.key, null, group.fields, itemValues).map((state) => (
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
                        value={fieldValue}
                        disabled={isLocked}
                        readOnly={isLocked}
                        onChange={(e) => handleChange(item.id, f.key, e.target.value)}
                        placeholder={`Enter ${f.label.toLowerCase()}...`}
                      />
                    ) : f.type === 'select' ? (
                      <>
                        <select
                          id={fieldId}
                          className="md-form-select"
                          value={fieldValue}
                          disabled={isLocked}
                          onChange={(e) => handleChange(item.id, f.key, e.target.value)}
                        >
                          <option value="">Select {f.label.toLowerCase()}...</option>
                          {f.options?.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                          <option value="Other">Other</option>
                        </select>
                        {fieldValue === 'Other' && (
                          <input
                            id={`${fieldId}Other`}
                            className="md-form-input md-form-input-other"
                            type="text"
                            disabled={isLocked}
                            readOnly={isLocked}
                            value={itemValues[`${f.key}Other`] || ''}
                            onChange={(e) => handleChange(item.id, `${f.key}Other`, e.target.value)}
                            placeholder={`Enter ${f.label.toLowerCase()}...`}
                          />
                        )}
                      </>
                    ) : f.type === 'date' || f.type === 'datetime' ? (
                      <DatePicker
                        id={fieldId}
                        name={f.key}
                        selected={fieldValue}
                        disabled={isLocked}
                        required={f.required}
                        showTimeSelect={f.type === 'datetime'}
                        onChange={(e) => handleChange(item.id, f.key, e.target.value)}
                        placeholderText={`Select ${f.label.toLowerCase()}...`}
                      />
                    ) : (
                      <input
                        id={fieldId}
                        className="md-form-input"
                        type={f.type}
                        value={fieldValue}
                        disabled={isLocked}
                        readOnly={isLocked}
                        onChange={(e) => handleChange(item.id, f.key, e.target.value)}
                        placeholder={`Enter ${f.label.toLowerCase()}...`}
                      />
                    )}
                  </div>
                )
              })}
            </div>
            
            {groupIndex < def.groups.length - 1 && <div className="md-form-group-divider" />}
          </div>
        ))}
      </div>
    )
  }
  
  // Specific render functions using the generic one
  const renderConsigneeForm = (consignee, index) => 
    renderArrayForm(consignee, index, 'consignee-profile', 'consignee', consignees, {
      handleChange: handleConsigneeChange,
      handleFileChange: handleConsigneeFileChange,
      handleRemove: handleRemoveConsignee
    })
  
  const renderPayerForm = (payer, index) => 
    renderArrayForm(payer, index, 'payer-profile', 'payer', payers, {
      handleChange: handlePayerChange,
      handleFileChange: handlePayerFileChange,
      handleRemove: handleRemovePayer
    })
  
  const renderEmployeeForm = (employee, index) => 
    renderArrayForm(employee, index, 'employee-profile', 'employee', employees, {
      handleChange: handleEmployeeChange,
      handleFileChange: handleEmployeeFileChange,
      handleRemove: handleRemoveEmployee
    })
  
  const renderPaymentTermForm = (paymentTerm, index) => 
    renderArrayForm(paymentTerm, index, 'payment-terms', 'payment-term', paymentTerms, {
      handleChange: handlePaymentTermChange,
      handleFileChange: () => {}, // Payment terms don't have files
      handleRemove: handleRemovePaymentTerm
    })
  
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

  const saveDraftStep = async ({ navigateNext } = {}) => {
    try {
      if (type !== 'company-profile' && !draftCompanyId) {
        setStatus({ kind: 'error', message: 'Draft company must be created first.' })
        return null
      }

      setSavingInProgress(true)
      setStatus({ kind: 'idle', message: 'Saving draft...' })

      const cleanValues = (vals) => {
        const cleaned = { ...(vals || {}) }
        Object.keys(cleaned).forEach(key => {
          if (cleaned[key] instanceof File) {
            delete cleaned[key]
          }
        })
        return cleaned
      }

      const cleanLogoPreviews = (previews) => {
        if (!previews || typeof previews !== 'object') return {}
        const out = {}
        Object.entries(previews).forEach(([k, v]) => {
          if (v !== undefined && v !== null && typeof v !== 'function' && !(v instanceof File)) {
            out[k] = typeof v === 'object' && v !== null && !Array.isArray(v)
              ? cleanLogoPreviews(v)
              : v
          }
        })
        return out
      }

      let nextDraftId = draftCompanyId

      if (isArrayBasedForm) {
        let items = []
        if (isConsigneeProfile) items = consignees
        else if (isPayerProfile) items = payers
        else if (isEmployeeProfile) items = employees
        else if (isPaymentTerms) items = paymentTerms

        const savedItems = await Promise.all(items.map(async (item) => {
          const payload = {
            values: cleanValues(item.values || {}),
            logoPreviews: await capLogoPreviewsPayload(cleanLogoPreviews(item.logoPreviews || {})),
            companyId: type === 'company-profile' ? undefined : nextDraftId,
            status: 'draft',
          }

          if (item.recordId) {
            await updateMasterDataRecord(type, item.recordId, payload)
            return item
          }

          const resp = await saveMasterDataRecord(type, payload)
          const savedRecord = parseApiRecord(resp)
          return { ...item, recordId: savedRecord?.id || item.recordId }
        }))

        if (isConsigneeProfile) setConsignees(savedItems)
        else if (isPayerProfile) setPayers(savedItems)
        else if (isEmployeeProfile) setEmployees(savedItems)
        else if (isPaymentTerms) setPaymentTerms(savedItems)

        window.dispatchEvent(new Event('masterDataUpdated'))
        setStatus({ kind: 'success', message: 'Draft saved successfully.' })
      } else {
        const payload = {
          values: cleanValues(values) || {},
          logoPreviews: await capLogoPreviewsPayload(cleanLogoPreviews(logoPreviewsRef.current)),
          companyId: type === 'company-profile' ? undefined : nextDraftId,
          status: 'draft',
        }

        if (type === 'company-profile') {
          if (draftRecordId) {
            await updateMasterDataRecord(type, draftRecordId, payload)
          } else {
            const resp = await saveMasterDataRecord(type, payload)
            const savedRecord = parseApiRecord(resp)
            if (savedRecord?.id) {
              nextDraftId = savedRecord.id
              setDraftCompanyId(savedRecord.id)
              setDraftRecordId(savedRecord.id)
            }
          }
        } else if (draftRecordId) {
          await updateMasterDataRecord(type, draftRecordId, payload)
        } else {
          const resp = await saveMasterDataRecord(type, payload)
          const savedRecord = parseApiRecord(resp)
          if (savedRecord?.id) {
            setDraftRecordId(savedRecord.id)
          }
        }

        window.dispatchEvent(new Event('masterDataUpdated'))
        setStatus({ kind: 'success', message: 'Draft saved successfully.' })
      }

      setSavingInProgress(false)

      if (navigateNext && wizardNextStep && nextDraftId) {
        navigate(buildWizardStepUrl(wizardNextStep.key, nextDraftId))
      }

      return nextDraftId
    } catch (error) {
      console.error('[MasterDataForm] Failed to save draft:', error)
      let message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to save draft. Please try again.'
      if (error?.status === 413 || error?.code === 'ERR_PAYLOAD_TOO_LARGE') {
        message = 'Request too large. Try smaller logos/images or ask your administrator to increase server limits.'
      }
      setStatus({ kind: 'error', message })
      setSavingInProgress(false)
      return null
    }
  }

  const handleSaveAndContinue = async () => {
    if (isWizardFlow) {
      await saveDraftStep({ navigateNext: true })
      return
    }
    try {
      if (type !== 'company-profile' && !selectedCompanyId) {
        setStatus({ kind: 'error', message: 'Please select a company to link this record.' })
        return
      }

      const cleanValues = (vals) => {
        const cleaned = { ...vals }
        Object.keys(cleaned).forEach(key => {
          if (cleaned[key] instanceof File) {
            delete cleaned[key]
          }
        })
        return cleaned
      }

      // Edit mode: update this exact record
      if (isEditMode) {
        if (isArrayBasedForm) {
          const item = isConsigneeProfile ? consignees[0]
            : isPayerProfile ? payers[0]
            : isEmployeeProfile ? employees[0]
            : isPaymentTerms ? paymentTerms[0]
            : null

          await updateMasterDataRecord(type, id, {
            values: cleanValues(item?.values || {}),
            logoPreviews: await capLogoPreviewsPayload(item?.logoPreviews || {}),
            companyId: type === 'company-profile' ? undefined : selectedCompanyId,
          })
        } else {
          await updateMasterDataRecord(type, id, {
            values: cleanValues(values),
            logoPreviews: await capLogoPreviewsPayload(logoPreviewsRef.current || {}),
            companyId: type === 'company-profile' ? undefined : selectedCompanyId,
          })
        }

        window.dispatchEvent(new Event('masterDataUpdated'))
        setStatus({ kind: 'success', message: 'Form updated! You can continue with other forms.' })
        return
      }

      // Create mode: keep existing behavior (may create multiple records)
      const records = transformToTabularRecords()
      const savePromises = records.map(async record =>
        saveMasterDataRecord(type, {
          values: cleanValues(record.values),
          logoPreviews: await capLogoPreviewsPayload(record.logoPreviews || {}),
          companyId: type === 'company-profile' ? undefined : selectedCompanyId,
        })
      )
      
      await Promise.all(savePromises)
      window.dispatchEvent(new Event('masterDataUpdated'))
      setStatus({ kind: 'success', message: 'Form saved! You can continue with other forms.' })
    } catch (error) {
      console.error('Failed to save:', error)
      let msg = 'Failed to save form. Please try again.'
      if (error?.status === 413 || error?.code === 'ERR_PAYLOAD_TOO_LARGE') {
        msg = 'Request too large. Try smaller logos/images or ask your administrator to increase server limits.'
      } else if (error?.message) msg = error.message
      setStatus({ kind: 'error', message: msg })
    }
  }

  // Transform multiple entries into tabular format (separate records)
  const transformToTabularRecords = () => {
    // Check if this form type supports multiple entries
    const hasMultipleEntries = def.groups.some(group => group.allowMultiple)
    
    if (!hasMultipleEntries) {
      // Single record - return as is
      return [{
        values,
        logoPreviews,
      }]
    }

    // Get entry indices from the first group that allows multiple
    const firstMultipleGroup = def.groups.find(group => group.allowMultiple)
    if (!firstMultipleGroup) {
      return [{
        values,
        logoPreviews,
      }]
    }

    const firstGroupIndex = def.groups.indexOf(firstMultipleGroup)
    const entryIndices = multipleEntries[firstGroupIndex] || [0]

    // Transform each entry into a separate record
    const records = entryIndices.map(entryIndex => {
      const recordValues = {}
      const recordLogoPreviews = {}

      // Collect all field values for this entry across all groups
      def.groups.forEach((group, groupIndex) => {
        const groupEntryIndices = group.allowMultiple 
          ? (multipleEntries[groupIndex] || [0])
          : [0]
        
        // Use the same entry index if group allows multiple, otherwise use 0
        const currentEntryIndex = group.allowMultiple 
          ? (groupEntryIndices.includes(entryIndex) ? entryIndex : groupEntryIndices[0] || 0)
          : 0

        group.fields.forEach(field => {
          const fieldKey = group.allowMultiple 
            ? `${field.key}_${currentEntryIndex}`
            : field.key
          
          if (values[fieldKey] !== undefined) {
            recordValues[field.key] = values[fieldKey]
          }
          
          if (logoPreviews[fieldKey]) {
            recordLogoPreviews[field.key] = logoPreviews[fieldKey]
          }
        })
      })

      return {
        values: recordValues,
        logoPreviews: recordLogoPreviews,
      }
    })

    return records
  }

  // Helper function to reset form to initial state
  // CRITICAL: This ensures complete isolation - no data from previous records
  const resetForm = () => {
    // Clear all form state completely
    setValues({})
    setLogoPreviews({})
    setMultipleEntries({})
    setStatus({ kind: 'idle', message: '' })
    setShowSaveOptions(false)
    setSavingInProgress(false)
    
    // Reset array-based form states to initial empty state
    if (isConsigneeProfile) {
      setConsignees([{ id: 0, recordId: null, values: {}, logoPreviews: {} }])
    } else if (isPayerProfile) {
      setPayers([{ id: 0, recordId: null, values: {}, logoPreviews: {} }])
    } else if (isEmployeeProfile) {
      setEmployees([{ id: 0, recordId: null, values: {}, logoPreviews: {} }])
    } else if (isPaymentTerms) {
      setPaymentTerms([{ id: 0, recordId: null, values: {} }])
    }
    
    // Re-initialize multiple entries for groups that allow it (fresh start)
    if (!isArrayBasedForm && def) {
      const initialEntries = {}
      def.groups.forEach((group, groupIndex) => {
        if (group.allowMultiple) {
          initialEntries[groupIndex] = [0] // Start with one empty entry
        }
      })
      setMultipleEntries(initialEntries)
    }
    
    // Focus first input field after form re-renders
    setTimeout(() => {
      // Try to find the first visible input field (excluding file inputs and hidden inputs)
      const formContainer = document.querySelector('.md-form-container')
      if (formContainer) {
        const firstInput = formContainer.querySelector(
          'input:not([type="file"]):not([type="hidden"]), textarea, select'
        )
        if (firstInput) {
          firstInput.focus()
          // Scroll to the input if needed
          firstInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    }, 150)
  }

  // Save record and show options
  const saveRecord = async () => {
    if (!def) return

    if (type !== 'company-profile' && !selectedCompanyId) {
      setStatus({ kind: 'error', message: 'Please select a company to link this record.' })
      return
    }

    if (requiredMissing) {
      setStatus({ kind: 'error', message: 'Please fill all required fields.' })
      return
    }

    setSavingInProgress(true)
    setStatus({ kind: 'idle', message: 'Saving record...' })

    try {
      // EDIT MODE: update the exact record by (type, id)
      if (isEditMode) {
        const cleanValues = (vals) => {
          const cleaned = { ...vals }
          Object.keys(cleaned).forEach(key => {
            if (cleaned[key] instanceof File) {
              delete cleaned[key]
            }
          })
          return cleaned
        }

        if (isArrayBasedForm) {
          const item = isConsigneeProfile ? consignees[0]
            : isPayerProfile ? payers[0]
            : isEmployeeProfile ? employees[0]
            : isPaymentTerms ? paymentTerms[0]
            : null

          await updateMasterDataRecord(type, id, {
            values: cleanValues(item?.values || {}),
            logoPreviews: await capLogoPreviewsPayload(item?.logoPreviews || {}),
            companyId: type === 'company-profile' ? undefined : selectedCompanyId,
          })
        } else {
          await updateMasterDataRecord(type, id, {
            values: cleanValues(values),
            logoPreviews: await capLogoPreviewsPayload(logoPreviewsRef.current || {}),
            companyId: type === 'company-profile' ? undefined : selectedCompanyId,
          })
        }

        window.dispatchEvent(new Event('masterDataUpdated'))
        setStatus({ kind: 'success', message: 'Record updated successfully!' })
        setShowSaveOptions(true)
        setSavingInProgress(false)
        return
      }

      // Special handling for company-profile: always create new record (not update)
      if (type === 'company-profile') {
        // Helper function to clean values (remove File objects)
        const cleanValues = (vals) => {
          const cleaned = { ...vals }
          Object.keys(cleaned).forEach(key => {
            if (cleaned[key] instanceof File) {
              delete cleaned[key]
            }
          })
          return cleaned
        }
        
        // Always create new company profile (not update)
        await saveMasterDataRecord(type, {
          values: cleanValues(values),
          logoPreviews: await capLogoPreviewsPayload(logoPreviewsRef.current || {}),
        })
        
        // Trigger refresh of Master Data Records page
        window.dispatchEvent(new Event('masterDataUpdated'))
        
        setStatus({ kind: 'success', message: 'Company profile saved successfully!' })
        setShowSaveOptions(true)
        setSavingInProgress(false)
        return
      }

      // Special handling for array-based forms: save as array
      if (isArrayBasedForm) {
        let items = []
        let itemName = ''
        if (isConsigneeProfile) {
          items = consignees
          itemName = 'consignee(s)'
        } else if (isPayerProfile) {
          items = payers
          itemName = 'payer(s)'
        } else if (isEmployeeProfile) {
          items = employees
          itemName = 'employee(s)'
        } else if (isPaymentTerms) {
          items = paymentTerms
          itemName = 'payment term(s)'
        }
        
        // Helper function to clean values (remove File objects that can't be serialized)
        const cleanValues = (vals) => {
          const cleaned = { ...vals }
          Object.keys(cleaned).forEach(key => {
            if (cleaned[key] instanceof File) {
              // Remove File objects - they're already in logoPreviews as base64
              delete cleaned[key]
            }
          })
          return cleaned
        }
        
        // Save all items as separate records (cap logo size to avoid 413)
        const savePromises = items.map(async item =>
          saveMasterDataRecord(type, {
            values: cleanValues(item.values),
            logoPreviews: await capLogoPreviewsPayload(item.logoPreviews || {}),
            companyId: type === 'company-profile' ? undefined : selectedCompanyId,
          })
        )
        
        await Promise.all(savePromises)
        
        // Trigger refresh of Master Data Records page
        window.dispatchEvent(new Event('masterDataUpdated'))
        
        setStatus({ kind: 'success', message: `${items.length} ${itemName} saved successfully!` })
        setShowSaveOptions(true)
        setSavingInProgress(false)
        return
      }

      // For single-record types when editing (id present), use persistence system
      // For new records (no id), always create new record to ensure isolation
      // NOTE: Editing is handled above via updateMasterDataRecord(type, id)
      
      // For new records (no id), always create new record (never update)
      // This ensures complete isolation - each master data is independent
      if (!id) {
        // Helper function to clean values (remove File objects)
        const cleanValues = (vals) => {
          const cleaned = { ...vals }
          Object.keys(cleaned).forEach(key => {
            if (cleaned[key] instanceof File) {
              delete cleaned[key]
            }
          })
          return cleaned
        }
        
        // Always create new record (not update) for complete isolation
        await saveMasterDataRecord(type, {
          values: cleanValues(values),
          logoPreviews: await capLogoPreviewsPayload(logoPreviewsRef.current || {}),
          companyId: type === 'company-profile' ? undefined : selectedCompanyId,
        })
        
        // Trigger refresh of Master Data Records page
        window.dispatchEvent(new Event('masterDataUpdated'))
        
        setStatus({ kind: 'success', message: 'Record saved successfully!' })
        setShowSaveOptions(true)
        setSavingInProgress(false)
        return
      }

      // For other forms that need database saving
      // Transform multiple entries into tabular format
      const records = transformToTabularRecords()
      
      // Helper function to clean values (remove File objects that can't be serialized)
      const cleanValues = (vals) => {
        const cleaned = { ...vals }
        Object.keys(cleaned).forEach(key => {
          if (cleaned[key] instanceof File) {
            // Remove File objects - they're already in logoPreviews as base64
            delete cleaned[key]
          }
        })
        return cleaned
      }
      
      // Save each record separately to database (cap logo size to avoid 413)
      const savePromises = records.map(async record =>
        saveMasterDataRecord(type, {
          values: cleanValues(record.values),
          logoPreviews: await capLogoPreviewsPayload(record.logoPreviews || {}),
          companyId: type === 'company-profile' ? undefined : selectedCompanyId,
        })
      )
      
      await Promise.all(savePromises)
      
      // Trigger refresh of Master Data Records page
      window.dispatchEvent(new Event('masterDataUpdated'))
      
      setStatus({ kind: 'success', message: `${records.length} record(s) saved successfully!` })
      setShowSaveOptions(true)
      setSavingInProgress(false)
    } catch (error) {
      console.error('Failed to save:', error)
      let msg = 'Failed to save record. Please try again.'
      if (error?.status === 413 || error?.code === 'ERR_PAYLOAD_TOO_LARGE') {
        msg = 'Request too large. Try smaller logos/images or ask your administrator to increase server limits.'
      } else if (error?.message) msg = error.message
      setStatus({ kind: 'error', message: msg })
      setSavingInProgress(false)
    }
  }

  // Handle Save & Create Another
  const handleSaveAndCreateAnother = () => {
    setShowSaveOptions(false)
    if (isEditMode) {
      // In edit mode, "create another" should return to a blank create form.
      if (type !== 'company-profile' && selectedCompanyId) {
        navigate(`/master-data/new/${type}?companyId=${selectedCompanyId}`)
      } else {
        navigate(`/master-data/new/${type}`)
      }
      return
    }
    resetForm()
  }

  // Handle Save & Exit
  const handleSaveAndExit = () => {
    setShowSaveOptions(false)
    navigate('/master-data')
  }

  const onSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault()
    }
    if (isWizardFlow) {
      await saveDraftStep({ navigateNext: false })
      return
    }
    await saveRecord()
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

  // Show loading state while checking lock status
  if (checkingLock) {
    return (
      <div className="md-form-page">
        <div className="md-form-container" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Checking step status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="md-form-page">
      {/* Breadcrumb */}
      <button
        type="button"
        onClick={() => {
          if (isWizardFlow && draftCompanyId) {
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
        <div className="md-form-eyebrow">
          {isWizardFlow && wizardStepIndex >= 0 ? `Step ${wizardStepIndex + 1} of 7` : title}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <h1 className="md-form-title">
              {isWizardFlow ? title : `${isEditMode ? 'Edit' : 'Create'} ${title}`}
            </h1>
            <p className="md-form-description">{description}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            {/* Auto-fill button for testing - only show when creating new records */}
            {!isLocked && !isEditMode && (
              <button
                type="button"
                className="md-form-button"
                onClick={handleAutoFill}
                style={{ 
                  backgroundColor: '#f3f4f6', 
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  whiteSpace: 'nowrap'
                }}
                title="Fill form with sample data for testing"
              >
                <Zap className="md-form-button-icon" style={{ width: '16px', height: '16px' }} />
                <span>Auto-Fill Sample Data</span>
              </button>
            )}
            {isArrayBasedForm && !isLocked && !isEditMode && (
              <button
                type="button"
                className="md-form-button md-form-button-primary"
                onClick={() => {
                  if (isConsigneeProfile) handleAddConsignee()
                  else if (isPayerProfile) handleAddPayer()
                  else if (isEmployeeProfile) handleAddEmployee()
                  else if (isPaymentTerms) handleAddPaymentTerm()
                }}
                style={{ whiteSpace: 'nowrap' }}
              >
                <Plus className="md-form-button-icon" />
                <span>
                  {isConsigneeProfile && 'Add Consignee'}
                  {isPayerProfile && 'Add Payer'}
                  {isEmployeeProfile && 'Add Employee'}
                  {isPaymentTerms && 'Add Payment Term'}
                </span>
              </button>
            )}
          </div>
          {isLocked && (
            <div style={{ marginTop: '0.5rem', padding: '0.75rem 1rem', backgroundColor: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '6px', color: '#92400e' }}>
              <strong>Step Locked:</strong> This step has been completed. Data is view-only.
            </div>
          )}
        </div>
      </div>

      {/* Form Container */}
      <form className="md-form-container" onSubmit={(e) => { e.preventDefault(); onSubmit(e); }}>
        <div className="md-form-body">
          {/* Company linkage (required for non-company modules) */}
          {type !== 'company-profile' && (
            <div className="md-form-group">
              <div className="md-form-group-title">Linked Company</div>
              <div className="md-form-grid">
                <div className="md-form-field md-form-field-full">
                  <label className="md-form-label" htmlFor="linkedCompanySelect">
                    Company <span className="md-form-required">*</span>
                  </label>
                  <select
                    id="linkedCompanySelect"
                    className="md-form-select"
                    value={selectedCompanyId}
                    disabled={isLocked || isEditMode || isWizardFlow || companyOptionsLoading}
                    onChange={(e) => {
                      setSelectedCompanyId(e.target.value)
                      setStatus({ kind: 'idle', message: '' })
                    }}
                  >
                    <option value="">Select company...</option>
                    {companyOptions.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company?.values?.companyName || 'Unnamed Company'}
                      </option>
                    ))}
                  </select>

                  {!companyOptionsLoading && companyOptions.length === 0 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      No company profiles found. Create a company profile first, then link this module to it.
                      <div style={{ marginTop: '0.5rem' }}>
                        <button
                          type="button"
                          className="md-form-button md-form-button-secondary"
                          onClick={() => navigate('/master-data/new/company-profile')}
                        >
                          Create Company Profile
                        </button>
                      </div>
                    </div>
                  )}

                  {isEditMode && !selectedCompanyId && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#92400e' }}>
                      This record is missing a company link. Please re-save it after selecting a company (create mode).
                    </div>
                  )}
                </div>
              </div>
              <div className="md-form-group-divider" />
            </div>
          )}
          {isArrayBasedForm ? (
            /* Render array-based forms */
            isConsigneeProfile ? consignees.map((consignee, index) => renderConsigneeForm(consignee, index))
            : isPayerProfile ? payers.map((payer, index) => renderPayerForm(payer, index))
            : isEmployeeProfile ? employees.map((employee, index) => renderEmployeeForm(employee, index))
            : isPaymentTerms ? paymentTerms.map((paymentTerm, index) => renderPaymentTermForm(paymentTerm, index))
            : null
          ) : (
            /* Regular form rendering */
            def.groups.map((group, groupIndex) => {
              const entries = group.allowMultiple ? (multipleEntries[groupIndex] || [0]) : [0]
            
            return (
              <div key={groupIndex} className="md-form-group">
                {group.title && (
                  <div className="md-form-group-title">{group.title}</div>
                )}
                
                {entries.map((entryIndex, entryArrayIndex) => (
                  <div key={entryIndex} className="md-form-entry-block">
                    {group.allowMultiple && (
                      <div className="md-form-entry-header">
                        <span className="md-form-entry-number">Entry {entryArrayIndex + 1}</span>
                        {entries.length > 1 && (
                          <button
                            type="button"
                            className="md-form-entry-remove"
                            onClick={() => handleRemoveEntry(groupIndex, entryIndex)}
                            aria-label="Remove entry"
                          >
                            <X className="md-form-entry-remove-icon" />
                          </button>
                        )}
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
                                      disabled={isLocked}
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
                                disabled={isLocked}
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
                                disabled={isLocked || !getStateOptions(f.key, group.allowMultiple ? entryIndex : null, group.fields).length}
                                onChange={(e) => onChange(f.key, e.target.value, group.allowMultiple ? entryIndex : null)}
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
                                disabled={isLocked}
                                readOnly={isLocked}
                                onChange={(e) => onChange(f.key, e.target.value, group.allowMultiple ? entryIndex : null)}
                                placeholder={`Enter ${f.label.toLowerCase()}...`}
                              />
                            ) : f.type === 'select' ? (
                              <>
                                <select
                                  id={fieldId}
                                  className="md-form-select"
                                  value={values[fieldKey] || ''}
                                  disabled={isLocked}
                                  onChange={(e) => onChange(f.key, e.target.value, group.allowMultiple ? entryIndex : null)}
                                >
                                  <option value="">Select {f.label.toLowerCase()}...</option>
                                  {f.options?.map((option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                  <option value="Other">Other</option>
                                </select>
                                {values[fieldKey] === 'Other' && (
                                  <input
                                    id={`${fieldKey}Other`}
                                    className="md-form-input md-form-input-other"
                                    type="text"
                                    disabled={isLocked}
                                    readOnly={isLocked}
                                    value={values[`${fieldKey}Other`] || ''}
                                    onChange={(e) => onChange(`${f.key}Other`, e.target.value, group.allowMultiple ? entryIndex : null)}
                                    placeholder={`Enter ${f.label.toLowerCase()}...`}
                                  />
                                )}
                              </>
                    ) : f.type === 'date' || f.type === 'datetime' ? (
                      <DatePicker
                        id={fieldId}
                        name={fieldKey}
                        selected={values[fieldKey] || ''}
                        disabled={isLocked}
                        required={f.required}
                        showTimeSelect={f.type === 'datetime'}
                        onChange={(e) => onChange(f.key, e.target.value, group.allowMultiple ? entryIndex : null)}
                        placeholderText={`Select ${f.label.toLowerCase()}...`}
                      />
                    ) : (
                      <input
                        id={fieldId}
                        className="md-form-input"
                        type={f.type}
                        value={values[fieldKey] || ''}
                        disabled={isLocked}
                        readOnly={isLocked}
                        onChange={(e) => onChange(f.key, e.target.value, group.allowMultiple ? entryIndex : null)}
                        placeholder={`Enter ${f.label.toLowerCase()}...`}
                      />
                    )}
                          </div>
                        )
                      })}
                    </div>
                    
                  </div>
                ))}
                
                {group.allowMultiple && !isArrayBasedForm && !isLocked && (
                  <div className="md-form-entry-add-wrapper">
                    <button
                      type="button"
                      className="md-form-button md-form-button-add"
                      onClick={() => handleAddEntry(groupIndex)}
                    >
                      <Plus className="md-form-button-icon" />
                      <span>
                        {type === 'payer-profile' && groupIndex === 0
                          ? 'Add New Payer'
                          : type === 'employee-profile' && groupIndex === 0
                          ? 'Add New Employee'
                          : `Add ${group.title}`}
                      </span>
                    </button>
                  </div>
                )}
                
                {groupIndex < def.groups.length - 1 && <div className="md-form-group-divider" />}
              </div>
            )
          })
          )}
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
            disabled={savingInProgress}
          >
            {isLocked ? 'Back to Index' : 'Cancel'}
          </button>
          {!isLocked && (
            <>
              <button
                type="button"
                className="md-form-button md-form-button-secondary"
                onClick={handleSaveAndContinue}
                disabled={savingInProgress}
              >
                Save & Continue
              </button>
              <button
                type="submit"
                className="md-form-button md-form-button-primary"
                disabled={savingInProgress || (!isWizardFlow && requiredMissing)}
              >
                {savingInProgress ? 'Saving...' : (isWizardFlow ? 'Save Draft' : 'Save')}
              </button>
            </>
          )}
          {isLocked && (
            <button
              type="button"
              className="md-form-button md-form-button-primary"
              onClick={() => navigate('/master-data/review')}
            >
              View on Review Page
            </button>
          )}
        </div>
      </form>

      {/* Save Options Modal */}
      {showSaveOptions && (
        <div className="md-save-options-overlay" onClick={() => setShowSaveOptions(false)}>
          <div className="md-save-options-modal" onClick={(e) => e.stopPropagation()}>
            <div className="md-save-options-header">
              <CheckCircle2 className="md-save-options-icon" style={{ color: '#10b981' }} />
              <h3 className="md-save-options-title">{isEditMode ? 'Record Updated Successfully!' : 'Record Saved Successfully!'}</h3>
              <p className="md-save-options-description">
                What would you like to do next?
              </p>
            </div>
            <div className="md-save-options-actions">
              <button
                type="button"
                className="md-form-button md-form-button-primary"
                onClick={isEditMode ? () => setShowSaveOptions(false) : handleSaveAndCreateAnother}
                style={{ flex: 1 }}
              >
                {isEditMode ? (
                  <span>Continue Editing</span>
                ) : (
                  <>
                    <Plus className="md-form-button-icon" />
                    <span>Save & Create Another</span>
                  </>
                )}
              </button>
              <button
                type="button"
                className="md-form-button md-form-button-secondary"
                onClick={handleSaveAndExit}
                style={{ flex: 1 }}
              >
                {isEditMode ? 'Back to Records' : 'Save & Exit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MasterDataForm
