import { useState, useEffect, useMemo } from 'react'
import { getPONumberPrefix } from '../utils/numbering'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Plus, X, Trash2, ToggleLeft, ToggleRight, RotateCcw, Zap } from 'lucide-react'
import DatePicker from '../components/DatePicker'
import { useMasterData } from '../contexts/MasterDataContext'
import { useToast } from '../contexts/ToastContext'
import * as poEntryService from '../services/poEntryService'
import { getPODraft, upsertPODraft, getPOById } from '../api/po'
import { useFormPersistence } from '../hooks/useFormPersistence'
import { INDIA_STATES, COUNTRIES } from '../utils/indiaStates'
import '../styles/POEntry.css'

const BUSINESS_UNITS = ['MAIN', 'UNIT1', 'UNIT2', 'UNIT3', 'Other']
const PO_CATEGORIES = ['Supply', 'Service', 'Supply & Service', 'AMC', 'Freight', 'Civil']
const BOQ_HEADERS = ['Supply', 'Service', 'AMC', 'Freight', 'Civil']
const SEGMENTS = ['Domestic', 'Export']
const ZONES = ['North', 'East', 'West', 'South']
const PAYMENT_TYPES = ['Secured','Unsecured', 'Govt', 'Other']
const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'Other']
const INSURANCE_TYPES = ['Marine Insurance', 'Group Accidental Policy', 'Workmen Compensation Policy', 'All Erection Policy', 'Others']
const BANK_GUARANTEE_TYPES = ['Advance Bank Guarantee', 'Performance Bank Guarantee', 'Bid Security', 'Retention', 'Others']
const PAYMENT_PERCENTAGE_OPTIONS = ['10', '20', '30', '40', '50', '60', '70', '80', '90', '100']
const PAYMENT_FREIGHT_OPTIONS = ['0', '500', '1000', '1500', '2000', '2500', '5000']
const PAYMENT_GST_OPTIONS = ['0', '5', '12', '18', '28']

const createPaymentDue = (key, label) => ({
  key,
  label,
  percentage: '',
  freight: '',
  gst: '',
})

const defaultPaymentDues = [
  createPaymentDue('firstDue', '1st Due'),
  createPaymentDue('secondDue', '2nd Due'),
  createPaymentDue('thirdDue', '3rd Due'),
  createPaymentDue('finalDue', 'Final Due'),
]

function POEntry() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { getCustomers, getEmployees, getCompanies } = useMasterData()
  const { showToast } = useToast()
  const [customers, setCustomers] = useState([])
  const [employees, setEmployees] = useState([])
  const [companies, setCompanies] = useState([])
  const [showFieldSelector, setShowFieldSelector] = useState(false)
  const [availableFields, setAvailableFields] = useState([])
  const [hiddenFieldKeys, setHiddenFieldKeys] = useState([])
  
  const defaultFormData = {
    poCategory: '',
    customerId: '',
    customerName: '',
    
    legalEntityName: '',
    
    customerAddress: '',
    
    customerDistrict: '',
    
    customerState: '',
    
    customerCountry: 'India',
    
    customerPinCode: '',
    
    customerGSTIN: '',
    
    businessUnit: '',
    
    segment: '',
    
    zone: '',
    
    contractAgreementNo: '',
    
    contractAgreementDate: '',
    
    poNumber: '',
    poNumberSuffix: '',
    
    poDate: '',
    
    loiNumber: '',
    
    loiDate: '',
    
    loaNumber: '',
    
    loaDate: '',
    
    tenderNumber: '',
    
    tenderDate: '',
    
    projectDescription: '',
    
    paymentType: '',
    
    poPaymentTerms: '',
    paymentDueRows: defaultPaymentDues,
    
    paymentTermsClauseInPO: '',
    
    insuranceType: '',
    
    insurancePolicyNumber: '',
    
    insurancePolicyDate: '',
    
    insurancePolicyCompany: '',
    
    insurancePolicyValidUpto: '',
    
    insurancePolicyClauseInPO: '',
    
    insurancePolicyRemarks: '',
    
    bankGuaranteeType: '',
    
    bankGuaranteeNumber: '',
    
    bankGuaranteeDate: '',
    
    bankGuaranteeValue: '',
    
    bankName: '',
    
    bankGuaranteeValidity: '',
    
    bankGuaranteeReleaseValidityClauseInPO: '',
    
    bankGuaranteeRemarks: '',
    
    salesManagerId: '',
    
    salesHeadId: '',
    
    businessHeadId: '',
    
    projectManagerId: '',
    
    projectHeadId: '',
    
    collectionInchargeId: '',
    
    salesAgentName: '',
    
    salesAgentCommission: '',
    
    collectionAgentName: '',
    
    collectionAgentCommission: '',
    
    deliveryScheduleClause: '',
    
    liquidatedDamagesClause: '',
    
    lastDateOfDelivery: '',
    
    poValidity: '',
    
    poSignedConcernName: '',
    
    boqEnabled: true,

    poValue: '',
    poCurrency: 'INR',
    
    businessUnitOther: '',
    segmentOther: '',
    zoneOther: '',
    paymentTypeOther: '',
    poCurrencyOther: '',
    customerStateOther: '',
    insuranceTypeOther: '',
    bankGuaranteeTypeOther: '',
  }

  const {
    values: persistedData,
    setValues: setPersistedData,
    loading: persistenceLoading,
    saving: persistenceSaving,
    save: persistenceSave,
    load: persistenceLoad,
    clearLocalDraft,
  } = useFormPersistence({
    saveFn: async (data, entityId) => {
      const customerId = String(data.formData?.customerId || '').trim();
      if (!customerId) {
        console.warn('[POEntry] Skipping draft save: customerId is required');
        return null;
      }
      const saveData = {
        ...data.formData,
        customerId: customerId, // Explicitly set to ensure it's sent
        boqItems: data.boqItems || [],
      }
      const result = await upsertPODraft(saveData, entityId || id)
      if (result && (result.id || result.po_number)) {
        return {
          id: result.id,
          values: {
            formData: {
              ...data.formData,
              id: result.id ?? data.formData?.id,
              poNumber: result.po_number ?? result.poNumber ?? data.formData?.poNumber,
            },
          },
        }
      }
      return result
    },
    loadFn: async (entityIdParam) => {
      const poId = entityIdParam ?? id
      const emptyBoq = [{
        id: 1,
        boqHeader: '',
        materialDescription: '',
        originalQty: '',
        amendedQty: '',
        totalQty: '',
        uom: '',
        unitPrice: '',
        totalBasicAmount: '',
        freight: '',
        gstPercent: '',
        gstAmount: '',
        totalAmount: '',
      }]
      const normalizeForm = (fd) =>
        Object.fromEntries(
          Object.entries(fd || {}).map(([k, v]) => [k, v === undefined || v === null ? '' : v])
        )
      const normalizeBoq = (items) =>
        Array.isArray(items) && items.length > 0
          ? items.map((item, idx) => ({
              id: item.id ?? idx + 1,
              boqHeader: item.boqHeader ?? '',
              materialDescription: item.materialDescription ?? '',
              originalQty: item.originalQty ?? item.quantity ?? '',
              amendedQty: item.amendedQty ?? '',
              totalQty: item.totalQty ?? item.quantity ?? '',
              uom: item.uom ?? '',
              unitPrice: item.unitPrice ?? '',
              totalBasicAmount: item.totalBasicAmount ?? '',
              freight: item.freight ?? '',
              gstPercent: item.gstPercent ?? '',
              gstAmount: item.gstAmount ?? item.gst ?? '',
              totalAmount: item.totalAmount ?? item.totalCost ?? '',
            }))
          : emptyBoq

      const FETCH_TIMEOUT_MS = 8000
      const withTimeout = (p, ms) =>
        Promise.race([
          p,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Load timed out. Check your connection.')), ms)
          ),
        ])

      if (poId) {
        try {
          const response = await withTimeout(getPOById(poId), FETCH_TIMEOUT_MS)
          const poEntry = response?.data ?? response
          const row = poEntry?.data ?? poEntry
          if (row?.formData != null && Array.isArray(row.boqItems)) {
            return {
              formData: {
                ...normalizeForm(row.formData),
                id: row.id,
                poNumber: row.formData.poNumber ?? row.po_number ?? '',
                poDate: row.formData.poDate ?? row.issue_date ?? '',
                customerId: row.formData.customerId ?? row.customer_id ?? '',
                customerName: row.formData.customerName ?? '',
                status: row.status ?? row.formData?.status ?? '',
              },
              boqItems: normalizeBoq(row.boqItems),
            }
          }
          if (row?.draft_data) {
            try {
              const parsed = typeof row.draft_data === 'string' ? JSON.parse(row.draft_data) : row.draft_data
              if (parsed?.formData) {
                return {
                  formData: {
                    ...normalizeForm(parsed.formData),
                    id: row.id,
                    status: row.status ?? parsed.formData?.status ?? '',
                  },
                  boqItems: normalizeBoq(parsed.boqItems),
                }
              }
            } catch (_) {}
          }
          if (row) {
            return {
              formData: normalizeForm({
                id: row.id,
                poNumber: row.po_number ?? row.poNumber ?? '',
                poDate: row.issue_date ?? row.poDate ?? '',
                customerId: row.customer_id ?? row.customerId ?? '',
                customerName: row.customer_name ?? row.customerName ?? '',
                status: row.status ?? '',
              }),
              boqItems: normalizeBoq(row.boqItems),
            }
          }
        } catch (err) {
          console.error('[POEntry] Failed to load PO:', err)
        }
        return null
      }

      try {
        const draft = await getPODraft(poId || null)
        if (draft) {
          const { boqItems: loadedBoqItems, ...rest } = draft
          return {
            formData: {
              ...normalizeForm(rest),
              id: draft.id,
              poNumber: rest.poNumber ?? rest.po_number ?? '',
              status: rest.status ?? '',
            },
            boqItems: normalizeBoq(loadedBoqItems),
          }
        }
      } catch (err) {
        console.error('[POEntry] Failed to load draft:', err)
      }
      return null
    },
    entityType: 'po',
    entityId: id || null,
    storagePathKey: 'po-entry',
    defaultValues: {
      formData: defaultFormData,
      boqItems: [{
        id: 1,
        boqHeader: '',
        materialDescription: '',
        originalQty: '',
        amendedQty: '',
        totalQty: '',
        uom: '',
        unitPrice: '',
        totalBasicAmount: '',
        freight: '',
        gstPercent: '',
        gstAmount: '',
        totalAmount: '',
      }],
    },
    enableAutoSave: (values) => {
      const status = (values?.formData?.status || '').toString().toLowerCase();
      const customerId = String(values?.formData?.customerId || '').trim();
      return status !== 'approved' && customerId !== '';
    },
    autoSaveDelay: 2000,
  })

  const rawForm = { ...defaultFormData, ...(persistedData.formData || {}) }
  const formData = Object.fromEntries(
    Object.entries(rawForm).map(([k, v]) => [k, v === undefined || v === null ? '' : v])
  )
  const boqItems = persistedData.boqItems || [{
    id: 1,
    boqHeader: '',
    materialDescription: '',
    originalQty: '',
    amendedQty: '',
    totalQty: '',
    uom: '',
    unitPrice: '',
    totalBasicAmount: '',
    freight: '',
    gstPercent: '',
    gstAmount: '',
    totalAmount: '',
  }]

  const setFormData = (updater) => {
    if (typeof updater === 'function') {
      setPersistedData(prev => ({
        ...prev,
        formData: updater(prev.formData || defaultFormData),
      }))
    } else {
      setPersistedData(prev => ({
        ...prev,
        formData: updater,
      }))
    }
  }

  const setBoqItems = (updater) => {
    if (typeof updater === 'function') {
      setPersistedData(prev => ({
        ...prev,
        boqItems: updater(prev.boqItems || []),
      }))
    } else {
      setPersistedData(prev => ({
        ...prev,
        boqItems: updater,
      }))
    }
  }

  const poNumberPrefix = useMemo(
    () => getPONumberPrefix(formData.businessUnit, formData.poDate, formData.businessUnitOther),
    [formData.businessUnit, formData.poDate, formData.businessUnitOther],
  )

  useEffect(() => {
    const prefix = getPONumberPrefix(formData.businessUnit, formData.poDate, formData.businessUnitOther)
    const pn = String(formData.poNumber || '').trim()
    const suffixRaw = String(formData.poNumberSuffix ?? '').trim()

    if (pn && suffixRaw === '') {
      if (pn.startsWith(prefix)) {
        const extracted = pn.slice(prefix.length)
        setFormData((prev) => ({
          ...prev,
          poNumberSuffix: extracted === '0' ? '' : extracted,
        }))
        return
      }
      const m = pn.match(/^PO-([^-]+)-(\d{8})-(.+)$/)
      if (m && m[3]) {
        setFormData((prev) => ({
          ...prev,
          poNumberSuffix: m[3] === '0' ? '' : m[3],
        }))
        return
      }
    }

    const suffix = String(formData.poNumberSuffix ?? '').trim()
    const effectiveSuffix = suffix === '0' ? '' : suffix
    const combined = effectiveSuffix ? `${prefix}${effectiveSuffix}` : ''
    if (combined !== pn) {
      setFormData((prev) => ({ ...prev, poNumber: combined }))
    }
  }, [
    formData.businessUnit,
    formData.poDate,
    formData.businessUnitOther,
    formData.poNumberSuffix,
    formData.poNumber,
    poNumberPrefix,
  ])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('poEntryHiddenFields')
      const parsed = saved ? JSON.parse(saved) : []
      setHiddenFieldKeys(Array.isArray(parsed) ? parsed : [])
    } catch {
      setHiddenFieldKeys([])
    }
  }, [])

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll('.po-entry-form .po-entry-field'))
    const collected = []

    nodes.forEach((node) => {
      const labelEl = node.querySelector('.po-entry-label')
      const rawLabel = (labelEl?.textContent || '').replace(/\s+/g, ' ').trim()
      if (!rawLabel) return
      const cleanLabel = rawLabel.replace('*', '').trim()
      const key = cleanLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      node.setAttribute('data-field-key', key)
      if (!collected.some((item) => item.key === key)) {
        collected.push({ key, label: cleanLabel })
      }
    })

    setAvailableFields((prev) => {
      const prevKeys = prev.map((item) => item.key).join('|')
      const nextKeys = collected.map((item) => item.key).join('|')
      return prevKeys === nextKeys ? prev : collected
    })

    nodes.forEach((node) => {
      const key = node.getAttribute('data-field-key')
      node.style.display = key && hiddenFieldKeys.includes(key) ? 'none' : ''
    })
  }, [hiddenFieldKeys, formData, boqItems])

  useEffect(() => {
    try {
      localStorage.setItem('poEntryHiddenFields', JSON.stringify(hiddenFieldKeys))
    } catch {
      // Ignore storage write failure.
    }
  }, [hiddenFieldKeys])

  useEffect(() => {
    const customersData = getCustomers()
    const employeesData = getEmployees()
    const companiesData = getCompanies()
    
    setCustomers(Array.isArray(customersData) ? customersData : [])
    setEmployees(Array.isArray(employeesData) ? employeesData : [])
    setCompanies(Array.isArray(companiesData) ? companiesData : [])
  }, [getCustomers, getEmployees, getCompanies])
  
  const boqTotals = useMemo(() => {
    let totalExWorks = 0
    let totalFreight = 0
    let totalGST = 0
    let totalPOValue = 0

    if (!Array.isArray(boqItems)) {
      console.warn('boqItems is not an array:', boqItems)
      return {
        totalExWorks: '0.00',
        totalFreight: '0.00',
        totalGST: '0.00',
        totalPOValue: '0.00',
      }
    }

    boqItems.forEach((item) => {
      const totalBasicAmount = parseFloat(item.totalBasicAmount) || 0
      const freight = parseFloat(item.freight) || 0
      const gstAmount = parseFloat(item.gstAmount) || 0
      const totalAmount = parseFloat(item.totalAmount) || 0

      totalExWorks += totalBasicAmount
      totalFreight += freight
      totalGST += gstAmount
      totalPOValue += totalAmount
    })

    return {
      totalExWorks: totalExWorks.toFixed(2),
      totalFreight: totalFreight.toFixed(2),
      totalGST: totalGST.toFixed(2),
      totalPOValue: totalPOValue.toFixed(2),
    }
  }, [boqItems])

  const boqHeaderOptions = useMemo(() => {
    const selected = String(formData.poCategory || '').trim()
    if (!selected) return BOQ_HEADERS
    if (selected === 'Supply & Service') return BOQ_HEADERS
    if (BOQ_HEADERS.includes(selected)) return [selected]
    return BOQ_HEADERS
  }, [formData.poCategory])

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      poValue: boqTotals.totalPOValue,
    }))
  }, [boqTotals.totalPOValue])

  useEffect(() => {
    const selected = String(formData.poCategory || '').trim()
    if (!selected || selected === 'Supply & Service' || !BOQ_HEADERS.includes(selected)) return
    setBoqItems((prev) =>
      (Array.isArray(prev) ? prev : []).map((item) => ({ ...item, boqHeader: selected }))
    )
  }, [formData.poCategory])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const parseNumeric = (value) => {
    const num = Number(value)
    return Number.isFinite(num) ? num : 0
  }

  const toCurrencyNumber = (num) => Math.round((num + Number.EPSILON) * 100) / 100

  const toOrdinal = (n) => {
    const rem100 = n % 100
    if (rem100 >= 11 && rem100 <= 13) return `${n}th`
    const rem10 = n % 10
    if (rem10 === 1) return `${n}st`
    if (rem10 === 2) return `${n}nd`
    if (rem10 === 3) return `${n}rd`
    return `${n}th`
  }

  const paymentDueRows = useMemo(() => {
    const incoming = Array.isArray(formData.paymentDueRows) ? formData.paymentDueRows : []
    if (incoming.length === 0) return defaultPaymentDues
    return incoming.map((row, idx) => ({
      key: row.key || `due${idx + 1}`,
      label: row.label || `${toOrdinal(idx + 1)} Due`,
      percentage: row.percentage ?? '',
      freight: row.freight ?? '',
      gst: row.gst ?? '',
    }))
  }, [formData.paymentDueRows])

  const paymentTermsTotals = useMemo(() => {
    const totalBasicAmount = parseNumeric(formData.poValue)
    let totalDuePercentage = 0
    let totalFreight = 0
    let totalTaxes = 0
    let totalAmount = 0

    const dueSummaries = paymentDueRows.map((row) => {
      const pct = parseNumeric(row.percentage)
      const freight = parseNumeric(row.freight)
      const gstPct = parseNumeric(row.gst)
      const basic = toCurrencyNumber((totalBasicAmount * pct) / 100)
      const taxes = toCurrencyNumber((basic + freight) * (gstPct / 100))
      const lineTotal = toCurrencyNumber(basic + freight + taxes)

      totalDuePercentage += pct
      totalFreight += freight
      totalTaxes += taxes
      totalAmount += lineTotal

      return {
        ...row,
        basic,
        taxes,
        total: lineTotal,
      }
    })

    return {
      dueSummaries,
      totalDuePercentage,
      totalFreight: toCurrencyNumber(totalFreight),
      totalTaxes: toCurrencyNumber(totalTaxes),
      totalAmount: toCurrencyNumber(totalAmount),
    }
  }, [formData.poValue, paymentDueRows])

  const handlePaymentDueChange = (dueKey, field, value) => {
    setFormData((prev) => {
      const currentRows = Array.isArray(prev.paymentDueRows) ? prev.paymentDueRows : defaultPaymentDues
      const nextRows = currentRows.map((row) => (
        row.key === dueKey ? { ...row, [field]: value } : row
      ))
      return { ...prev, paymentDueRows: nextRows }
    })
  }

  const handleAddPaymentDue = () => {
    setFormData((prev) => {
      const currentRows = Array.isArray(prev.paymentDueRows) ? prev.paymentDueRows : defaultPaymentDues
      const finalIndex = currentRows.findIndex((row) => row.key === 'finalDue')
      const existingCustomNumbers = currentRows
        .map((row) => Number.parseInt(String(row.key || '').replace(/^due/, ''), 10))
        .filter((num) => Number.isFinite(num))
      const nextCustomNumber = existingCustomNumbers.length > 0 ? Math.max(...existingCustomNumbers) + 1 : 4
      const nextDue = createPaymentDue(`due${nextCustomNumber}`, `${toOrdinal(nextCustomNumber)} Due`)
      const baseRows = finalIndex >= 0
        ? [...currentRows.slice(0, finalIndex), nextDue, ...currentRows.slice(finalIndex)]
        : [...currentRows, nextDue]
      return { ...prev, paymentDueRows: baseRows }
    })
  }

  const handleRemovePaymentDue = (dueKey) => {
    setFormData((prev) => {
      const currentRows = Array.isArray(prev.paymentDueRows) ? prev.paymentDueRows : defaultPaymentDues
      const nextRows = currentRows.filter((row) => row.key !== dueKey)
      return { ...prev, paymentDueRows: nextRows.length > 0 ? nextRows : defaultPaymentDues }
    })
  }

  const handleAddAdvancePaymentDue = () => {
    setFormData((prev) => {
      const currentRows = Array.isArray(prev.paymentDueRows) ? prev.paymentDueRows : defaultPaymentDues
      if (currentRows.some((row) => row.key === 'advancePayment')) {
        return prev
      }

      const finalIndex = currentRows.findIndex((row) => row.key === 'finalDue')
      const advanceDue = createPaymentDue('advancePayment', 'Advance Payment')
      const nextRows = finalIndex >= 0
        ? [advanceDue, ...currentRows.slice(0, finalIndex), currentRows[finalIndex]]
        : [advanceDue, ...currentRows]

      return { ...prev, paymentDueRows: nextRows }
    })
  }

  const first = (v) => (Array.isArray(v) ? v[0] : v)

  const val = (v, key) => {
    if (!v || !key) return ''
    const direct = v[key]
    if (direct !== undefined && direct !== null && direct !== '') return String(direct)
    const withZero = v[`${key}_0`]
    if (withZero !== undefined && withZero !== null && withZero !== '') return String(withZero)
    return Array.isArray(direct) ? (direct[0] != null ? String(direct[0]) : '') : ''
  }

  const handleCustomerChange = (e) => {
    const customerId = e.target.value
    const customer = customers.find((c) => c.id === customerId)
    
    if (customer) {
      const v = customer.values || customer
      const address = val(v, 'correspondenceAddress') || val(v, 'corporateOfficeAddress') || first(v.correspondenceAddress) || first(v.corporateOfficeAddress) || ''
      const district = (val(v, 'district') || first(v.district)) ?? v.district ?? ''
      const state = (val(v, 'state') || first(v.state)) ?? v.state ?? ''
      const country = (val(v, 'country') || first(v.country)) ?? v.country ?? 'India'
      const pinCode = (val(v, 'pinCode') || first(v.pinCode)) ?? v.pinCode ?? ''
      setFormData((prev) => ({
        ...prev,
        customerId,
        customerName: v.customerName || customer.customerName || customer.name || '',
        legalEntityName: v.legalEntityName || customer.legalEntityName || '',
        customerAddress: address || v.customerAddress || customer.customerAddress || customer.address || '',
        customerDistrict: district || v.customerDistrict || customer.customerDistrict || customer.district || '',
        customerState: state || v.customerState || customer.customerState || customer.state || '',
        customerCountry: country || v.customerCountry || customer.customerCountry || customer.country || 'India',
        customerPinCode: pinCode || v.customerPinCode || customer.customerPinCode || customer.pinCode || '',
        customerGSTIN: v.gstNo || customer.gstNo || customer.gstin || '',
        segment: v.segment || customer.segment || '',
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        customerId: '',
        customerName: '',
        legalEntityName: '',
        customerAddress: '',
        customerDistrict: '',
        customerState: '',
        customerCountry: 'India',
        customerPinCode: '',
        customerGSTIN: '',
        segment: '',
      }))
    }
  }

  const handleAddBOQItem = () => {
    const newId = Math.max(...boqItems.map((item) => item.id), 0) + 1
    setBoqItems([
      ...boqItems,
      {
        id: newId,
        boqHeader: '',
        materialDescription: '',
        originalQty: '',
        amendedQty: '',
        totalQty: '',
        uom: '',
        unitPrice: '',
        totalBasicAmount: '',
        freight: '',
        gstPercent: '',
        gstAmount: '',
        totalAmount: '',
      },
    ])
  }

  const handleRemoveBOQItem = (id) => {
    if (boqItems.length > 1) {
      setBoqItems(boqItems.filter((item) => item.id !== id))
    }
  }

  const handleBOQItemChange = (id, field, value) => {
    setBoqItems(
      boqItems.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value }
          
          const originalQty = parseFloat(updated.originalQty) || 0
          const amendedQty = parseFloat(updated.amendedQty) || 0
          const totalQty = originalQty + amendedQty
          const unitPrice = parseFloat(updated.unitPrice) || 0
          const freight = parseFloat(updated.freight) || 0
          const gstPercent = parseFloat(updated.gstPercent) || 0
          
          const totalBasicAmount = totalQty * unitPrice
          const gstAmount = (totalBasicAmount + freight) * (gstPercent / 100)
          const totalAmount = totalBasicAmount + freight + gstAmount

          updated.totalQty = totalQty > 0 ? totalQty.toFixed(2) : ''
          updated.totalBasicAmount = totalBasicAmount > 0 ? totalBasicAmount.toFixed(2) : ''
          updated.gstAmount = gstAmount > 0 ? gstAmount.toFixed(2) : ''
          updated.totalAmount = totalAmount > 0 ? totalAmount.toFixed(2) : ''
          
          return updated
        }
        return item
      })
    )
  }

  const handleSaveDraft = async () => {
    try {
      const result = await persistenceSave(true)
      if (result?.id && !id) {
        navigate(`/po-entry/${result.id}`, { replace: true })
      }
      showToast('Draft saved successfully!', 'success')
    } catch (error) {
      console.error('Failed to save draft:', error)
      showToast('Failed to save draft. Please try again.', 'error')
    }
  }

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset the form? All unsaved changes will be lost.')) {
      const resetFormData = { ...defaultFormData }
      if (id || formData.id) {
        resetFormData.id = id || formData.id
      }
      
      const resetBoqItems = [{
        id: 1,
        boqHeader: '',
        materialDescription: '',
        originalQty: '',
        amendedQty: '',
        totalQty: '',
        uom: '',
        unitPrice: '',
        totalBasicAmount: '',
        freight: '',
        gstPercent: '',
        gstAmount: '',
        totalAmount: '',
      }]
      
      setPersistedData({
        formData: resetFormData,
        boqItems: resetBoqItems,
      })
      
      if (typeof clearLocalDraft === 'function') {
        clearLocalDraft()
      }
      
      showToast('Form reset successfully!', 'success')
    }
  }

  const handleAutoFill = () => {
    const today = new Date().toISOString().split('T')[0]
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 90)
    const futureDateStr = futureDate.toISOString().split('T')[0]
    
    const getFirstEmployeeId = (employeeList) => {
      return Array.isArray(employeeList) && employeeList.length > 0 ? employeeList[0].id : ''
    }
    
    const sampleBoqItems = [
      {
        id: 1,
        boqHeader: 'Supply',
        materialDescription: 'Steel Beams ISMB 200',
        originalQty: '100',
        amendedQty: '0',
        totalQty: '',
        uom: 'MT',
        unitPrice: '65000',
        freight: '50000',
        gstPercent: '18',
        totalBasicAmount: '',
        gstAmount: '',
        totalAmount: '', // Will be auto-calculated
      },
      {
        id: 2,
        boqHeader: 'Service',
        materialDescription: 'Cement Grade 53',
        originalQty: '500',
        amendedQty: '0',
        totalQty: '',
        uom: 'Bags',
        unitPrice: '450',
        freight: '10000',
        gstPercent: '18',
        totalBasicAmount: '',
        gstAmount: '',
        totalAmount: '', // Will be auto-calculated
      },
      {
        id: 3,
        boqHeader: 'Freight',
        materialDescription: 'Reinforcement Steel Bars',
        originalQty: '50',
        amendedQty: '0',
        totalQty: '',
        uom: 'MT',
        unitPrice: '55000',
        freight: '25000',
        gstPercent: '18',
        totalBasicAmount: '',
        gstAmount: '',
        totalAmount: '', // Will be auto-calculated
      },
    ]
    
    const calculatedBoqItems = sampleBoqItems.map((item) => {
      const originalQty = parseFloat(item.originalQty) || 0
      const amendedQty = parseFloat(item.amendedQty) || 0
      const totalQty = originalQty + amendedQty
      const unitPrice = parseFloat(item.unitPrice) || 0
      const freight = parseFloat(item.freight) || 0
      const gstPercent = parseFloat(item.gstPercent) || 0
      const totalBasicAmount = totalQty * unitPrice
      const gstAmount = (totalBasicAmount + freight) * (gstPercent / 100)
      const calculatedTotal = totalBasicAmount + freight + gstAmount
      return {
        ...item,
        totalQty: totalQty > 0 ? totalQty.toFixed(2) : '',
        totalBasicAmount: totalBasicAmount > 0 ? totalBasicAmount.toFixed(2) : '',
        gstAmount: gstAmount > 0 ? gstAmount.toFixed(2) : '',
        totalAmount: calculatedTotal > 0 ? calculatedTotal.toFixed(2) : '',
      }
    })
    
    setFormData((prev) => ({
      ...prev,
      contractAgreementNo: 'CA/2025-26/001',
      contractAgreementDate: today,
      
      loiNumber: 'LOI/2025-26/001',
      loiDate: today,
      loaNumber: 'LOA/2025-26/001',
      loaDate: today,
      tenderNumber: 'TENDER/2025-26/001',
      tenderDate: today,
      
      projectDescription: 'Supply and installation of structural steel works for commercial building project. Scope includes fabrication, transportation, and erection of steel structures as per approved drawings and specifications.',
      
      paymentType: 'Secured',
      paymentTermsClauseInPO: 'Payment shall be made as per the following schedule: 30% advance payment, 40% on delivery, 20% after 30 days of delivery, and 10% retention after 90 days. All payments subject to GST as applicable.',
      
      insuranceType: 'Marine Insurance',
      insurancePolicyNumber: 'INS/MAR/2025-26/001',
      insurancePolicyDate: today,
      insurancePolicyCompany: 'New India Assurance Company Limited',
      insurancePolicyValidUpto: futureDateStr,
      insurancePolicyClauseInPO: 'The supplier shall arrange comprehensive marine insurance covering all risks from factory to site. Insurance policy shall be valid for the entire duration of the project.',
      insurancePolicyRemarks: 'Insurance coverage includes transit, storage, and erection risks. Policy to be submitted before dispatch.',
      
      bankGuaranteeType: 'Advance Bank Guarantee',
      bankGuaranteeNumber: 'BG/ADV/2025-26/001',
      bankGuaranteeDate: today,
      bankGuaranteeValue: '500000',
      bankName: 'State Bank of India',
      bankGuaranteeValidity: futureDateStr,
      bankGuaranteeReleaseValidityClauseInPO: 'Bank guarantee shall be valid until completion of all contractual obligations and shall be released within 30 days of project completion and acceptance.',
      bankGuaranteeRemarks: 'Bank guarantee to be submitted along with advance payment request. Original document required.',
      
      salesManagerId: getFirstEmployeeId(salesManagers),
      salesHeadId: getFirstEmployeeId(salesHeads),
      businessHeadId: getFirstEmployeeId(businessHeads),
      projectManagerId: getFirstEmployeeId(projectManagers),
      projectHeadId: getFirstEmployeeId(projectHeads),
      collectionInchargeId: getFirstEmployeeId(collectionIncharges),
      salesAgentName: getFirstEmployeeId(salesAgents),
      salesAgentCommission: '2.5',
      collectionAgentName: getFirstEmployeeId(collectionAgents),
      collectionAgentCommission: '1.5',
      
      deliveryScheduleClause: 'Delivery shall be completed within 90 days from the date of purchase order. Partial deliveries are acceptable. All materials must be delivered to the site address mentioned in the PO.',
      liquidatedDamagesClause: 'Liquidated damages at the rate of 0.5% per week of delay, subject to a maximum of 5% of the contract value, shall be applicable for any delay beyond the agreed delivery schedule.',
      lastDateOfDelivery: futureDateStr,
      poValidity: '90 days',
      poSignedConcernName: 'ABC Corporation Private Limited',
      
      businessUnit: prev.businessUnit || 'MAIN',
      segment: prev.segment || 'Domestic',
      zone: prev.zone || 'North',
      poNumberSuffix: (() => {
        const s = prev.poNumberSuffix
        const t = s === undefined || s === null ? '' : String(s).trim()
        if (t === '' || t === '0') return '0001'
        return t
      })(),
    }))
    
    setBoqItems(calculatedBoqItems)
    
    showToast('Sample data filled! You can modify any field as needed.', 'success')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const customerId = String(formData.customerId || '').trim()
    const poCategory = String(formData.poCategory || '').trim()
    const suffixPart = String(formData.poNumberSuffix || '').trim()
    const poNumber = String(formData.poNumber || '').trim()
    const poDate = String(formData.poDate || '').trim()
    
    const missing = []
    if (!poCategory) missing.push('PO Type')
    if (!customerId) missing.push('Customer Name')
    if (!suffixPart || suffixPart === '0') missing.push('PO sequence')
    if (!poNumber) missing.push('PO Number')
    if (!poDate) missing.push('Purchase Order Date')
    if (missing.length > 0) {
      showToast(`Please fill in the required fields: ${missing.join(', ')}`, 'error')
      return
    }
    
    const poEntry = {
      ...formData,
      id: id || formData.id,
      customerId,
      poNumber,
      poDate,
      status: 'approved',
      boqItems,
      boqTotals,
      submittedAt: new Date().toISOString(),
    }
    
    try {
      const savedPO = await poEntryService.savePOEntry(poEntry)
      
      if (savedPO?.id || id) {
        try {
          const refreshedPO = await poEntryService.getPOEntryById(savedPO?.id || id)
          if (refreshedPO) {
            const { boqItems: refreshedBoqItems, ...refreshedFormData } = refreshedPO
            const normalizedForm = {
              ...refreshedFormData,
              poNumber: refreshedFormData.poNumber || refreshedFormData.po_number || poEntry.poNumber,
              poDate:
                refreshedFormData.poDate ||
                refreshedFormData.issue_date ||
                (refreshedFormData.created_at ? String(refreshedFormData.created_at).split('T')[0] : poEntry.poDate),
              customerId: refreshedFormData.customerId || refreshedFormData.customer_id || poEntry.customerId,
              customerName: refreshedFormData.customerName || refreshedFormData.customer_name || poEntry.customerName,
            }
            setPersistedData({
              formData: normalizedForm || {},
              boqItems: Array.isArray(refreshedBoqItems) ? refreshedBoqItems : [],
            })
          }
        } catch (refreshError) {
          console.warn('[POEntry] Failed to refresh PO after save:', refreshError)
        }
      }
      
      showToast('PO Entry submitted successfully!', 'success')
      if (typeof clearLocalDraft === 'function') clearLocalDraft()
      navigate('/po-entry')
    } catch (error) {
      console.error('Failed to save PO Entry:', error)
      showToast('Failed to save PO Entry. Please try again.', 'error')
    }
  }

  const getEmployeesByRole = (roleKeywords) => {
    if (!Array.isArray(employees)) {
      console.warn('employees is not an array:', employees)
      return []
    }
    return employees.filter((emp) => {
      const v = emp.values || {}
      const role = (v.role || v.role_0 || emp.role || emp.designation || '').toLowerCase()
      return roleKeywords.some((keyword) => role.includes(keyword.toLowerCase()))
    })
  }

  const getEmployeeLabel = (emp) => {
    const v = emp.values || {}
    const name = v.nameOfEmployee || v.nameOfEmployee_0 || emp.nameOfEmployee || emp.name || ''
    const des = v.designation || v.designation_0 || emp.designation || ''
    return name + (des ? ` (${des})` : '')
  }

  const salesManagers = getEmployeesByRole(['sales manager'])
  const salesHeads = getEmployeesByRole(['sales head'])
  const projectManagers = getEmployeesByRole(['project manager'])
  const projectHeads = getEmployeesByRole(['project head'])
  const businessHeads = getEmployeesByRole(['business head'])
  const collectionIncharges = getEmployeesByRole(['collection incharge'])
  const salesAgents = getEmployeesByRole(['sales agent'])
  const collectionAgents = getEmployeesByRole(['collection agent'])

  if (id && persistenceLoading) {
    return (
      <div className="po-entry-page">
        <div className="po-entry-header">
          <button type="button" onClick={() => navigate('/po-entry')} className="po-entry-back-button" aria-label="Back">
            <ArrowLeft className="po-entry-back-icon" />
            <span>Back</span>
          </button>
          <div className="po-entry-header-content">
            <h1 className="po-entry-title">PO Entry</h1>
            <p className="po-entry-subtitle">Loading…</p>
          </div>
        </div>
        <div className="po-entry-loading" style={{ padding: '2rem', textAlign: 'center' }}>
          Loading PO data…
        </div>
      </div>
    )
  }

  return (
    <div className="po-entry-page">
      {/* Page Header */}
      <div className="po-entry-header">
        <button
          type="button"
          onClick={() => navigate('/po-entry')}
          className="po-entry-back-button"
          aria-label="Back"
        >
          <ArrowLeft className="po-entry-back-icon" />
          <span>Back</span>
        </button>
        
        <div className="po-entry-header-content">
          <h1 className="po-entry-title">PO Entry</h1>
          <p className="po-entry-subtitle">
            {formData.poCategory ? `Creating ${formData.poCategory} PO` : 'Select PO type to start'}
            {(() => {
              const suf = String(formData.poNumberSuffix || '').trim()
              const show = suf.length > 0 && suf !== '0' && formData.poNumber
              return show ? ` • PO Number: ${formData.poNumber}` : ''
            })()}
          </p>
        </div>
        
        <div className="po-entry-header-actions">
          {!id && (
            <button
              type="button"
              onClick={handleAutoFill}
              className="po-entry-action-button po-entry-action-button-secondary"
              title="Auto-fill sample data for testing (only manual fields)"
            >
              <Zap className="po-entry-action-icon" />
              <span>Auto-Fill Sample Data</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleSaveDraft}
            className="po-entry-action-button po-entry-action-button-secondary"
          >
            <Save className="po-entry-action-icon" />
            <span>Save Draft</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="po-entry-action-button po-entry-action-button-secondary"
            title="Reset form to default values"
          >
            <RotateCcw className="po-entry-action-icon" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={() => setFormData((prev) => ({ ...prev, boqEnabled: !prev.boqEnabled }))}
            className={`po-entry-action-button po-entry-action-button-secondary ${formData.boqEnabled !== false ? 'po-entry-boq-toggle-on' : ''}`}
            title={formData.boqEnabled !== false ? 'BOQ is enabled. Click to hide BOQ section.' : 'BOQ is disabled. Click to show BOQ section.'}
          >
            {formData.boqEnabled !== false ? (
              <ToggleRight className="po-entry-action-icon" aria-hidden />
            ) : (
              <ToggleLeft className="po-entry-action-icon" aria-hidden />
            )}
            <span>BOQ {formData.boqEnabled !== false ? 'On' : 'Off'}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowFieldSelector(true)}
            className="po-entry-action-button po-entry-action-button-secondary"
          >
            <span>Field Selection</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/po-entry')}
            className="po-entry-action-button po-entry-action-button-secondary"
          >
            <span>Back to PO List</span>
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="po-entry-form">
        <div className="po-entry-section">
          <h2 className="po-entry-section-title">PO Manual identification</h2>
          <p className="po-entry-section-lead">
            The prefix follows Business Unit and Purchase Order Date in PO identification below. Enter the sequence to complete the saved PO number.
          </p>
          <div className="po-entry-form-grid">
            <div className="po-entry-field">
              <label htmlFor="poNumberPrefixDisplay" className="po-entry-label">
                PO number prefix
              </label>
              <input
                type="text"
                id="poNumberPrefixDisplay"
                readOnly
                value={poNumberPrefix}
                className="po-entry-input po-entry-input-readonly po-entry-po-prefix-field"
                title="From Business Unit and Purchase Order Date"
                aria-label="PO number prefix, from business unit and purchase order date"
              />
              <small className="po-entry-hint">Auto-filled from Business Unit and Purchase Order Date.</small>
            </div>
            <div className="po-entry-field">
              <label htmlFor="poNumberSuffix" className="po-entry-label">
                PO sequence <span className="po-entry-required">*</span>
              </label>
              <input
                type="text"
                id="poNumberSuffix"
                name="poNumberSuffix"
                value={formData.poNumberSuffix}
                onChange={handleChange}
                onBlur={(e) => {
                  const v = String(e.target.value || '').trim()
                  if (v === '0') {
                    setFormData((prev) => ({ ...prev, poNumberSuffix: '', poNumber: '' }))
                  }
                }}
                className="po-entry-input"
                placeholder="e.g. 0001"
                autoComplete="off"
                required
                aria-describedby="poFullNumberHint"
              />
              <small id="poFullNumberHint" className="po-entry-hint">
                {(() => {
                  const suf = String(formData.poNumberSuffix || '').trim()
                  const eff = suf === '0' ? '' : suf
                  const preview = eff && formData.poNumber ? formData.poNumber : `${poNumberPrefix}…`
                  return (
                    <>
                      Full PO number saved: <span className="po-entry-mono">{preview}</span>
                    </>
                  )
                })()}
              </small>
            </div>
          </div>
        </div>

        <div className="po-entry-section po-entry-section--identification-top">
          <h2 className="po-entry-section-title">PO identification</h2>
          <p className="po-entry-section-lead">
            Select PO type, business unit, and purchase order date. Changing these updates the PO number prefix above.
          </p>
          <div className="po-entry-form-grid">
            <div className="po-entry-field">
              <label htmlFor="poCategory" className="po-entry-label">
                Select Type <span className="po-entry-required">*</span>
              </label>
              <select
                id="poCategory"
                name="poCategory"
                value={formData.poCategory}
                onChange={handleChange}
                className="po-entry-select"
                required
              >
                <option value="">Select PO Type</option>
                {PO_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="po-entry-field">
              <label className="po-entry-label">Created For</label>
              <input
                type="text"
                value={formData.poCategory ? `${formData.poCategory} PO` : 'Not selected'}
                className="po-entry-input po-entry-input-readonly"
                readOnly
              />
            </div>
            <div className="po-entry-field">
              <label htmlFor="businessUnit" className="po-entry-label">
                Business Unit
              </label>
              <select
                id="businessUnit"
                name="businessUnit"
                value={formData.businessUnit}
                onChange={handleChange}
                className="po-entry-select"
              >
                <option value="">Select Business Unit</option>
                {BUSINESS_UNITS.filter((unit) => unit !== 'Other').map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
                <option value="Other">Other</option>
              </select>
              {formData.businessUnit === 'Other' && (
                <input
                  type="text"
                  id="businessUnitOther"
                  name="businessUnitOther"
                  value={formData.businessUnitOther}
                  onChange={handleChange}
                  className="po-entry-input"
                  placeholder="Enter business unit"
                  style={{ marginTop: '8px' }}
                />
              )}
            </div>
            <div className="po-entry-field">
              <label htmlFor="poDate" className="po-entry-label">
                Purchase Order Date <span className="po-entry-required">*</span>
              </label>
              <DatePicker
                selected={formData.poDate}
                onChange={handleChange}
                name="poDate"
                id="poDate"
                required
              />
            </div>
          </div>
        </div>

        {/* Customer & Basic Information */}
        <div className="po-entry-section">
          <h2 className="po-entry-section-title">Customer & Basic Information</h2>
          <div className="po-entry-form-grid">
            <div className="po-entry-field">
              <label htmlFor="customerId" className="po-entry-label">
                Customer Name <span className="po-entry-required">*</span>
              </label>
              <select
                id="customerId"
                name="customerId"
                value={formData.customerId}
                onChange={handleCustomerChange}
                className="po-entry-select"
                required
              >
                <option value="">Select Customer from Master Data</option>
                {Array.isArray(customers) && customers.map((customer) => {
                  const v = customer.values || customer
                  const name = v.customerName || customer.customerName || customer.name || ''
                  const gst = v.gstNo || customer.gstNo || customer.gstin || ''
                  return (
                    <option key={customer.id} value={customer.id}>
                      {name}{gst ? ` (${gst})` : ''}
                    </option>
                  )
                })}
              </select>
              {customers.length === 0 && (
                <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                  No customers found. <a href="/master-data/new/customer-profile" style={{ color: 'var(--color-primary)' }}>Create one in Master Data</a>
                </p>
              )}
              {formData.customerId && (
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px', fontStyle: 'italic' }}>
                  Customer data is fetched from Master Data. Auto-filled fields are read-only.
                </p>
              )}
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="customerName" className="po-entry-label">
                Customer Name (Auto-filled)
              </label>
              <input
                type="text"
                id="customerName"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                className="po-entry-input"
                readOnly
                style={{ background: 'var(--color-bg-tertiary)' }}
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="legalEntityName" className="po-entry-label">
                Legal Entity Name (Auto-filled)
              </label>
              <input
                type="text"
                id="legalEntityName"
                name="legalEntityName"
                value={formData.legalEntityName}
                onChange={handleChange}
                className="po-entry-input"
                readOnly
                style={{ background: 'var(--color-bg-tertiary)' }}
              />
            </div>
            
            <div className="po-entry-field po-entry-field-full">
              <label htmlFor="customerAddress" className="po-entry-label">
                Customer Address (Auto-filled)
              </label>
              <textarea
                id="customerAddress"
                name="customerAddress"
                value={formData.customerAddress}
                onChange={handleChange}
                className="po-entry-textarea"
                rows="3"
                readOnly
                style={{ background: 'var(--color-bg-tertiary)' }}
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="customerDistrict" className="po-entry-label">
                District (Auto-filled)
              </label>
              <input
                type="text"
                id="customerDistrict"
                name="customerDistrict"
                value={formData.customerDistrict}
                onChange={handleChange}
                className="po-entry-input"
                readOnly
                style={{ background: 'var(--color-bg-tertiary)' }}
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="customerState" className="po-entry-label">
                State (Auto-filled)
              </label>
              <input
                type="text"
                id="customerState"
                name="customerState"
                value={formData.customerState}
                onChange={handleChange}
                className="po-entry-input"
                readOnly
                style={{ background: 'var(--color-bg-tertiary)' }}
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="customerCountry" className="po-entry-label">
                Country (Auto-filled)
              </label>
              <input
                type="text"
                id="customerCountry"
                name="customerCountry"
                value={formData.customerCountry}
                onChange={handleChange}
                className="po-entry-input"
                readOnly
                style={{ background: 'var(--color-bg-tertiary)' }}
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="customerPinCode" className="po-entry-label">
                Pin Code (Auto-filled)
              </label>
              <input
                type="text"
                id="customerPinCode"
                name="customerPinCode"
                value={formData.customerPinCode}
                onChange={handleChange}
                className="po-entry-input"
                readOnly
                style={{ background: 'var(--color-bg-tertiary)' }}
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="customerGSTIN" className="po-entry-label">
                GST No (Auto-filled)
              </label>
              <input
                type="text"
                id="customerGSTIN"
                name="customerGSTIN"
                value={formData.customerGSTIN}
                onChange={handleChange}
                className="po-entry-input"
                readOnly
                style={{ background: 'var(--color-bg-tertiary)' }}
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="segment" className="po-entry-label">
                Segment
              </label>
              <select
                id="segment"
                name="segment"
                value={formData.segment}
                onChange={handleChange}
                className="po-entry-select"
              >
                <option value="">Select Segment</option>
                {SEGMENTS.map((segment) => (
                  <option key={segment} value={segment}>
                    {segment}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="zone" className="po-entry-label">
                Zone
              </label>
              <select
                id="zone"
                name="zone"
                value={formData.zone}
                onChange={handleChange}
                className="po-entry-select"
              >
                <option value="">Select Zone</option>
                {ZONES.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Contract, Agreement & PO Details */}
        <div className="po-entry-section">
          <h2 className="po-entry-section-title">Contract, Agreement & PO Details</h2>
          <div className="po-entry-form-grid">
            <div className="po-entry-field">
              <label htmlFor="contractAgreementNo" className="po-entry-label">
                Contract Agreement No
              </label>
              <input
                type="text"
                id="contractAgreementNo"
                name="contractAgreementNo"
                value={formData.contractAgreementNo}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="contractAgreementDate" className="po-entry-label">
                Contract Agreement Date
              </label>
              <DatePicker
                selected={formData.contractAgreementDate}
                onChange={handleChange}
                name="contractAgreementDate"
                id="contractAgreementDate"
              />
            </div>
          </div>
        </div>

        {/* LOI, LOA & Tender References */}
        <div className="po-entry-section">
          <h2 className="po-entry-section-title">LOI, LOA & Tender References</h2>
          <div className="po-entry-form-grid">
            <div className="po-entry-field">
              <label htmlFor="loiNumber" className="po-entry-label">
                Letter of Intent No
              </label>
              <input
                type="text"
                id="loiNumber"
                name="loiNumber"
                value={formData.loiNumber}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="loiDate" className="po-entry-label">
                Letter of Intent Date
              </label>
              <DatePicker
                selected={formData.loiDate}
                onChange={handleChange}
                name="loiDate"
                id="loiDate"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="loaNumber" className="po-entry-label">
                Letter of Award No
              </label>
              <input
                type="text"
                id="loaNumber"
                name="loaNumber"
                value={formData.loaNumber}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="loaDate" className="po-entry-label">
                Letter of Award Date
              </label>
              <DatePicker
                selected={formData.loaDate}
                onChange={handleChange}
                name="loaDate"
                id="loaDate"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="tenderNumber" className="po-entry-label">
                Tender Reference No
              </label>
              <input
                type="text"
                id="tenderNumber"
                name="tenderNumber"
                value={formData.tenderNumber}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="tenderDate" className="po-entry-label">
                Tender Date
              </label>
              <DatePicker
                selected={formData.tenderDate}
                onChange={handleChange}
                name="tenderDate"
                id="tenderDate"
              />
            </div>
          </div>
        </div>

        {/* Project Description */}
        <div className="po-entry-section">
          <h2 className="po-entry-section-title">Project Description</h2>
          <div className="po-entry-form-grid">
            <div className="po-entry-field po-entry-field-full">
              <label htmlFor="projectDescription" className="po-entry-label">
                Project Description
              </label>
              <textarea
                id="projectDescription"
                name="projectDescription"
                value={formData.projectDescription}
                onChange={handleChange}
                className="po-entry-textarea"
                rows="4"
              />
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="po-entry-section">
          <h2 className="po-entry-section-title">Payment Details</h2>
          <div className="po-entry-form-grid">
            <div className="po-entry-field">
              <label htmlFor="paymentType" className="po-entry-label">
                Payment Type
              </label>
              <select
                id="paymentType"
                name="paymentType"
                value={formData.paymentType}
                onChange={handleChange}
                className="po-entry-select"
              >
                <option value="">Select Payment Type</option>
                {PAYMENT_TYPES.filter((type) => type !== 'Other').map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
                <option value="Other">Other</option>
              </select>
              {formData.paymentType === 'Other' && (
                <input
                  type="text"
                  id="paymentTypeOther"
                  name="paymentTypeOther"
                  value={formData.paymentTypeOther}
                  onChange={handleChange}
                  className="po-entry-input"
                  placeholder="Enter payment type"
                  style={{ marginTop: '8px' }}
                />
              )}
            </div>
            
            <div className="po-entry-field po-entry-field-full">
              <label htmlFor="poPaymentTerms" className="po-entry-label">
                Payment Terms Description
              </label>
              <textarea
                id="poPaymentTerms"
                name="poPaymentTerms"
                value={formData.poPaymentTerms}
                onChange={handleChange}
                className="po-entry-textarea"
                rows="6"
                placeholder="Enter payment terms directly here..."
              />
            </div>

            <div className="po-entry-field po-entry-field-full">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', padding: '12px 14px', border: '1px solid var(--color-border)', borderRadius: '10px', background: 'var(--color-bg-tertiary)' }}>
                <label className="po-entry-label" style={{ marginBottom: 0, fontSize: '16px', fontWeight: 700 }}>Due Distribution</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button type="button" onClick={handleAddAdvancePaymentDue} className="po-entry-boq-add-button">
                    <Plus className="po-entry-action-icon" />
                    <span>Advance Payment</span>
                  </button>
                  <button type="button" onClick={handleAddPaymentDue} className="po-entry-boq-add-button">
                    <Plus className="po-entry-action-icon" />
                    <span>Add Due</span>
                  </button>
                </div>
              </div>

              <div className="po-entry-due-table-wrapper">
                <table className="po-entry-due-table">
                  <thead>
                    <tr>
                      <th scope="col">Payment Terms</th>
                      <th scope="col" className="po-entry-due-table-pct">Basic (%)</th>
                      <th scope="col" className="po-entry-due-table-num">Freight</th>
                      <th scope="col" className="po-entry-due-table-tax">Taxes (GST %)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentTermsTotals.dueSummaries.map((due) => (
                      <tr key={due.key}>
                        <td>
                          <div className="po-entry-due-term-cell po-entry-due-term-cell--label-only">
                            <div className="po-entry-due-term-head">
                              <span className="po-entry-due-term-label">{due.label}</span>
                              {paymentDueRows.length > 1 && (
                                <button
                                  type="button"
                                  className="po-entry-boq-remove-button"
                                  onClick={() => handleRemovePaymentDue(due.key)}
                                  aria-label={`Remove ${due.label}`}
                                >
                                  <X size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="po-entry-due-table-pct">
                          <div className="po-entry-due-inline-cell">
                            <select
                              className="po-entry-select po-entry-due-select"
                              value={due.percentage}
                              onChange={(e) => handlePaymentDueChange(due.key, 'percentage', e.target.value)}
                              aria-label={`${due.label} percent of PO value`}
                            >
                              <option value="">%</option>
                              {PAYMENT_PERCENTAGE_OPTIONS.map((option) => (
                                <option key={option} value={option}>{option}%</option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td className="po-entry-due-table-num">
                          <input
                            type="number"
                            className="po-entry-input po-entry-due-num-input"
                            value={due.freight}
                            onChange={(e) => handlePaymentDueChange(due.key, 'freight', e.target.value)}
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            aria-label={`${due.label} freight`}
                          />
                        </td>
                        <td className="po-entry-due-table-tax">
                          <div className="po-entry-due-tax-cell">
                            <select
                              className="po-entry-select po-entry-due-select"
                              value={due.gst}
                              onChange={(e) => handlePaymentDueChange(due.key, 'gst', e.target.value)}
                              aria-label={`${due.label} GST rate`}
                            >
                              <option value="">GST %</option>
                              {PAYMENT_GST_OPTIONS.map((option) => (
                                <option key={option} value={option}>{option}%</option>
                              ))}
                            </select>
                            <input
                              type="text"
                              readOnly
                              value={Number(due.taxes ?? 0).toFixed(2)}
                              className="po-entry-input po-entry-input-readonly po-entry-due-tax-amount"
                              aria-label={`${due.label} tax amount`}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="po-entry-field">
              <label className="po-entry-label">Total Freight</label>
              <input type="text" readOnly value={paymentTermsTotals.totalFreight} className="po-entry-input po-entry-input-readonly" />
            </div>
            <div className="po-entry-field">
              <label className="po-entry-label">Total Taxes</label>
              <input type="text" readOnly value={paymentTermsTotals.totalTaxes} className="po-entry-input po-entry-input-readonly" />
            </div>
            <div className="po-entry-field">
              <label className="po-entry-label">Total Amount</label>
              <input type="text" readOnly value={paymentTermsTotals.totalAmount} className="po-entry-input po-entry-input-readonly" />
            </div>
            
            <div className="po-entry-field po-entry-field-full">
              <label htmlFor="paymentTermsClauseInPO" className="po-entry-label">
                Payment Terms Clause in PO
              </label>
              <textarea
                id="paymentTermsClauseInPO"
                name="paymentTermsClauseInPO"
                value={formData.paymentTermsClauseInPO}
                onChange={handleChange}
                className="po-entry-textarea"
                rows="4"
                placeholder="Enter payment terms clause in PO..."
              />
            </div>
          </div>
        </div>

        {/* Insurance Details */}
        <div className="po-entry-section">
          <h2 className="po-entry-section-title">Insurance Details</h2>
          <div className="po-entry-form-grid">
            <div className="po-entry-field">
              <label htmlFor="insuranceType" className="po-entry-label">
                Insurance Type
              </label>
              <select
                id="insuranceType"
                name="insuranceType"
                value={formData.insuranceType}
                onChange={handleChange}
                className="po-entry-select"
              >
                <option value="">Select Insurance Type</option>
                {INSURANCE_TYPES.filter((type) => type !== 'Others').map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
                <option value="Others">Others</option>
              </select>
              {formData.insuranceType === 'Others' && (
                <input
                  type="text"
                  id="insuranceTypeOther"
                  name="insuranceTypeOther"
                  value={formData.insuranceTypeOther}
                  onChange={handleChange}
                  className="po-entry-input"
                  placeholder="Specify insurance type"
                  style={{ marginTop: '8px' }}
                />
              )}
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="insurancePolicyNumber" className="po-entry-label">
                Policy No
              </label>
              <input
                type="text"
                id="insurancePolicyNumber"
                name="insurancePolicyNumber"
                value={formData.insurancePolicyNumber}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="insurancePolicyDate" className="po-entry-label">
                Policy Date
              </label>
              <DatePicker
                selected={formData.insurancePolicyDate}
                onChange={handleChange}
                name="insurancePolicyDate"
                id="insurancePolicyDate"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="insurancePolicyCompany" className="po-entry-label">
                Policy Company
              </label>
              <input
                type="text"
                id="insurancePolicyCompany"
                name="insurancePolicyCompany"
                value={formData.insurancePolicyCompany}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="insurancePolicyValidUpto" className="po-entry-label">
                Policy Valid upto
              </label>
              <DatePicker
                selected={formData.insurancePolicyValidUpto}
                onChange={handleChange}
                name="insurancePolicyValidUpto"
                id="insurancePolicyValidUpto"
              />
            </div>
            
            <div className="po-entry-field po-entry-field-full">
              <label htmlFor="insurancePolicyClauseInPO" className="po-entry-label">
                Policy Clause in PO
              </label>
              <textarea
                id="insurancePolicyClauseInPO"
                name="insurancePolicyClauseInPO"
                value={formData.insurancePolicyClauseInPO}
                onChange={handleChange}
                className="po-entry-textarea"
                rows="4"
                placeholder="Enter policy clause in PO..."
              />
            </div>
            
            <div className="po-entry-field po-entry-field-full">
              <label htmlFor="insurancePolicyRemarks" className="po-entry-label">
                Policy Remarks
              </label>
              <textarea
                id="insurancePolicyRemarks"
                name="insurancePolicyRemarks"
                value={formData.insurancePolicyRemarks}
                onChange={handleChange}
                className="po-entry-textarea"
                rows="3"
                placeholder="Enter policy remarks..."
              />
            </div>
          </div>
        </div>

        {/* Bank Guarantee Details */}
        <div className="po-entry-section">
          <h2 className="po-entry-section-title">Bank Guarantee Details</h2>
          <div className="po-entry-form-grid">
            <div className="po-entry-field">
              <label htmlFor="bankGuaranteeType" className="po-entry-label">
                Bank Guarantee Type
              </label>
              <select
                id="bankGuaranteeType"
                name="bankGuaranteeType"
                value={formData.bankGuaranteeType}
                onChange={handleChange}
                className="po-entry-select"
              >
                <option value="">Select Bank Guarantee Type</option>
                {BANK_GUARANTEE_TYPES.filter((type) => type !== 'Others').map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
                <option value="Others">Others</option>
              </select>
              {formData.bankGuaranteeType === 'Others' && (
                <input
                  type="text"
                  id="bankGuaranteeTypeOther"
                  name="bankGuaranteeTypeOther"
                  value={formData.bankGuaranteeTypeOther}
                  onChange={handleChange}
                  className="po-entry-input"
                  placeholder="Specify bank guarantee type"
                  style={{ marginTop: '8px' }}
                />
              )}
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="bankGuaranteeNumber" className="po-entry-label">
                Bank Guarantee No
              </label>
              <input
                type="text"
                id="bankGuaranteeNumber"
                name="bankGuaranteeNumber"
                value={formData.bankGuaranteeNumber}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="bankGuaranteeDate" className="po-entry-label">
                Bank Guarantee Date
              </label>
              <DatePicker
                selected={formData.bankGuaranteeDate}
                onChange={handleChange}
                name="bankGuaranteeDate"
                id="bankGuaranteeDate"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="bankGuaranteeValue" className="po-entry-label">
                Bank Guarantee Value
              </label>
              <input
                type="number"
                id="bankGuaranteeValue"
                name="bankGuaranteeValue"
                value={formData.bankGuaranteeValue}
                onChange={handleChange}
                className="po-entry-input"
                step="0.01"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="bankName" className="po-entry-label">
                Bank Name
              </label>
              <input
                type="text"
                id="bankName"
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="bankGuaranteeValidity" className="po-entry-label">
                Bank Guarantee Validity
              </label>
              <DatePicker
                selected={formData.bankGuaranteeValidity}
                onChange={handleChange}
                name="bankGuaranteeValidity"
                id="bankGuaranteeValidity"
              />
            </div>
            
            <div className="po-entry-field po-entry-field-full">
              <label htmlFor="bankGuaranteeReleaseValidityClauseInPO" className="po-entry-label">
                Bank Guarantee Release & Validity Clause in PO
              </label>
              <textarea
                id="bankGuaranteeReleaseValidityClauseInPO"
                name="bankGuaranteeReleaseValidityClauseInPO"
                value={formData.bankGuaranteeReleaseValidityClauseInPO}
                onChange={handleChange}
                className="po-entry-textarea"
                rows="4"
                placeholder="Enter bank guarantee release & validity clause in PO..."
              />
            </div>
            
            <div className="po-entry-field po-entry-field-full">
              <label htmlFor="bankGuaranteeRemarks" className="po-entry-label">
                Bank Guarantee Remarks
              </label>
              <textarea
                id="bankGuaranteeRemarks"
                name="bankGuaranteeRemarks"
                value={formData.bankGuaranteeRemarks}
                onChange={handleChange}
                className="po-entry-textarea"
                rows="3"
                placeholder="Enter bank guarantee remarks..."
              />
            </div>
          </div>
        </div>

        {/* Role Assignments */}
        <div className="po-entry-section">
          <h2 className="po-entry-section-title">Role Assignments</h2>
          <div className="po-entry-form-grid">
            <div className="po-entry-field">
              <label htmlFor="salesManagerId" className="po-entry-label">
                Sales Manager
              </label>
              <select
                id="salesManagerId"
                name="salesManagerId"
                value={formData.salesManagerId}
                onChange={handleChange}
                className="po-entry-select"
              >
                <option value="">Select Sales Manager</option>
                {Array.isArray(salesManagers) && salesManagers.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {getEmployeeLabel(emp)}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="salesHeadId" className="po-entry-label">
                Sales Head
              </label>
              <select
                id="salesHeadId"
                name="salesHeadId"
                value={formData.salesHeadId}
                onChange={handleChange}
                className="po-entry-select"
              >
                <option value="">Select Sales Head</option>
                {Array.isArray(salesHeads) && salesHeads.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {getEmployeeLabel(emp)}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="businessHeadId" className="po-entry-label">
                Business Head
              </label>
              <select
                id="businessHeadId"
                name="businessHeadId"
                value={formData.businessHeadId}
                onChange={handleChange}
                className="po-entry-select"
              >
                <option value="">Select Business Head</option>
                {Array.isArray(businessHeads) && businessHeads.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {getEmployeeLabel(emp)}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="projectManagerId" className="po-entry-label">
                Project Manager
              </label>
              <select
                id="projectManagerId"
                name="projectManagerId"
                value={formData.projectManagerId}
                onChange={handleChange}
                className="po-entry-select"
              >
                <option value="">Select Project Manager</option>
                {Array.isArray(projectManagers) && projectManagers.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {getEmployeeLabel(emp)}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="projectHeadId" className="po-entry-label">
                Project Head
              </label>
              <select
                id="projectHeadId"
                name="projectHeadId"
                value={formData.projectHeadId}
                onChange={handleChange}
                className="po-entry-select"
              >
                <option value="">Select Project Head</option>
                {Array.isArray(projectHeads) && projectHeads.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {getEmployeeLabel(emp)}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="collectionInchargeId" className="po-entry-label">
                Collection Incharge
              </label>
              <select
                id="collectionInchargeId"
                name="collectionInchargeId"
                value={formData.collectionInchargeId}
                onChange={handleChange}
                className="po-entry-select"
              >
                <option value="">Select Collection Incharge</option>
                {Array.isArray(collectionIncharges) && collectionIncharges.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {getEmployeeLabel(emp)}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="salesAgentName" className="po-entry-label">
                Sales Agent Name
              </label>
              <select
                id="salesAgentName"
                name="salesAgentName"
                value={formData.salesAgentName}
                onChange={handleChange}
                className="po-entry-select"
              >
                <option value="">Select Sales Agent</option>
                {Array.isArray(salesAgents) && salesAgents.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {getEmployeeLabel(emp)}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="salesAgentCommission" className="po-entry-label">
                Sales Agent Commission
              </label>
              <input
                type="number"
                id="salesAgentCommission"
                name="salesAgentCommission"
                value={formData.salesAgentCommission}
                onChange={handleChange}
                className="po-entry-input"
                step="0.01"
                placeholder="0.00"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="collectionAgentName" className="po-entry-label">
                Collection Agent Name
              </label>
              <select
                id="collectionAgentName"
                name="collectionAgentName"
                value={formData.collectionAgentName}
                onChange={handleChange}
                className="po-entry-select"
              >
                <option value="">Select Collection Agent</option>
                {Array.isArray(collectionAgents) && collectionAgents.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {getEmployeeLabel(emp)}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="collectionAgentCommission" className="po-entry-label">
                Collection Agent Commission
              </label>
              <input
                type="number"
                id="collectionAgentCommission"
                name="collectionAgentCommission"
                value={formData.collectionAgentCommission}
                onChange={handleChange}
                className="po-entry-input"
                step="0.01"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Delivery Schedule & Other Details */}
        <div className="po-entry-section">
          <h2 className="po-entry-section-title">Delivery Schedule & Other Details</h2>
          <div className="po-entry-form-grid">
            <div className="po-entry-field po-entry-field-full">
              <label htmlFor="deliveryScheduleClause" className="po-entry-label">
                Delivery Schedule Clause
              </label>
              <textarea
                id="deliveryScheduleClause"
                name="deliveryScheduleClause"
                value={formData.deliveryScheduleClause}
                onChange={handleChange}
                className="po-entry-textarea"
                rows="6"
                placeholder="Enter delivery schedule clause..."
              />
            </div>
            
            <div className="po-entry-field po-entry-field-full">
              <label htmlFor="liquidatedDamagesClause" className="po-entry-label">
                Liquidated Damages Clause
              </label>
              <textarea
                id="liquidatedDamagesClause"
                name="liquidatedDamagesClause"
                value={formData.liquidatedDamagesClause}
                onChange={handleChange}
                className="po-entry-textarea"
                rows="4"
                placeholder="Enter liquidated damages clause..."
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="lastDateOfDelivery" className="po-entry-label">
                Last Date of Delivery
              </label>
              <DatePicker
                selected={formData.lastDateOfDelivery}
                onChange={handleChange}
                name="lastDateOfDelivery"
                id="lastDateOfDelivery"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="poValidity" className="po-entry-label">
                PO Validity
              </label>
              <input
                type="text"
                id="poValidity"
                name="poValidity"
                value={formData.poValidity}
                onChange={handleChange}
                className="po-entry-input"
                placeholder="e.g., 90 days"
              />
            </div>
            
            <div className="po-entry-field">
              <label htmlFor="poSignedConcernName" className="po-entry-label">
                PO Signed Concern Name
              </label>
              <input
                type="text"
                id="poSignedConcernName"
                name="poSignedConcernName"
                value={formData.poSignedConcernName}
                onChange={handleChange}
                className="po-entry-input"
              />
            </div>
          </div>
        </div>

        {/* BOQ as per PO (Form) - table and calculated summary */}
        <div className="po-entry-section">
          <h2 className="po-entry-section-title">BOQ as per PO (Form)</h2>
          <div className="po-entry-boq-container">
            <div className="po-entry-boq-table-wrapper">
              <table className="po-entry-boq-table">
                <thead>
                  <tr>
                    <th>BOQ Header</th>
                    <th>Material Description</th>
                    <th>Original Qty</th>
                    <th>Amended Qty</th>
                    <th>Total Qty</th>
                    <th>UOM</th>
                    <th>Unit Price</th>
                    <th>Total Basic Amount</th>
                    <th>Freight</th>
                    <th>GST %</th>
                    <th>GST Amount</th>
                    <th>Total Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(boqItems) && boqItems.map((item, index) => (
                    <tr key={item.id}>
                      <td>
                        <select
                          value={item.boqHeader || ''}
                          onChange={(e) => handleBOQItemChange(item.id, 'boqHeader', e.target.value)}
                          className="po-entry-boq-input"
                        >
                          <option value="">Select</option>
                          {boqHeaderOptions.map((header) => (
                            <option key={header} value={header}>{header}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          value={item.materialDescription}
                          onChange={(e) => handleBOQItemChange(item.id, 'materialDescription', e.target.value)}
                          className="po-entry-boq-input"
                          placeholder="Enter material description"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={item.originalQty}
                          onChange={(e) => handleBOQItemChange(item.id, 'originalQty', e.target.value)}
                          className="po-entry-boq-input"
                          placeholder="0"
                          step="0.01"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={item.amendedQty}
                          onChange={(e) => handleBOQItemChange(item.id, 'amendedQty', e.target.value)}
                          className="po-entry-boq-input"
                          placeholder="0"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={item.totalQty}
                          readOnly
                          className="po-entry-boq-input po-entry-boq-input-readonly"
                          style={{ background: 'var(--color-bg-tertiary)' }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={item.uom}
                          onChange={(e) => handleBOQItemChange(item.id, 'uom', e.target.value)}
                          className="po-entry-boq-input"
                          placeholder="UOM"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleBOQItemChange(item.id, 'unitPrice', e.target.value)}
                          className="po-entry-boq-input"
                          placeholder="0.00"
                          step="0.01"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={item.totalBasicAmount}
                          readOnly
                          className="po-entry-boq-input po-entry-boq-input-readonly"
                          style={{ background: 'var(--color-bg-tertiary)' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={item.freight}
                          onChange={(e) => handleBOQItemChange(item.id, 'freight', e.target.value)}
                          className="po-entry-boq-input"
                          placeholder="0.00"
                          step="0.01"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={item.gstPercent}
                          onChange={(e) => handleBOQItemChange(item.id, 'gstPercent', e.target.value)}
                          className="po-entry-boq-input"
                          placeholder="0.00"
                          step="0.01"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={item.gstAmount}
                          readOnly
                          className="po-entry-boq-input po-entry-boq-input-readonly"
                          style={{ background: 'var(--color-bg-tertiary)' }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={item.totalAmount}
                          readOnly
                          className="po-entry-boq-input po-entry-boq-input-readonly"
                          style={{ background: 'var(--color-bg-tertiary)' }}
                        />
                      </td>
                      <td>
                        {boqItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveBOQItem(item.id)}
                            className="po-entry-boq-remove-button"
                            aria-label="Remove row"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <button
              type="button"
              onClick={handleAddBOQItem}
              className="po-entry-boq-add-button"
            >
              <Plus className="po-entry-action-icon" />
              <span>Add line item</span>
            </button>
          </div>
        </div>

        {/* BOQ Summary - calculated from table */}
        <div className="po-entry-section">
          <h2 className="po-entry-section-title">Total</h2>
          <div className="po-entry-form-grid">
            <div className="po-entry-field">
              <label className="po-entry-label">Total Ex Works</label>
              <input
                type="text"
                value={boqTotals.totalExWorks}
                readOnly
                className="po-entry-input po-entry-input-readonly"
                style={{ background: 'var(--color-bg-tertiary)', fontWeight: 600 }}
              />
            </div>
            
            <div className="po-entry-field">
              <label className="po-entry-label">Total Freight Amount</label>
              <input
                type="text"
                value={boqTotals.totalFreight}
                readOnly
                className="po-entry-input po-entry-input-readonly"
                style={{ background: 'var(--color-bg-tertiary)', fontWeight: 600 }}
              />
            </div>
            
            <div className="po-entry-field">
              <label className="po-entry-label">GST</label>
              <input
                type="text"
                value={boqTotals.totalGST}
                readOnly
                className="po-entry-input po-entry-input-readonly"
                style={{ background: 'var(--color-bg-tertiary)', fontWeight: 600 }}
              />
            </div>
            
            <div className="po-entry-field">
              <label className="po-entry-label">Total PO Value</label>
              <input
                type="text"
                value={boqTotals.totalPOValue}
                readOnly
                className="po-entry-input po-entry-input-readonly"
                style={{ background: 'var(--color-bg-tertiary)', fontWeight: 700, fontSize: '1.1em' }}
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="po-entry-actions">
          <button
            type="button"
            onClick={() => navigate('/po-entry')}
            className="po-entry-button po-entry-button-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="po-entry-button po-entry-button-primary"
          >
            Submit PO Entry
          </button>
        </div>
      </form>

      {showFieldSelector && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: 16 }} onClick={() => setShowFieldSelector(false)}>
          <div style={{ width: '100%', maxWidth: 760, maxHeight: '80vh', overflow: 'hidden', background: '#fff', border: '1px solid #d6dde7', borderRadius: 12, display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Field Selection</h3>
              <button type="button" onClick={() => setShowFieldSelector(false)} className="po-entry-boq-remove-button" aria-label="Close field selection">
                <X size={16} />
              </button>
            </div>
            <div style={{ overflow: 'auto', padding: 16 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', border: '1px solid #e5e7eb', padding: 10, background: '#f3f4f6' }}>Field Name</th>
                    <th style={{ textAlign: 'center', border: '1px solid #e5e7eb', padding: 10, background: '#f3f4f6', width: 120 }}>Show</th>
                  </tr>
                </thead>
                <tbody>
                  {availableFields.map((field) => {
                    const checked = !hiddenFieldKeys.includes(field.key)
                    return (
                      <tr key={field.key}>
                        <td style={{ border: '1px solid #e5e7eb', padding: 10 }}>{field.label}</td>
                        <td style={{ border: '1px solid #e5e7eb', padding: 10, textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setHiddenFieldKeys((prev) => (
                                checked ? prev.filter((k) => k !== field.key) : [...prev, field.key]
                              ))
                            }}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '14px 16px', borderTop: '1px solid #e5e7eb' }}>
              <button type="button" className="po-entry-action-button po-entry-action-button-secondary" onClick={() => setHiddenFieldKeys([])}>
                Reset
              </button>
              <button type="button" className="po-entry-action-button po-entry-action-button-secondary" onClick={() => setShowFieldSelector(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default POEntry
