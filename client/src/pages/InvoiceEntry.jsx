import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Calculator, RotateCcw, Zap, Plus, Trash2 } from 'lucide-react'
import DatePicker from '../components/DatePicker'
import { useMasterData } from '../contexts/MasterDataContext'
import { useToast } from '../contexts/ToastContext'
import { usePersistedFormState } from '../hooks/usePersistedFormState'
import * as poEntryService from '../services/poEntryService'
import * as invoiceService from '../services/invoiceService'
import * as paymentApi from '../api/payment'
import { getInvoiceById, updateInvoice } from '../api/invoice'
import { INDIA_STATES } from '../utils/indiaStates'
import { getInvoiceNumberPrefix } from '../utils/numbering'
import '../styles/InvoiceEntry.css'

const FIELD_TYPES = {
  MANUAL: 'manual',
  DROPDOWN: 'dropdown',
  DEFAULT: 'default', // Auto-filled, read-only
  CALCULATED: 'calculated', // System calculated, non-editable
}

const INVOICE_TYPES = ['REG', 'EXP', 'TAX', 'PRO', 'Other']
const BUSINESS_UNITS = ['MAIN', 'UNIT1', 'UNIT2', 'UNIT3', 'Other']
const SEGMENTS = ['Domestic', 'Export']
const ZONES = ['North', 'East', 'West', 'South']
const REGIONS = ['North', 'East', 'West', 'South', 'Central']
const MATERIAL_DESCRIPTION_TYPES = ['Goods', 'Services', 'Both', 'Other']
/** Matches PO Entry → BOQ as per PO (Form) headers */
const INVOICE_NATURE_OPTIONS = ['Supply', 'Service', 'Supply & Service', 'AMC', 'Freight', 'Civil']
const UNITS = ['Nos', 'MT', 'KG', 'LTR', 'MTR', 'SQM', 'CUM', 'Other']
/** Internal values: IGST | SGST & CGST | UGST */
const INVOICE_TAX_TYPE_OPTIONS = [
  { value: 'IGST', label: 'Inter State Sell (IGST)' },
  { value: 'SGST & CGST', label: 'Intra State Sell (CGST & SGST)' },
  { value: 'UGST', label: 'Union Territory Sell (UGST)' },
]

function coerceInvoiceTaxType(raw) {
  const s = String(raw ?? '').trim()
  if (s === 'CGST' || s === 'SGST') return 'SGST & CGST'
  if (s === 'IGST' || s === 'SGST & CGST' || s === 'UGST') return s
  return 'IGST'
}

const UNIT_ALIAS_MAP = {
  'METRIC TON': 'MT',
  'M.T.': 'MT',
  MTON: 'MT',
  NUMBERS: 'Nos',
  'NO.': 'Nos',
  NOS: 'Nos',
  LITRE: 'LTR',
  LITRES: 'LTR',
  METER: 'MTR',
  METRE: 'MTR',
  'SQ M': 'SQM',
  'SQ.M': 'SQM',
  'CUBIC M': 'CUM',
}

/** Align PO UOM text with invoice unit codes where we have a mapping. */
function normalizeInvoiceUnit(u) {
  if (!u || typeof u !== 'string') return ''
  const raw = String(u).trim()
  if (!raw) return ''
  const s = raw.toUpperCase()
  return UNIT_ALIAS_MAP[s] || (UNITS.includes(s) ? s : UNITS.includes(raw) ? raw : raw)
}

/**
 * PO BOQ can use free-text UOM (e.g. Bags, PCS). The unit <select> must list those
 * values or the browser shows a blank despite line.unit being set.
 */
function unitOptionsForInvoice(poBoqItems, materialLines) {
  const seen = new Set(UNITS)
  const extras = []
  const add = (v) => {
    if (v == null || v === '') return
    let t = normalizeInvoiceUnit(String(v))
    if (!t) t = String(v).trim()
    if (!t) return
    if (!seen.has(t)) {
      seen.add(t)
      extras.push(t)
    }
  }
  ;(Array.isArray(poBoqItems) ? poBoqItems : []).forEach((b) => add(b.uom ?? b.unit ?? b.uom_uom ?? ''))
  ;(Array.isArray(materialLines) ? materialLines : []).forEach((l) => add(l.unit))
  extras.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
  return [...UNITS, ...extras]
}

/** Merge top-level and nested BOQ; map snake_case from APIs / DB. */
function normalizePoBoqItemsFromApi(raw) {
  if (!raw || typeof raw !== 'object') return []
  const fromTop = Array.isArray(raw.boqItems) ? raw.boqItems : []
  const nested = Array.isArray(raw.formData?.boqItems) ? raw.formData.boqItems : []
  const list = fromTop.length > 0 ? fromTop : nested
  return list.map((b, idx) => {
    const id = b.id != null ? b.id : idx + 1
    const boqHeader = String(b.boqHeader ?? b.boq_header ?? '').trim()
    const materialDescription = String(
      b.materialDescription ?? b.material_description ?? b.description ?? ''
    ).trim()
    const uom = String(b.uom ?? b.unit ?? b.uom_uom ?? '').trim()
    return {
      ...b,
      id,
      boqHeader,
      materialDescription: materialDescription || String(b.materialDescription ?? ''),
      uom,
    }
  })
}

const newMaterialLineId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `ml-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

const createEmptyMaterialLine = (defaults = {}) => ({
  id: newMaterialLineId(),
  invoiceNature: '',
  stateOfSupply: '',
  boqItemId: '',
  description: '',
  qty: '',
  unit: '',
  unitPrice: '',
  freight: '',
  taxType: 'IGST',
  ...defaults,
})

const INITIAL_INVOICE_FORM_DATA = {
  keyID: '',
  poId: '', // PO UUID from selected Key ID; sent on submit so backend can validate from single source
  gstTaxInvoiceNo: '',
  gstTaxInvoiceDate: '',
  internalInvoiceNo: '',
  internalInvoiceSuffix: '',
  invoiceType: 'REG',
  businessUnit: 'MAIN',
  customerName: '',
  customerId: '',
  segment: '',
  region: '',
  zone: '',
  salesOrderNo: '',
  accountManagerName: '',
  accountManagerId: '',
  poNoReference: '',
  poDate: '',
  materialDescriptionType: '',
  materialLines: [createEmptyMaterialLine()],
  stateOfSupply: '',
  qty: '',
  unit: '',
  currency: 'INR',
  basicRate: '',
  basicValue: '',
  freightInvoiceNo: '',
  freightRate: '',
  freightValue: '',
  taxType: 'IGST',
  sgstRate: '',
  cgstRate: '',
  igstRate: '',
  ugstRate: '',
  sgstOutput: '',
  cgstOutput: '',
  igstOutput: '',
  ugstOutput: '',
  totalGST: '',
  tcs: '',
  subtotal: '',
  totalInvoiceValue: '',
  consigneeId: '',
  consigneeNameAddress: '',
  consigneeCity: '',
  payerId: '',
  payerNameAddress: '',
  payerCity: '',
  lorryReceiptNo: '',
  lorryReceiptDate: '',
  transporterName: '',
  transporterId: '',
  deliveryChallanNo: '',
  deliveryChallanDate: '',
  materialInspectionRequestDate: '',
  inspectionOfferDate: '',
  materialInspectionDate: '',
  deliveryInstructionDate: '',
  deliveryInspectionCIPReceivedDate: '',
  miccReceiptDate: '',
  lastDateOfDispatch: '',
  invoiceReadyDate: '',
  courierDocumentNo: '',
  courierDocumentDate: '',
  courierCompanyName: '',
  billSentToPersonName: '',
  billSentDate: '',
  lastDateOfMaterialReceipt: '',
  invoiceReceiptDate: '',
  invoiceReceiptPersonName: '',
  invoiceReceiptPersonId: '',
  materialVerificationDate: '',
  jvrDate: '',
  srnDate: '',
  mrcDate: '',
  invoiceSubmissionAtSiteDate: '',
  invoiceForwardedToHODate: '',
  invoiceForwardedForPaymentDate: '',
  paymentTermsId: '',
  paymentTerms: '',
  paymentDueRows: [],
  paymentTextId: '',
  paymentText: '',
  firstDueDate: '',
  firstDueAmount: '',
  paymentReceivedAmount1stDue: '',
  receiptDate1stDue: '',
  firstDueBalance: '',
  notDue1stDue: '',
  overDue1stDue: '',
  noOfDaysOfPaymentReceipt1stDue: '',
  secondDueDate: '',
  secondDueAmount: '',
  paymentReceivedAmount2ndDue: '',
  receiptDate2ndDue: '',
  secondDueBalance: '',
  notDue2ndDue: '',
  overDue2ndDue: '',
  noOfDaysOfPaymentReceipt2ndDue: '',
  thirdDueDate: '',
  thirdDueAmount: '',
  paymentReceivedAmount3rdDue: '',
  receiptDate3rdDue: '',
  thirdDueBalance: '',
  notDue3rdDue: '',
  overDue3rdDue: '',
  noOfDaysOfPaymentReceipt3rdDue: '',
  totalBalance: '',
  notDueTotal: '',
  overDueTotal: '',
  itTDS2Percent: '',
  itTDS1Percent194Q: '',
  lcessBoq1Percent: '',
  tds2PercentCGSTSGST: '',
  tdsOnCGST1Percent: '',
  tdsOnSGST1Percent: '',
  excessSupplyQty: '',
  interestOnAdvance: '',
  anyHold: '',
  penaltyLDDeduction: '',
  bankCharges: '',
  lcDiscrepancyCharge: '',
  provisionForBadDebts: '',
  badDebts: '',
  invoiceTypeOther: '',
  businessUnitOther: '',
  materialDescriptionTypeOther: '',
  unitOther: '',
}

function InvoiceEntry() {
  const navigate = useNavigate()
  const { id } = useParams() // Get ID if editing existing invoice
  const isViewMode = window.location.pathname.includes('/view/')
  const { getCustomers, getConsignees, getPayers, getEmployees } = useMasterData()
  const { showToast } = useToast()
  
  const [poEntries, setPOEntries] = useState([])
  const [poNumbersLoading, setPONumbersLoading] = useState(true)
  const [customers, setCustomers] = useState([])
  const [consignees, setConsignees] = useState([])
  const [payers, setPayers] = useState([])
  const [employees, setEmployees] = useState([])
  const [poBoqItems, setPoBoqItems] = useState([])
  const [paymentData, setPaymentData] = useState(null) // Payment Advice data
  const [showFieldSelector, setShowFieldSelector] = useState(false)
  const [availableFields, setAvailableFields] = useState([])
  const [hiddenFieldKeys, setHiddenFieldKeys] = useState([])
  
  const { values, setValues: setFormData, clearLocalDraft, persistNow, reset: resetForm } = usePersistedFormState({
    pathKey: 'invoice-entry',
    defaultValues: INITIAL_INVOICE_FORM_DATA,
    entityId: id || null,
  })
  const formData = values && typeof values === 'object' && !Array.isArray(values)
    ? values
    : INITIAL_INVOICE_FORM_DATA

  useEffect(() => {
    try {
      const saved = localStorage.getItem('invoiceEntryHiddenFields')
      const parsed = saved ? JSON.parse(saved) : []
      setHiddenFieldKeys(Array.isArray(parsed) ? parsed : [])
    } catch {
      setHiddenFieldKeys([])
    }
  }, [])

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll('.invoice-entry-form .invoice-entry-field'))
    const collected = []

    nodes.forEach((node) => {
      const labelEl = node.querySelector('.invoice-entry-label')
      const rawLabel = (labelEl?.textContent || '').replace(/\s+/g, ' ').trim()
      if (!rawLabel) return
      const cleanLabel = rawLabel.replace('*', '').trim()
      const key = cleanLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      node.setAttribute('data-field-key', key)
      if (!collected.some((item) => item.key === key)) collected.push({ key, label: cleanLabel })
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
  }, [hiddenFieldKeys, formData])

  useEffect(() => {
    try {
      localStorage.setItem('invoiceEntryHiddenFields', JSON.stringify(hiddenFieldKeys))
    } catch {
      // Ignore storage failures.
    }
  }, [hiddenFieldKeys])

  useEffect(() => {
    setCustomers(getCustomers())
    setConsignees(getConsignees())
    setPayers(getPayers())
    setEmployees(getEmployees())
    
    ;(async () => {
      setPONumbersLoading(true)
      try {
        const allPOs = await poEntryService.getAllPONumbers()
        setPOEntries(Array.isArray(allPOs) ? allPOs : [])
      } catch (e) {
        console.error('Failed to load PO numbers:', e)
        setPOEntries([])
      } finally {
        setPONumbersLoading(false)
      }
    })()
  }, [getCustomers, getConsignees, getPayers, getEmployees])

  useEffect(() => {
    const poNum = formData.keyID
    if (!poNum) {
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const raw = await poEntryService.getPOEntryByPONumber(poNum)
        if (!cancelled && raw) {
          setPoBoqItems(normalizePoBoqItemsFromApi(raw))
          const poMatrix = Array.isArray(raw?.formData?.paymentDueRows) ? raw.formData.paymentDueRows : []
          if (poMatrix.length > 0) {
            setFormData((prev) => ({
              ...prev,
              paymentDueRows:
                Array.isArray(prev.paymentDueRows) && prev.paymentDueRows.length > 0
                  ? prev.paymentDueRows
                  : poMatrix,
            }))
          }
        }
      } catch {
        /* ignore */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [formData.keyID])
  
  const loadPaymentData = async (poNumber) => {
    try {
      const invoices = await invoiceService.getInvoicesByPONumber(poNumber)
      if (!invoices || invoices.length === 0) return
      const invoice = invoices[0]
      if (!invoice?.id) return

      const response = await paymentApi.getPaymentsByInvoice(invoice.id)
      const list = Array.isArray(response?.data) ? response.data : (response?.data?.data ?? response?.data ?? [])
      const payments = Array.isArray(list) ? list : []

      if (payments.length === 0) return

      const agg = payments.reduce(
        (acc, p) => {
          acc.amount = (parseFloat(acc.amount || 0) + parseFloat(p.amount || 0)).toFixed(2)
          acc.tds = (parseFloat(acc.tds || 0) + parseFloat(p.tds || 0)).toFixed(2)
          acc.bank_charges = (parseFloat(acc.bank_charges || 0) + parseFloat(p.bank_charges || 0)).toFixed(2)
          acc.penalty = (parseFloat(acc.penalty || 0) + parseFloat(p.penalty || 0)).toFixed(2)
          acc.other_deductions = (parseFloat(acc.other_deductions || 0) + parseFloat(p.other_deductions || 0)).toFixed(2)
          const paidAt = p.paid_at ?? p.paidAt
          if (paidAt && (!acc.receiptDate || new Date(paidAt) > new Date(acc.receiptDate))) acc.receiptDate = paidAt
          return acc
        },
        { receiptDate: null }
      )

      const formatPayDate = (val) => {
        if (!val) return ''
        if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) return val.slice(0, 10)
        const d = new Date(val)
        return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10)
      }

      setPaymentData(agg)
      setFormData((prev) => ({
        ...prev,
        paymentReceivedAmount1stDue: agg.amount || prev.paymentReceivedAmount1stDue,
        receiptDate1stDue: formatPayDate(agg.receiptDate) || prev.receiptDate1stDue,
        itTDS2Percent: agg.tds ?? prev.itTDS2Percent,
        bankCharges: agg.bank_charges ?? prev.bankCharges,
        penaltyLDDeduction: agg.penalty ?? prev.penaltyLDDeduction,
        interestOnAdvance: agg.other_deductions ?? prev.interestOnAdvance,
      }))
    } catch (error) {
      console.error('Failed to load payment data:', error)
    }
  }
  
  useEffect(() => {
    if (id) {
      const loadInvoice = async () => {
        try {
          const response = await getInvoiceById(id)
          const invoiceData = response?.data || response
          if (invoiceData) {
            const invoice = invoiceData.data || invoiceData
            
            setFormData(prev => ({
              ...prev,
              keyID: invoice.key_id || invoice.keyID || invoice.po_number || '',
              poId: invoice.po_id || invoice.poId || '',
              gstTaxInvoiceNo: invoice.gst_tax_invoice_no || invoice.gstTaxInvoiceNo || '',
              gstTaxInvoiceDate: formatDateForInput(invoice.gst_tax_invoice_date || invoice.gstTaxInvoiceDate || ''),
              internalInvoiceNo: invoice.internal_invoice_no || invoice.internalInvoiceNo || invoice.invoice_number || '',
              invoiceType: invoice.invoice_type || invoice.invoiceType || 'REG',
              businessUnit: invoice.business_unit || invoice.businessUnit || 'MAIN',
              customerName: invoice.customer_name || invoice.customerName || '',
              customerId: invoice.customer_id || invoice.customerId || '',
              segment: invoice.segment || '',
              region: invoice.region || '',
              zone: invoice.zone || '',
              salesOrderNo: invoice.sales_order_no || invoice.salesOrderNo || '',
              accountManagerName: invoice.account_manager_name || invoice.accountManagerName || '',
              accountManagerId: invoice.account_manager_id || invoice.accountManagerId || '',
              poNoReference: invoice.po_no_reference || invoice.poNoReference || invoice.po_number || '',
              poDate: formatDateForInput(invoice.po_date || invoice.poDate || ''),
              materialDescriptionType: invoice.material_description_type || invoice.materialDescriptionType || '',
              materialLines: (() => {
                const raw = invoice.material_lines ?? invoice.materialLines
                if (Array.isArray(raw) && raw.length > 0) {
                  return raw.map((line) => ({
                    ...createEmptyMaterialLine(),
                    ...line,
                    id: line.id || newMaterialLineId(),
                    taxType: coerceInvoiceTaxType(line.taxType || line.tax_type || 'IGST'),
                    freight: line.freight ?? '',
                  }))
                }
                return [
                  createEmptyMaterialLine({
                    invoiceNature: invoice.material_description_type || invoice.materialDescriptionType || '',
                    stateOfSupply: invoice.state_of_supply || invoice.stateOfSupply || '',
                    qty: invoice.qty != null && invoice.qty !== '' ? String(invoice.qty) : String(invoice.quantity ?? ''),
                    unit: invoice.unit || '',
                    unitPrice:
                      invoice.basic_rate != null && invoice.basic_rate !== ''
                        ? String(invoice.basic_rate)
                        : String(invoice.basicRate ?? ''),
                  }),
                ]
              })(),
              stateOfSupply: invoice.state_of_supply || invoice.stateOfSupply || '',
              qty: invoice.qty || invoice.quantity || '',
              unit: invoice.unit || '',
              currency: invoice.currency || 'INR',
              basicRate: invoice.basic_rate || invoice.basicRate || '',
              basicValue: invoice.basic_value || invoice.basicValue || '',
              freightInvoiceNo: invoice.freight_invoice_no || invoice.freightInvoiceNo || '',
              freightRate: invoice.freight_rate || invoice.freightRate || '',
              freightValue: invoice.freight_value || invoice.freightValue || '',
              taxType: coerceInvoiceTaxType(
                invoice.tax_type ||
                  invoice.taxType ||
                  inferTaxTypeFromRates({
                    igstRate: invoice.igst_rate || invoice.igstRate || '',
                    cgstRate: invoice.cgst_rate || invoice.cgstRate || '',
                    sgstRate: invoice.sgst_rate || invoice.sgstRate || '',
                    ugstRate: invoice.ugst_rate || invoice.ugstRate || '',
                  }),
              ),
              sgstRate: invoice.sgst_rate || invoice.sgstRate || '',
              cgstRate: invoice.cgst_rate || invoice.cgstRate || '',
              igstRate: invoice.igst_rate || invoice.igstRate || '',
              ugstRate: invoice.ugst_rate || invoice.ugstRate || '',
              sgstOutput: invoice.sgst_output || invoice.sgstOutput || '',
              cgstOutput: invoice.cgst_output || invoice.cgstOutput || '',
              igstOutput: invoice.igst_output || invoice.igstOutput || '',
              ugstOutput: invoice.ugst_output || invoice.ugstOutput || '',
              totalGST: invoice.total_gst || invoice.totalGST || '',
              tcs: invoice.tcs || '',
              subtotal: invoice.subtotal || '',
              totalInvoiceValue: invoice.total_invoice_value || invoice.totalInvoiceValue || invoice.total_amount || '',
              consigneeId: invoice.consignee_id || invoice.consigneeId || '',
              consigneeNameAddress: invoice.consignee_name_address || invoice.consigneeNameAddress || '',
              consigneeCity: invoice.consignee_city || invoice.consigneeCity || '',
              payerId: invoice.payer_id || invoice.payerId || '',
              payerNameAddress: invoice.payer_name_address || invoice.payerNameAddress || '',
              payerCity: invoice.payer_city || invoice.payerCity || '',
              lorryReceiptNo: invoice.lorry_receipt_no || invoice.lorryReceiptNo || '',
              lorryReceiptDate: formatDateForInput(invoice.lorry_receipt_date || invoice.lorryReceiptDate || ''),
              transporterId: invoice.transporter_id || invoice.transporterId || '',
              transporterName: invoice.transporter_name || invoice.transporterName || '',
              deliveryChallanNo: invoice.delivery_challan_no || invoice.deliveryChallanNo || '',
              deliveryChallanDate: formatDateForInput(invoice.delivery_challan_date || invoice.deliveryChallanDate || ''),
              paymentTermsId: invoice.payment_terms_id || invoice.paymentTermsId || '',
              paymentTerms: invoice.payment_terms || invoice.paymentTerms || '',
              paymentTextId: invoice.payment_text_id || invoice.paymentTextId || '',
              paymentText: invoice.payment_text || invoice.paymentText || '',
              firstDueDate: formatDateForInput(invoice.first_due_date || invoice.firstDueDate || ''),
              secondDueDate: formatDateForInput(invoice.second_due_date || invoice.secondDueDate || ''),
              thirdDueDate: formatDateForInput(invoice.third_due_date || invoice.thirdDueDate || ''),
              receiptDate1stDue: formatDateForInput(invoice.first_receipt_date || invoice.receiptDate1stDue || ''),
              receiptDate2ndDue: formatDateForInput(invoice.second_receipt_date || invoice.receiptDate2ndDue || ''),
              receiptDate3rdDue: formatDateForInput(invoice.third_receipt_date || invoice.receiptDate3rdDue || ''),
            }))
            
            if (invoice.id || id) {
              loadPaymentData(invoice.key_id || invoice.keyID || invoice.po_number || '')
            }
          }
        } catch (error) {
          console.error('[InvoiceEntry] Failed to load invoice:', error)
        }
      }
      loadInvoice()
    }
  }, [id, getCustomers, getConsignees, getPayers, getEmployees])
  
  const formatDateForInput = (val) => {
    if (val === undefined || val === null) return ''
    const str = typeof val === 'string' ? val.trim() : String(val)
    if (str && /^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10)
    const d = new Date(val)
    return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10)
  }

  const inferTaxTypeFromRates = (rates) => {
    const igst = parseFloat(rates?.igstRate || 0) || 0
    const cgst = parseFloat(rates?.cgstRate || 0) || 0
    const sgst = parseFloat(rates?.sgstRate || 0) || 0
    const ugst = parseFloat(rates?.ugstRate || 0) || 0
    if (ugst > 0 && igst <= 0 && cgst <= 0 && sgst <= 0) return 'UGST'
    if (cgst > 0 || sgst > 0) return 'SGST & CGST'
    if (igst > 0) return 'IGST'
    return 'IGST'
  }

  const normalizeTaxRatesByType = (fd) => {
    let taxType = coerceInvoiceTaxType(String(fd.taxType || inferTaxTypeFromRates(fd) || 'IGST'))
    const igstRate = String(fd.igstRate || '').trim()
    const cgstRate = String(fd.cgstRate || '').trim()
    const sgstRate = String(fd.sgstRate || '').trim()
    const ugstRate = String(fd.ugstRate || '').trim()

    if (taxType === 'IGST') return { ...fd, taxType, igstRate, cgstRate: '0', sgstRate: '0', ugstRate: '0' }
    if (taxType === 'UGST') return { ...fd, taxType, ugstRate, igstRate: '0', cgstRate: '0', sgstRate: '0' }
    return { ...fd, taxType: 'SGST & CGST', sgstRate, cgstRate, igstRate: '0', ugstRate: '0' }
  }

  const invoiceNumberPrefix = useMemo(
    () =>
      getInvoiceNumberPrefix(
        formData.invoiceType,
        formData.businessUnit,
        formData.businessUnitOther,
        formData.invoiceTypeOther,
        null,
      ),
    [
      formData.invoiceType,
      formData.businessUnit,
      formData.businessUnitOther,
      formData.invoiceTypeOther,
    ],
  )

  useEffect(() => {
    const prefix = getInvoiceNumberPrefix(
      formData.invoiceType,
      formData.businessUnit,
      formData.businessUnitOther,
      formData.invoiceTypeOther,
      null,
    )
    const full = String(formData.internalInvoiceNo || '').trim()
    const suffixRaw = String(formData.internalInvoiceSuffix ?? '').trim()

    if (full && suffixRaw === '') {
      if (full.startsWith(prefix)) {
        const extracted = full.slice(prefix.length)
        setFormData((prev) => ({
          ...prev,
          internalInvoiceSuffix: extracted === '0' ? '' : extracted,
        }))
        return
      }
      const m = full.match(/^INV-([^-]+)-([^-]+)-(\d{8})-(.+)$/)
      if (m && m[4]) {
        setFormData((prev) => ({
          ...prev,
          internalInvoiceSuffix: m[4] === '0' ? '' : m[4],
        }))
        return
      }
    }

    const suffix = String(formData.internalInvoiceSuffix ?? '').trim()
    // No prefix-only or stray lone "0" as the full sequence — wait for a real suffix (e.g. 0005)
    const effectiveSuffix = suffix === '0' ? '' : suffix
    const combined = effectiveSuffix ? `${prefix}${effectiveSuffix}` : ''
    if (combined !== full) {
      setFormData((prev) => ({ ...prev, internalInvoiceNo: combined }))
    }
  }, [
    formData.invoiceType,
    formData.businessUnit,
    formData.businessUnitOther,
    formData.invoiceTypeOther,
    formData.internalInvoiceSuffix,
    formData.internalInvoiceNo,
    invoiceNumberPrefix,
  ])

  const invoiceUnitSelectOptions = useMemo(
    () => unitOptionsForInvoice(poBoqItems, formData.materialLines),
    [poBoqItems, formData.materialLines],
  )

  const updateMaterialLine = (lineId, patch) => {
    setFormData((prev) => {
      const lines = Array.isArray(prev.materialLines) ? [...prev.materialLines] : []
      const idx = lines.findIndex((l) => l.id === lineId)
      if (idx < 0) return prev
      lines[idx] = { ...lines[idx], ...patch }
      const natures = lines.map((l) => l.invoiceNature).filter(Boolean)
      const states = lines.map((l) => l.stateOfSupply).filter((s) => s != null && String(s).trim() !== '')
      return {
        ...prev,
        materialLines: lines,
        materialDescriptionType: natures[0] || prev.materialDescriptionType,
        stateOfSupply: states[0] != null ? states[0] : prev.stateOfSupply,
      }
    })
  }

  const addMaterialLine = () => {
    setFormData((prev) => {
      const lines = Array.isArray(prev.materialLines) ? [...prev.materialLines] : []
      const defaultState = lines[0]?.stateOfSupply || prev.stateOfSupply || ''
      lines.push(createEmptyMaterialLine({ stateOfSupply: defaultState }))
      return { ...prev, materialLines: lines }
    })
  }

  const removeMaterialLine = (lineId) => {
    setFormData((prev) => {
      let lines = Array.isArray(prev.materialLines) ? prev.materialLines.filter((l) => l.id !== lineId) : []
      if (lines.length === 0) lines = [createEmptyMaterialLine()]
      return { ...prev, materialLines: lines }
    })
  }

  const handleMaterialLineBoqChange = (lineId, boqItemId) => {
    if (!boqItemId) {
      updateMaterialLine(lineId, { boqItemId: '', description: '', qty: '', unit: '', unitPrice: '', freight: '' })
      return
    }
    const bi = poBoqItems.find((b) => String(b.id) === String(boqItemId))
    if (!bi) return
    const qtyRaw =
      bi.totalQty != null && bi.totalQty !== ''
        ? bi.totalQty
        : (bi.originalQty ?? bi.quantity ?? bi.qty ?? '')
    const uRaw = bi.uom ?? bi.unit ?? bi.uom_uom ?? ''
    const u = normalizeInvoiceUnit(String(uRaw)) || String(uRaw).trim()
    const rate = bi.unitPrice ?? bi.basicRate ?? ''
    updateMaterialLine(lineId, {
      boqItemId: String(bi.id),
      description: String(bi.materialDescription ?? bi.description ?? '').trim(),
      qty: qtyRaw !== '' && qtyRaw != null ? String(qtyRaw) : '',
      unit: u !== '' ? String(u) : '',
      unitPrice: rate !== '' && rate != null ? String(rate) : '',
      freight: bi.freight != null && bi.freight !== '' ? String(bi.freight) : '',
    })
  }

  const handleMaterialLineNatureChange = (lineId, nature) => {
    updateMaterialLine(lineId, {
      invoiceNature: nature,
      boqItemId: '',
      description: '',
      qty: '',
      unit: '',
      unitPrice: '',
      freight: '',
    })
  }

  const handleKeyIDChange = async (e) => {
    const poNumber = e.target.value
    if (!poNumber) {
      setPoBoqItems([])
      setFormData((prev) => ({
        ...prev,
        keyID: '',
        poId: '',
        poNoReference: '',
        poDate: '',
        customerName: '',
        customerId: '',
        segment: '',
        region: '',
        zone: '',
        accountManagerName: '',
        accountManagerId: '',
        stateOfSupply: '',
        currency: 'INR',
        paymentTermsId: '',
        paymentTerms: '',
        paymentDueRows: [],
        paymentTextId: '',
        paymentText: '',
        materialDescriptionType: '',
        materialLines: [createEmptyMaterialLine()],
        qty: '',
        unit: '',
        basicRate: '',
        taxType: 'IGST',
        consigneeId: '',
        consigneeNameAddress: '',
        consigneeCity: '',
        payerId: '',
        payerNameAddress: '',
        payerCity: '',
      }))
      return
    }

    try {
      const raw = await poEntryService.getPOEntryByPONumber(poNumber)
      if (!raw) {
        showToast(`PO Number ${poNumber} not found. Please create PO Entry first.`, 'error')
        return
      }
      const fd = raw.formData || {}
      const poEntry = {
        customerId: fd.customerId ?? raw.customer_id,
        poNumber: fd.poNumber ?? raw.po_number ?? poNumber,
        poDate: formatDateForInput(fd.poDate ?? raw.issue_date ?? ''),
        customerName: fd.customerName ?? raw.customer_name ?? '',
        segment: fd.segment ?? raw.segment ?? '',
        region: fd.region ?? raw.region ?? '',
        zone: fd.zone ?? raw.zone ?? '',
        businessUnit: fd.businessUnit ?? raw.business_unit ?? '',
        salesOrderNo: fd.projectDescription ?? raw.project_description ?? raw.sales_order_no ?? '',
        accountManagerId: fd.accountManagerId ?? raw.account_manager_id ?? fd.salesManagerId ?? fd.projectManagerId ?? '',
        customerState: fd.customerState ?? raw.customer_state ?? '',
        poDeliveryState: fd.poDeliveryState ?? raw.po_delivery_state ?? '',
        poCurrency: fd.poCurrency ?? raw.currency ?? 'INR',
        paymentTermsId: fd.paymentTermsId ?? raw.payment_terms_id ?? '',
        poPaymentTerms: fd.poPaymentTerms ?? raw.payment_terms ?? '',
        paymentDueRows: Array.isArray(fd.paymentDueRows) ? fd.paymentDueRows : [],
      }

      const customer = customers.find((c) => c.id === poEntry.customerId)
      const accountManager = employees.find((e) => e.id === poEntry.accountManagerId)
      const customerName = customer?.name ?? customer?.values?.customerName ?? customer?.customerName ?? poEntry.customerName ?? ''
      const accountManagerName = accountManager?.values?.nameOfEmployee ?? accountManager?.name ?? ''
      const paymentTermsDesc =
        String(fd.poPaymentTerms ?? raw.payment_terms ?? poEntry.poPaymentTerms ?? '').trim() || ''
      const segment = poEntry.segment || customer?.segment || customer?.values?.segment || customer?.fullRecord?.values?.segment || ''
      const region = poEntry.region || customer?.values?.region || customer?.fullRecord?.values?.region || ''
      const zone = poEntry.zone || customer?.values?.zone || customer?.fullRecord?.values?.zone || ''

      const boqList = normalizePoBoqItemsFromApi(raw)
      setPoBoqItems(boqList)
      const firstBoq = boqList.length > 0 ? boqList[0] : null
      const supplyState = poEntry.customerState || poEntry.poDeliveryState || ''
      const natureFromBoq = firstBoq ? String(firstBoq.boqHeader || '').trim() : ''
      const invoiceNature = INVOICE_NATURE_OPTIONS.includes(natureFromBoq) ? natureFromBoq : ''
      const qtyStr = firstBoq
        ? (firstBoq.totalQty != null && firstBoq.totalQty !== ''
            ? String(firstBoq.totalQty)
            : String(firstBoq.originalQty ?? firstBoq.quantity ?? firstBoq.qty ?? ''))
        : ''
      const boqUnitRaw = firstBoq?.uom ?? firstBoq?.unit ?? firstBoq?.uom_uom ?? ''
      const boqUnit =
        normalizeInvoiceUnit(String(boqUnitRaw)) ||
        (UNITS.includes(String(boqUnitRaw).trim()) ? String(boqUnitRaw).trim() : String(boqUnitRaw).trim())
      const boqRate = firstBoq?.unitPrice ?? firstBoq?.basicRate ?? ''
      const boqGST = firstBoq?.gstPercent ?? firstBoq?.gst ?? ''
      const normalizedTax = normalizeTaxRatesByType({
        taxType: coerceInvoiceTaxType(formData.taxType || 'IGST'),
        igstRate: boqGST !== '' && boqGST != null ? String(boqGST) : formData.igstRate,
        cgstRate: formData.cgstRate,
        sgstRate: formData.sgstRate,
        ugstRate: formData.ugstRate,
      })
      const poDateValue = poEntry.poDate || formatDateForInput(raw.issue_date) || formatDateForInput(raw.poDate) || ''

      const firstMaterialLine = firstBoq
        ? {
            id: newMaterialLineId(),
            invoiceNature,
            stateOfSupply: supplyState,
            boqItemId: String(firstBoq.id ?? ''),
            description: String(firstBoq.materialDescription ?? firstBoq.description ?? '').trim(),
            qty: qtyStr,
            unit: (boqUnit && (UNITS.includes(boqUnit) || boqUnit === 'Other')) ? boqUnit : String(boqUnitRaw || ''),
            unitPrice: boqRate !== '' && boqRate != null ? String(boqRate) : '',
            freight: firstBoq?.freight != null && firstBoq?.freight !== '' ? String(firstBoq.freight) : '',
            taxType: normalizedTax.taxType,
          }
        : createEmptyMaterialLine({ stateOfSupply: supplyState })

      const updated = {
        ...formData,
        keyID: poNumber,
        poId: raw.id || '',
        poNoReference: poEntry.poNumber || poNumber,
        poDate: poDateValue,
        customerName: customerName,
        customerId: poEntry.customerId || '',
        segment,
        region,
        zone,
        businessUnit: poEntry.businessUnit || formData.businessUnit,
        salesOrderNo: poEntry.salesOrderNo || formData.salesOrderNo,
        accountManagerId: poEntry.accountManagerId || '',
        accountManagerName: accountManagerName,
        stateOfSupply: supplyState,
        currency: poEntry.poCurrency || 'INR',
        paymentTermsId: poEntry.paymentTermsId || '',
        paymentTerms: paymentTermsDesc,
        paymentDueRows: poEntry.paymentDueRows,
        paymentTextId: poEntry.paymentTermsId || '',
        paymentText: paymentTermsDesc,
        materialDescriptionType: invoiceNature || formData.materialDescriptionType,
        materialLines: [firstMaterialLine],
        qty: qtyStr || formData.qty,
        unit: firstBoq
          ? ((boqUnit && (UNITS.includes(boqUnit) || boqUnit === 'Other')) ? boqUnit : (formData.unit || String(boqUnitRaw || '')))
          : formData.unit,
        basicRate: boqRate !== '' && boqRate != null ? String(boqRate) : formData.basicRate,
        taxType: normalizedTax.taxType,
        igstRate: normalizedTax.igstRate,
        cgstRate: normalizedTax.cgstRate,
        sgstRate: normalizedTax.sgstRate,
        ugstRate: normalizedTax.ugstRate,
      }

      if (customer) {
        const consigneeId = customer.consigneeId ?? customer.values?.consigneeId ?? customer.fullRecord?.values?.consigneeId
        const payerId = customer.payerId ?? customer.values?.payerId ?? customer.fullRecord?.values?.payerId
        if (consigneeId && !formData.consigneeId && !formData.consigneeNameAddress) {
          const consignee = consignees.find((c) => c.id === consigneeId)
          if (consignee) {
            const addr = consignee.address ?? consignee.values?.consigneeAddress ?? consignee.fullRecord?.values?.consigneeAddress ?? consignee.fullRecord?.values?.address ?? ''
            const namePart = consignee.name ?? consignee.values?.consigneeName ?? ''
            updated.consigneeId = consigneeId
            updated.consigneeNameAddress = [namePart, addr].filter(Boolean).join('\n') || addr || namePart
            updated.consigneeCity = consignee.fullRecord?.values?.city ?? consignee.values?.city ?? ''
          }
        }
        if (payerId && !formData.payerId && !formData.payerNameAddress) {
          const payer = payers.find((p) => p.id === payerId)
          if (payer) {
            const addr = payer.address ?? payer.values?.payerAddress ?? payer.fullRecord?.values?.payerAddress ?? payer.fullRecord?.values?.address ?? ''
            const namePart = payer.name ?? payer.values?.payerName ?? ''
            updated.payerId = payerId
            updated.payerNameAddress = [namePart, addr].filter(Boolean).join('\n') || addr || namePart
            updated.payerCity = payer.fullRecord?.values?.city ?? payer.values?.city ?? ''
          }
        }
      }

      setFormData(updated)
      loadPaymentData(poNumber)
    } catch (error) {
      console.error('Failed to load PO entry:', error)
      showToast('Failed to load PO entry. Please try again.', 'error')
    }
  }
  
  const materialTableCalculations = useMemo(() => {
    const lines = Array.isArray(formData.materialLines) ? formData.materialLines : []
    const rawSgst = parseFloat(formData.sgstRate) || 0
    const rawCgst = parseFloat(formData.cgstRate) || 0
    const rawUgst = parseFloat(formData.ugstRate) || 0
    const rawIgst = parseFloat(formData.igstRate) || 0

    const byLineId = {}
    let totalQty = 0
    let totalBasic = 0
    let totalFreight = 0
    let totalTax = 0
    let sgstValue = 0
    let cgstValue = 0
    let ugstValue = 0
    let igstValue = 0

    for (const line of lines) {
      const q = parseFloat(line.qty) || 0
      const unitPrice = parseFloat(line.unitPrice) || 0
      const freight = parseFloat(line.freight) || 0
      const basic = q * unitPrice
      const taxable = basic + freight
      const taxType = coerceInvoiceTaxType(line.taxType || formData.taxType)

      let taxAmount = 0
      if (taxType === 'IGST') {
        taxAmount = taxable * (rawIgst / 100)
        igstValue += taxAmount
      } else if (taxType === 'SGST & CGST') {
        let effS = rawSgst
        let effC = rawCgst
        if (effS <= 0 && effC <= 0 && rawIgst > 0) {
          effS = rawIgst / 2
          effC = rawIgst / 2
        }
        const combined = effS + effC
        taxAmount = taxable * (combined / 100)
        if (combined > 0) {
          sgstValue += taxAmount * (effS / combined)
          cgstValue += taxAmount * (effC / combined)
        } else {
          sgstValue += taxAmount / 2
          cgstValue += taxAmount / 2
        }
      } else if (taxType === 'UGST') {
        const effRate = rawUgst / 2
        taxAmount = taxable * (effRate / 100)
        ugstValue += taxAmount
      }

      const total = taxable + taxAmount

      totalQty += q
      totalBasic += basic
      totalFreight += freight
      totalTax += taxAmount

      byLineId[line.id] = {
        basic,
        taxAmount,
        total,
      }
    }

    const subtotal = totalBasic + totalFreight
    const totalInvoiceValue = subtotal + totalTax
    const avgRate = totalQty > 0 ? totalBasic / totalQty : 0

    return {
      byLineId,
      qty: totalQty,
      basicRate: avgRate,
      basicValue: totalBasic,
      freightValue: totalFreight,
      sgstValue,
      cgstValue,
      igstValue,
      ugstValue,
      totalGST: totalTax,
      subtotal,
      totalInvoiceValue,
    }
  }, [formData.materialLines, formData.taxType, formData.sgstRate, formData.cgstRate, formData.ugstRate, formData.igstRate])

  const calculatedValues = useMemo(() => {
    const hasTabularRows = (Array.isArray(formData.materialLines) ? formData.materialLines : []).some(
      (line) => String(line.qty || '').trim() !== '' || String(line.unitPrice || '').trim() !== '' || String(line.description || '').trim() !== '',
    )
    if (!hasTabularRows) {
      return invoiceService.calculateInvoiceValues(normalizeTaxRatesByType(formData))
    }
    const normalizedTaxForm = normalizeTaxRatesByType(formData)
    const tt = coerceInvoiceTaxType(normalizedTaxForm.taxType)
    const sgstValue = tt === 'SGST & CGST' ? materialTableCalculations.sgstValue : 0
    const cgstValue = tt === 'SGST & CGST' ? materialTableCalculations.cgstValue : 0
    const igstValue = tt === 'IGST' ? materialTableCalculations.igstValue : 0
    const ugstValue = tt === 'UGST' ? materialTableCalculations.ugstValue : 0
    return {
      basicValue: materialTableCalculations.basicValue.toFixed(2),
      freightValue: materialTableCalculations.freightValue.toFixed(2),
      sgstValue: sgstValue.toFixed(2),
      cgstValue: cgstValue.toFixed(2),
      igstValue: igstValue.toFixed(2),
      ugstValue: ugstValue.toFixed(2),
      totalGST: materialTableCalculations.totalGST.toFixed(2),
      subtotal: materialTableCalculations.subtotal.toFixed(2),
      totalInvoiceValue: materialTableCalculations.totalInvoiceValue.toFixed(2),
    }
  }, [formData, materialTableCalculations])

  const materialAggregateDisplay = useMemo(() => {
    const useAgg = (Array.isArray(formData.materialLines) ? formData.materialLines : []).some(
      (line) => String(line.qty || '').trim() !== '' || String(line.unitPrice || '').trim() !== '',
    )
    return {
      qty: useAgg ? String(materialTableCalculations.qty) : formData.qty,
      basicRate: useAgg ? String(materialTableCalculations.basicRate.toFixed(4)) : formData.basicRate,
    }
  }, [formData.materialLines, formData.qty, formData.basicRate, materialTableCalculations])
  
  const dueCalculations = useMemo(() => {
    return invoiceService.calculateDueDates(
      formData.gstTaxInvoiceDate || new Date().toISOString().split('T')[0],
      formData.paymentTerms,
      calculatedValues.totalInvoiceValue,
      formData.paymentDueRows
    )
  }, [formData.gstTaxInvoiceDate, formData.paymentTerms, calculatedValues.totalInvoiceValue, formData.paymentDueRows])
  
  const calculateDueStage = (dueDate, dueAmount, receivedAmount, receiptDate) => {
    if (!dueDate || !dueAmount) {
      return {
        balance: '0.00',
        notDue: '0.00',
        overdue: '0.00',
        daysOutstanding: '0',
      }
    }
    
    const due = parseFloat(dueAmount || 0)
    const received = parseFloat(receivedAmount || 0)
    const balance = due - received
    
    const days = invoiceService.calculateDaysOutstanding(dueDate, receiptDate)
    const status = invoiceService.calculateDueStatus(dueDate, receivedAmount, dueAmount)
    
    return {
      balance: balance.toFixed(2),
      notDue: status.notDue ? balance.toFixed(2) : '0.00',
      overdue: status.overdue ? balance.toFixed(2) : '0.00',
      daysOutstanding: String(days),
    }
  }
  
  const dueStageCalculations = useMemo(() => {
    const first = calculateDueStage(
      dueCalculations.firstDueDate || formData.firstDueDate,
      dueCalculations.firstDueAmount || formData.firstDueAmount,
      formData.paymentReceivedAmount1stDue,
      formData.receiptDate1stDue
    )
    const second = calculateDueStage(
      dueCalculations.secondDueDate || formData.secondDueDate,
      dueCalculations.secondDueAmount || formData.secondDueAmount,
      formData.paymentReceivedAmount2ndDue,
      formData.receiptDate2ndDue
    )
    const third = calculateDueStage(
      dueCalculations.thirdDueDate || formData.thirdDueDate,
      dueCalculations.thirdDueAmount || formData.thirdDueAmount,
      formData.paymentReceivedAmount3rdDue,
      formData.receiptDate3rdDue
    )
    
    const totalBalance = parseFloat(first.balance) + parseFloat(second.balance) + parseFloat(third.balance)
    const notDueTotal = parseFloat(first.notDue) + parseFloat(second.notDue) + parseFloat(third.notDue)
    const overDueTotal = parseFloat(first.overdue) + parseFloat(second.overdue) + parseFloat(third.overdue)
    
    return {
      first,
      second,
      third,
      totalBalance: totalBalance.toFixed(2),
      notDueTotal: notDueTotal.toFixed(2),
      overDueTotal: overDueTotal.toFixed(2),
    }
  }, [
    dueCalculations,
    formData.paymentReceivedAmount1stDue,
    formData.receiptDate1stDue,
    formData.paymentReceivedAmount2ndDue,
    formData.receiptDate2ndDue,
    formData.paymentReceivedAmount3rdDue,
    formData.receiptDate3rdDue,
  ])
  
  const displayData = {
    ...formData,
    ...materialAggregateDisplay,
    ...calculatedValues,
    ...dueCalculations,
    sgstOutput: calculatedValues.sgstValue,
    cgstOutput: calculatedValues.cgstValue,
    igstOutput: calculatedValues.igstValue,
    ugstOutput: calculatedValues.ugstValue,
    firstDueBalance: dueStageCalculations.first.balance,
    notDue1stDue: dueStageCalculations.first.notDue,
    overDue1stDue: dueStageCalculations.first.overdue,
    noOfDaysOfPaymentReceipt1stDue: dueStageCalculations.first.daysOutstanding,
    secondDueBalance: dueStageCalculations.second.balance,
    notDue2ndDue: dueStageCalculations.second.notDue,
    overDue2ndDue: dueStageCalculations.second.overdue,
    noOfDaysOfPaymentReceipt2ndDue: dueStageCalculations.second.daysOutstanding,
    thirdDueBalance: dueStageCalculations.third.balance,
    notDue3rdDue: dueStageCalculations.third.notDue,
    overDue3rdDue: dueStageCalculations.third.overdue,
    noOfDaysOfPaymentReceipt3rdDue: dueStageCalculations.third.daysOutstanding,
    totalBalance: dueStageCalculations.totalBalance,
    notDueTotal: dueStageCalculations.notDueTotal,
    overDueTotal: dueStageCalculations.overDueTotal,
  }
  
  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'keyID') {
      handleKeyIDChange(e)
      return
    }
    if (name === 'taxType') {
      const next = coerceInvoiceTaxType(value)
      setFormData((prev) => {
        const lines = (Array.isArray(prev.materialLines) ? prev.materialLines : []).map((l) => ({
          ...l,
          taxType: next,
        }))
        const patch = { ...prev, taxType: next, materialLines: lines }
        if (next === 'SGST & CGST') {
          const ig = parseFloat(prev.igstRate) || 0
          const sg = parseFloat(prev.sgstRate) || 0
          const cg = parseFloat(prev.cgstRate) || 0
          if (ig > 0 && sg <= 0 && cg <= 0) {
            patch.sgstRate = String(ig / 2)
            patch.cgstRate = String(ig / 2)
            patch.igstRate = ''
          }
        } else if (next === 'UGST') {
          const ug = parseFloat(prev.ugstRate) || 0
          const ig = parseFloat(prev.igstRate) || 0
          if (ug <= 0 && ig > 0) {
            patch.ugstRate = String(prev.igstRate)
            patch.igstRate = ''
          }
        }
        return patch
      })
      return
    }
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleConsigneeChange = (e) => {
    const consigneeId = e.target.value
    if (!consigneeId) {
      setFormData((prev) => ({
        ...prev,
        consigneeId: '',
      }))
      return
    }
    
    const consignee = consignees.find((c) => c.id === consigneeId)
    if (consignee) {
      const consigneeName = consignee.values?.consigneeName || ''
      const consigneeAddress = consignee.values?.consigneeAddress || ''
      const addressParts = [consigneeName, consigneeAddress].filter(Boolean)
      const address = addressParts.join('\n') || ''
      const city = consignee.values?.city || ''
      
      setFormData((prev) => ({
        ...prev,
        consigneeId,
        consigneeNameAddress: address,
        consigneeCity: city,
      }))
    }
  }

  const handlePayerChange = (e) => {
    const payerId = e.target.value
    if (!payerId) {
      setFormData((prev) => ({
        ...prev,
        payerId: '',
      }))
      return
    }
    
    const payer = payers.find((p) => p.id === payerId)
    if (payer) {
      const payerName = payer.values?.payerName || ''
      const payerAddress = payer.values?.payerAddress || ''
      const addressParts = [payerName, payerAddress].filter(Boolean)
      const address = addressParts.join('\n') || ''
      const city = payer.values?.city || ''
      
      setFormData((prev) => ({
        ...prev,
        payerId,
        payerNameAddress: address,
        payerCity: city,
      }))
    }
  }

  const handleTransporterChange = (e) => {
    const transporterId = e.target.value
    if (!transporterId) {
      setFormData((prev) => ({
        ...prev,
        transporterId: '',
        transporterName: '',
      }))
      return
    }
    
    const transporter = employees.find((emp) => emp.id === transporterId)
    if (transporter) {
      const name = transporter.values?.nameOfEmployee || transporter.values?.transporterName || transporter.name || ''
      setFormData((prev) => ({
        ...prev,
        transporterId,
        transporterName: name,
      }))
    }
  }

  const handleInvoiceReceiptPersonChange = (e) => {
    const invoiceReceiptPersonId = e.target.value
    if (!invoiceReceiptPersonId) {
      setFormData((prev) => ({
        ...prev,
        invoiceReceiptPersonId: '',
        invoiceReceiptPersonName: '',
      }))
      return
    }
    
    const person = employees.find((emp) => emp.id === invoiceReceiptPersonId)
    if (person) {
      const name = person.values?.nameOfEmployee || person.name || ''
      setFormData((prev) => ({
        ...prev,
        invoiceReceiptPersonId,
        invoiceReceiptPersonName: name,
      }))
    }
  }

  const handleSaveDraft = () => {
    try {
      persistNow()
      showToast('Draft saved successfully!', 'success')
    } catch (error) {
      console.error('Failed to save draft:', error)
      showToast('Failed to save draft. Please try again.', 'error')
    }
  }

  const handleReset = () => {
    if (typeof resetForm === 'function') {
      resetForm()
    } else {
      setFormData({ ...INITIAL_INVOICE_FORM_DATA })
      if (!id && typeof clearLocalDraft === 'function') clearLocalDraft()
    }
    showToast('Form reset', 'success')
  }

  const handleAutoFill = () => {
    const today = new Date().toISOString().split('T')[0]
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 30)
    const futureDateStr = futureDate.toISOString().split('T')[0]
    
    const getFirstId = (list) => {
      return Array.isArray(list) && list.length > 0 ? list[0].id : ''
    }
    
    setFormData((prev) => ({
      ...prev,
      gstTaxInvoiceNo: prev.gstTaxInvoiceNo || 'GST/INV/2025-26/001',
      gstTaxInvoiceDate: prev.gstTaxInvoiceDate || today,
      internalInvoiceSuffix: (() => {
        const s = prev.internalInvoiceSuffix
        const t = s === undefined || s === null ? '' : String(s).trim()
        if (t === '' || t === '0') return '0005'
        return t
      })(),
      
      region: prev.region || 'North',
      zone: prev.zone || 'North',
      salesOrderNo: prev.salesOrderNo || 'SO/2025-26/001',
      poDate: prev.poDate || today,
      
      materialDescriptionType: prev.materialDescriptionType || 'Supply',
      materialLines: Array.isArray(prev.materialLines) && prev.materialLines.some((l) => String(l.qty || '').trim())
        ? prev.materialLines.map((l) => ({ ...l, taxType: 'IGST' }))
        : [
            createEmptyMaterialLine({
              invoiceNature: 'Supply',
              stateOfSupply: 'Maharashtra',
              description: 'Structural steel (sample)',
              qty: '100',
              unit: 'MT',
              unitPrice: '50000',
              taxType: 'IGST',
            }),
          ],
      stateOfSupply: prev.stateOfSupply || 'Maharashtra',
      qty: prev.qty || '100',
      unit: prev.unit || 'MT',
      
      basicRate: prev.basicRate || '50000',
      freightInvoiceNo: prev.freightInvoiceNo || 'FRT/2025-26/001',
      freightRate: prev.freightRate || '5000',
      taxType: 'IGST',
      sgstRate: '',
      cgstRate: '',
      igstRate: prev.igstRate || '18',
      ugstRate: '',
      tcs: prev.tcs || '0',
      
      consigneeNameAddress: prev.consigneeNameAddress || 'ABC Logistics Solutions\n123 Warehouse Complex, Industrial Estate\nMumbai, Maharashtra',
      consigneeCity: prev.consigneeCity || 'Mumbai',
      payerNameAddress: prev.payerNameAddress || 'XYZ Trading Company\n456 Commercial Street\nChennai, Tamil Nadu',
      payerCity: prev.payerCity || 'Chennai',
      
      lorryReceiptNo: prev.lorryReceiptNo || 'LR/2025-26/001',
      lorryReceiptDate: prev.lorryReceiptDate || today,
      ...(() => {
        const transporterId = prev.transporterId || getFirstId(employees.filter((emp) => {
          const role = (emp.values?.role || emp.role || '').toLowerCase()
          return role.includes('transporter')
        }))
        const transporter = employees.find((emp) => emp.id === transporterId)
        const transporterName = transporter 
          ? (transporter.values?.nameOfEmployee || transporter.values?.transporterName || transporter.name || 'Fast Track Logistics')
          : (prev.transporterName || 'Fast Track Logistics')
        return {
          transporterId,
          transporterName,
        }
      })(),
      deliveryChallanNo: prev.deliveryChallanNo || 'DC/2025-26/001',
      deliveryChallanDate: prev.deliveryChallanDate || today,
      
      materialInspectionRequestDate: prev.materialInspectionRequestDate || today,
      inspectionOfferDate: prev.inspectionOfferDate || futureDateStr,
      materialInspectionDate: prev.materialInspectionDate || futureDateStr,
      deliveryInstructionDate: prev.deliveryInstructionDate || futureDateStr,
      deliveryInspectionCIPReceivedDate: prev.deliveryInspectionCIPReceivedDate || futureDateStr,
      miccReceiptDate: prev.miccReceiptDate || futureDateStr,
      lastDateOfDispatch: prev.lastDateOfDispatch || futureDateStr,
      invoiceReadyDate: prev.invoiceReadyDate || futureDateStr,
      
      courierDocumentNo: prev.courierDocumentNo || 'COURIER/2025-26/001',
      courierDocumentDate: prev.courierDocumentDate || today,
      courierCompanyName: prev.courierCompanyName || 'Blue Dart Express',
      billSentToPersonName: prev.billSentToPersonName || 'John Doe',
      billSentDate: prev.billSentDate || today,
      
      lastDateOfMaterialReceipt: prev.lastDateOfMaterialReceipt || today,
      invoiceReceiptDate: prev.invoiceReceiptDate || today,
      ...(() => {
        const invoiceReceiptPersonId = prev.invoiceReceiptPersonId || getFirstId(employees)
        const person = employees.find((emp) => emp.id === invoiceReceiptPersonId)
        const invoiceReceiptPersonName = person
          ? (person.values?.nameOfEmployee || person.name || 'Jane Smith')
          : (prev.invoiceReceiptPersonName || 'Jane Smith')
        return {
          invoiceReceiptPersonId,
          invoiceReceiptPersonName,
        }
      })(),
      materialVerificationDate: prev.materialVerificationDate || today,
      
      jvrDate: prev.jvrDate || today,
      srnDate: prev.srnDate || today,
      mrcDate: prev.mrcDate || today,
      invoiceSubmissionAtSiteDate: prev.invoiceSubmissionAtSiteDate || today,
      invoiceForwardedToHODate: prev.invoiceForwardedToHODate || today,
      invoiceForwardedForPaymentDate: prev.invoiceForwardedForPaymentDate || today,
      
      itTDS2Percent: prev.itTDS2Percent || '0',
      itTDS1Percent194Q: prev.itTDS1Percent194Q || '0',
      lcessBoq1Percent: prev.lcessBoq1Percent || '0',
      tds2PercentCGSTSGST: prev.tds2PercentCGSTSGST || '0',
      tdsOnCGST1Percent: prev.tdsOnCGST1Percent || '0',
      tdsOnSGST1Percent: prev.tdsOnSGST1Percent || '0',
      
      excessSupplyQty: prev.excessSupplyQty || '0',
      interestOnAdvance: prev.interestOnAdvance || '0',
      anyHold: prev.anyHold || '0',
      penaltyLDDeduction: prev.penaltyLDDeduction || '0',
      bankCharges: prev.bankCharges || '0',
      lcDiscrepancyCharge: prev.lcDiscrepancyCharge || '0',
      provisionForBadDebts: prev.provisionForBadDebts || '0',
      badDebts: prev.badDebts || '0',
    }))
    
    showToast('Sample data filled! You can modify any field as needed.', 'success')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.keyID) {
      showToast('Key ID (PO Number) is mandatory. Please select a PO Number.', 'error')
      return
    }

    if (!formData.customerId) {
      showToast('No customer linked to the selected Key ID (PO). Please re-select a Key ID that has a customer, or create the PO with a customer first.', 'error')
      return
    }
    
    if (!formData.gstTaxInvoiceNo || !formData.gstTaxInvoiceDate) {
      showToast('GST Tax Invoice No and Date are required.', 'error')
      return
    }

    const invSuf = String(formData.internalInvoiceSuffix || '').trim()
    if (!id && (!invSuf || invSuf === '0')) {
      showToast('Enter the internal invoice sequence (suffix), e.g. 0005, after the prefix.', 'error')
      return
    }
    
    try {
      const calculatedTotal = parseFloat(displayData.totalInvoiceValue || calculatedValues.totalInvoiceValue || formData.totalInvoiceValue || 0)
      const finalTotalInvoiceValue = isNaN(calculatedTotal) ? 0 : calculatedTotal
      
      console.log('[InvoiceEntry] Submitting invoice with totalInvoiceValue:', finalTotalInvoiceValue, 'from displayData:', displayData.totalInvoiceValue, 'calculatedValues:', calculatedValues.totalInvoiceValue)
      
      const linesPayload = (Array.isArray(formData.materialLines) ? formData.materialLines : [])
        .filter((l) => String(l.boqItemId || '').trim() !== '' || String(l.description || '').trim() !== '')
        .map((l, i) => ({
          lineNumber: i + 1,
          description: String(l.description || `Line ${i + 1}`).trim() || `Line ${i + 1}`,
          quantity: parseFloat(l.qty) || 0,
          unitPrice: parseFloat(l.unitPrice) || 0,
        }))

      const firstLine = Array.isArray(formData.materialLines) ? formData.materialLines[0] : null
      const invoiceData = {
        ...formData,
        ...displayData,
        total_amount: finalTotalInvoiceValue,
        totalInvoiceValue: finalTotalInvoiceValue,
        key_id: formData.keyID, // Store Key ID for reporting
        poId: formData.poId || undefined, // Preferred: backend uses this for PO lookup when present
        invoice_number: formData.internalInvoiceNo,
        issue_date: formData.gstTaxInvoiceDate,
        status: id ? (formData.status || 'open') : 'open', // New invoices: open (DB-safe); edit preserves status
        materialDescriptionType: firstLine?.invoiceNature || formData.materialDescriptionType,
        state_of_supply: firstLine?.stateOfSupply || formData.stateOfSupply,
        lines: linesPayload.length > 0 ? linesPayload : undefined,
      }
      
      let savedInvoice
      if (id) {
        const response = await updateInvoice(id, invoiceData)
        savedInvoice = response?.data || response
        try {
          window.dispatchEvent(new CustomEvent('invoiceUpdated', { detail: { invoice: savedInvoice } }))
        } catch (e) {
          console.warn('[InvoiceEntry] Failed to dispatch invoiceUpdated event:', e)
        }
      } else {
        savedInvoice = await invoiceService.saveInvoice(invoiceData)
        
        const invoiceFromResponse = savedInvoice?.data?.data || savedInvoice?.data || savedInvoice
        
        const invoiceWithStatus = {
          ...invoiceFromResponse,
          status: invoiceFromResponse?.status || invoiceData.status || 'open'
        }
        
        console.log('[InvoiceEntry] Created invoice with status:', invoiceWithStatus.status, invoiceWithStatus)
        
        window.dispatchEvent(new CustomEvent('invoiceUpdated', { detail: { invoice: invoiceWithStatus } }))
        
        try {
          const refreshedInvoice = await getInvoiceById(invoiceWithStatus?.id || savedInvoice?.id)
          const refreshedData = refreshedInvoice?.data?.data || refreshedInvoice?.data || refreshedInvoice
          if (refreshedData) {
            const finalInvoice = {
              ...refreshedData,
              status: refreshedData.status || invoiceData.status || 'open'
            }
            console.log('[InvoiceEntry] Refreshed invoice with status:', finalInvoice.status)
            window.dispatchEvent(new CustomEvent('invoiceUpdated', { detail: { invoice: finalInvoice } }))
          }
        } catch (e) {
          console.warn('[InvoiceEntry] Failed to refresh invoice after save:', e)
        }
      }
      
      if (savedInvoice?.id || id) {
        try {
          const refreshedInvoice = await getInvoiceById(savedInvoice?.id || id)
          const invoiceData = refreshedInvoice?.data || refreshedInvoice
          if (invoiceData) {
            const invoice = invoiceData.data || invoiceData
            setFormData(prev => ({
              ...prev,
              gstTaxInvoiceNo: invoice.gst_tax_invoice_no || invoice.gstTaxInvoiceNo || prev.gstTaxInvoiceNo,
              gstTaxInvoiceDate: invoice.gst_tax_invoice_date || invoice.gstTaxInvoiceDate || prev.gstTaxInvoiceDate,
              internalInvoiceNo: invoice.internal_invoice_no || invoice.internalInvoiceNo || invoice.invoice_number || prev.internalInvoiceNo,
              totalInvoiceValue: invoice.total_invoice_value || invoice.totalInvoiceValue || invoice.total_amount || prev.totalInvoiceValue,
              status: invoice.status || prev.status,
            }))
          }
        } catch (refreshError) {
          console.warn('[InvoiceEntry] Failed to refresh invoice after save:', refreshError)
        }
      }
      
      const finalInvoice = savedInvoice?.data?.data || savedInvoice?.data || savedInvoice
      const invoiceNumber = finalInvoice?.invoice_number || finalInvoice?.internal_invoice_no || finalInvoice?.internalInvoiceNo || formData.internalInvoiceNo || ''
      const invoiceStatus = finalInvoice?.status || invoiceData.status || 'open'
      
      console.log('[InvoiceEntry] Invoice saved - Number:', invoiceNumber, 'Status:', invoiceStatus)
      
      showToast(`Invoice ${invoiceNumber} saved successfully!`, 'success')
      if (typeof clearLocalDraft === 'function') clearLocalDraft()
      
      setTimeout(() => {
        navigate('/invoices', { state: { fromCreate: true, invoiceStatus }, replace: false })
      }, 100)
    } catch (error) {
      console.error('Failed to save invoice:', error)
      const msg = error?.response?.data?.message || error?.message || 'Failed to save invoice. Please try again.'
      const code = error?.response?.data?.code || ''
      const isDuplicate = code === 'ERR_DUPLICATE' || /already exists/i.test(String(msg))
      showToast(msg, 'error')
      if (isDuplicate) {
        window.dispatchEvent(new CustomEvent('invoiceUpdated', { detail: {} }))
        navigate('/invoices')
      }
    }
  }
  
  const renderField = (fieldName, label, type = FIELD_TYPES.MANUAL, options = [], placeholder = '', required = false) => {
    const isReadOnly = type === FIELD_TYPES.DEFAULT || type === FIELD_TYPES.CALCULATED || isViewMode
    const isCalculated = type === FIELD_TYPES.CALCULATED
    const value = displayData[fieldName] || formData[fieldName] || ''
    
    if (type === FIELD_TYPES.DROPDOWN) {
      const selectValue =
        fieldName === 'taxType' ? coerceInvoiceTaxType(formData[fieldName]) : formData[fieldName] || ''
      return (
        <div className="invoice-entry-field" key={fieldName}>
          <label htmlFor={fieldName} className="invoice-entry-label">
            {label} {required && <span className="invoice-entry-required">*</span>}
          </label>
          <select
            id={fieldName}
            name={fieldName}
            value={selectValue}
            onChange={handleChange}
            className="invoice-entry-select"
            required={required}
            disabled={isReadOnly}
          >
            {fieldName !== 'taxType' && <option value="">Select {label}</option>}
            {options.map((opt) => {
              const v = typeof opt === 'object' && opt !== null && 'value' in opt ? opt.value : opt
              const lab =
                typeof opt === 'object' && opt !== null && 'label' in opt ? opt.label : String(opt)
              return (
                <option key={String(v)} value={String(v)}>
                  {lab}
                </option>
              )
            })}
          </select>
          {formData[fieldName] === 'Other' && (
            <input
              type="text"
              name={`${fieldName}Other`}
              value={formData[`${fieldName}Other`] || ''}
              onChange={handleChange}
              className="invoice-entry-input"
              placeholder={`Enter ${label}`}
              style={{ marginTop: '8px' }}
            />
          )}
        </div>
      )
    }
    
    if (fieldName.includes('Date')) {
      return (
        <div className="invoice-entry-field" key={fieldName}>
          <label htmlFor={fieldName} className="invoice-entry-label">
            {label} {required && <span className="invoice-entry-required">*</span>}
          </label>
          <DatePicker
            id={fieldName}
            name={fieldName}
            selected={value}
            onChange={handleChange}
            disabled={isReadOnly}
            required={required && !isReadOnly}
            placeholderText={placeholder || `Select ${label.toLowerCase()}...`}
            className={isCalculated ? 'invoice-entry-input-calculated' : ''}
          />
          {isCalculated && <small className="invoice-entry-hint">System Calculated</small>}
          {isReadOnly && !isCalculated && !isViewMode && <small className="invoice-entry-hint">Auto-filled from PO/Master Data</small>}
        </div>
      )
    }

    return (
      <div className="invoice-entry-field" key={fieldName}>
        <label htmlFor={fieldName} className="invoice-entry-label">
          {label} {required && <span className="invoice-entry-required">*</span>}
        </label>
        <input
          type={fieldName.includes('Amount') || fieldName.includes('Value') || fieldName.includes('Rate') || fieldName.includes('Qty') || fieldName.includes('Percent') ? 'number' : 'text'}
          id={fieldName}
          name={fieldName}
          value={value}
          onChange={handleChange}
          className={`invoice-entry-input ${isReadOnly ? 'invoice-entry-input-readonly' : ''} ${isCalculated ? 'invoice-entry-input-calculated' : ''}`}
          readOnly={isReadOnly}
          disabled={isReadOnly}
          required={required && !isReadOnly}
          placeholder={placeholder}
          step={fieldName.includes('Rate') || fieldName.includes('Percent') ? '0.01' : fieldName.includes('Qty') ? '0.01' : '0.01'}
        />
        {isCalculated && <small className="invoice-entry-hint">System Calculated</small>}
        {isReadOnly && !isCalculated && !isViewMode && <small className="invoice-entry-hint">Auto-filled from PO/Master Data</small>}
      </div>
    )
  }
  
  return (
    <div className="invoice-entry-page">
      {/* Page Header */}
      <div className="invoice-entry-header">
        <button
          type="button"
          onClick={() => navigate('/invoices')}
          className="invoice-entry-back-button"
          aria-label="Back"
        >
          <ArrowLeft className="invoice-entry-back-icon" />
          <span>Back</span>
        </button>
        
        <div className="invoice-entry-header-content">
          <h1 className="invoice-entry-title">Invoice Entry</h1>
          {(() => {
            const suf = String(formData.internalInvoiceSuffix || '').trim()
            const show = suf.length > 0 && suf !== '0' && formData.internalInvoiceNo
            return show ? (
              <p className="invoice-entry-subtitle">Internal Invoice No: {formData.internalInvoiceNo}</p>
            ) : null
          })()}
        </div>
        
        <div className="invoice-entry-header-actions">
          {!id && (
            <button
              type="button"
              onClick={handleAutoFill}
              className="invoice-entry-action-button invoice-entry-action-button-secondary"
              title="Auto-fill sample data for testing (only manual fields)"
            >
              <Zap className="invoice-entry-action-icon" />
              <span>Auto-Fill Sample Data</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowFieldSelector(true)}
            className="invoice-entry-action-button invoice-entry-action-button-secondary"
          >
            <span>Field Selection</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="invoice-entry-action-button invoice-entry-action-button-secondary"
            title="Clear form and start over"
          >
            <RotateCcw className="invoice-entry-action-icon" size={18} />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            className="invoice-entry-action-button invoice-entry-action-button-secondary"
          >
            <Save className="invoice-entry-action-icon" />
            <span>Save Draft</span>
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="invoice-entry-form">
        {/* Top: type, unit & manual invoice number only */}
        <div className="invoice-entry-section invoice-entry-section--identification-top">
          <h2 className="invoice-entry-section-title">Invoice Identification</h2>
          <p className="invoice-entry-section-lead">
            Enter the internal invoice sequence (suffix); it is saved as prefix + your entry. Invoice type and business unit (which shape the prefix) are in <strong>PO link &amp; GST details</strong> below.
          </p>
          <div className="invoice-entry-form-grid">
            <div className="invoice-entry-field invoice-entry-field--internal-inv-split invoice-entry-field-full" key="internalInvoiceSplit">
              <span className="invoice-entry-label">
                Internal Invoice No <span className="invoice-entry-required">*</span>
              </span>
              <div className="invoice-entry-internal-inv-row">
                <span className="invoice-entry-inv-prefix" title="Sequence prefix (Invoice Type, Business Unit, financial year)">
                  {invoiceNumberPrefix}
                </span>
                <input
                  type="text"
                  id="internalInvoiceSuffix"
                  name="internalInvoiceSuffix"
                  value={formData.internalInvoiceSuffix}
                  onChange={handleChange}
                  onBlur={(e) => {
                    const v = String(e.target.value || '').trim()
                    if (v === '0') {
                      setFormData((prev) => ({ ...prev, internalInvoiceSuffix: '', internalInvoiceNo: '' }))
                    }
                  }}
                  className="invoice-entry-input invoice-entry-inv-suffix"
                  placeholder="e.g. 0005"
                  autoComplete="off"
                  readOnly={isViewMode}
                  disabled={isViewMode}
                  required={!id && !isViewMode}
                  aria-label="Internal invoice number suffix"
                />
              </div>
              <small className="invoice-entry-hint">
                {(() => {
                  const suf = String(formData.internalInvoiceSuffix || '').trim()
                  const eff = suf === '0' ? '' : suf
                  const preview = eff && formData.internalInvoiceNo ? formData.internalInvoiceNo : `${invoiceNumberPrefix}…`
                  return (
                    <>
                      Saved as: <span className="invoice-entry-mono">{preview}</span>
                    </>
                  )
                })()}
              </small>
            </div>
          </div>
        </div>

        <div className="invoice-entry-section invoice-entry-section--link-tax">
          <h2 className="invoice-entry-section-title">PO link &amp; GST details</h2>
          <div className="invoice-entry-form-grid">
            {renderField('keyID', 'Key ID (PO Number)', FIELD_TYPES.DROPDOWN,
              poNumbersLoading ? [] : (poEntries || []).map((po) => po?.poNumber ?? '').filter(Boolean),
              '', true)}
            {renderField('gstTaxInvoiceNo', 'GST Tax Invoice No', FIELD_TYPES.MANUAL, [], '', true)}
            {renderField('gstTaxInvoiceDate', 'GST Tax Invoice Date', FIELD_TYPES.MANUAL, [], '', true)}
            {renderField('invoiceType', 'Invoice Type', FIELD_TYPES.DROPDOWN, INVOICE_TYPES)}
            {renderField('businessUnit', 'Business Unit', FIELD_TYPES.DROPDOWN, BUSINESS_UNITS)}
          </div>
        </div>

        {/* ========== CUSTOMER & PO DETAILS SECTION ========== */}
        <div className="invoice-entry-section">
          <h2 className="invoice-entry-section-title">Customer & PO Details</h2>
          <div className="invoice-entry-form-grid">
            {renderField('customerName', 'Customer Name', FIELD_TYPES.DEFAULT)}
            {renderField('segment', 'Segment', FIELD_TYPES.DEFAULT)}
            {renderField('region', 'Region', FIELD_TYPES.MANUAL)}
            {renderField('zone', 'Zone', FIELD_TYPES.DROPDOWN, ZONES)}
            {renderField('salesOrderNo', 'Sales Order No', FIELD_TYPES.MANUAL)}
            {renderField('accountManagerName', 'Account Manager Name', FIELD_TYPES.MANUAL)}
            {renderField('poNoReference', 'PO No / Reference', FIELD_TYPES.DEFAULT)}
            {renderField('poDate', 'PO Date', FIELD_TYPES.MANUAL)}
          </div>
        </div>

        {/* ========== MATERIAL & SUPPLY DETAILS SECTION ========== */}
        <div className="invoice-entry-section">
          <div className="invoice-entry-material-heading">
            <h2 className="invoice-entry-section-title">Material &amp; Supply Details</h2>
            <button
              type="button"
              className="invoice-entry-add-line-button"
              onClick={addMaterialLine}
              disabled={isViewMode}
            >
              <Plus size={18} aria-hidden />
              Add line
            </button>
          </div>
          <p className="invoice-entry-section-lead" style={{ marginTop: '-8px' }}>
            Select <strong>Invoice nature</strong> first, then choose a line from the PO BOQ that matches that nature. Qty and unit fill from the PO; adjust if needed. Add more lines for multiple items on one invoice.
          </p>
          {!formData.keyID && (
            <p className="invoice-entry-hint" style={{ marginBottom: '12px' }}>
              Choose a Key ID (PO) above to load BOQ lines for Select description.
            </p>
          )}
          <div className="invoice-entry-index-table-wrapper">
            <table className="invoice-entry-index-table">
              <thead>
                <tr>
                  <th>Invoice Nature</th>
                  <th>State of Supply</th>
                  <th>Item Description</th>
                  <th>Qty</th>
                  <th>UOM</th>
                  <th>Unit Price</th>
                  <th>Total Basic Amount</th>
                  <th>Tax Type</th>
                  <th>Tax Amount</th>
                  <th>Freight</th>
                  <th>Total Amount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(formData.materialLines) ? formData.materialLines : []).map((line, lineIndex) => {
                  const filteredBoq = poBoqItems.filter((b) => {
                    if (!line.invoiceNature) return false
                    const h = String(b.boqHeader || '').trim().toLowerCase()
                    const n = String(line.invoiceNature).trim().toLowerCase()
                    return h === n
                  })
                  const lineCalc = materialTableCalculations.byLineId[line.id] || { basic: 0, taxAmount: 0, total: 0 }
                  return (
                    <tr key={line.id}>
                      <td>
                        <select
                          id={`invNature-${line.id}`}
                          className="invoice-entry-select"
                          value={line.invoiceNature || ''}
                          onChange={(e) => handleMaterialLineNatureChange(line.id, e.target.value)}
                          disabled={isViewMode}
                        >
                          <option value="">Select</option>
                          {INVOICE_NATURE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          id={`stateSupply-${line.id}`}
                          className="invoice-entry-select"
                          value={line.stateOfSupply || ''}
                          onChange={(e) => updateMaterialLine(line.id, { stateOfSupply: e.target.value })}
                          disabled={isViewMode}
                        >
                          <option value="">Select</option>
                          {INDIA_STATES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          id={`boqDesc-${line.id}`}
                          className="invoice-entry-select"
                          value={line.boqItemId || ''}
                          onChange={(e) => handleMaterialLineBoqChange(line.id, e.target.value)}
                          disabled={isViewMode || !line.invoiceNature || !formData.keyID}
                        >
                          <option value="">
                            {!formData.keyID
                              ? 'Select Key ID first'
                              : !line.invoiceNature
                                ? 'Select nature first'
                                : filteredBoq.length === 0
                                  ? 'No BOQ rows'
                                  : 'Select BOQ line'}
                          </option>
                          {filteredBoq.map((b) => {
                            const label = String(b.materialDescription || b.description || 'Item').trim() || `BOQ #${b.id}`
                            return (
                              <option key={b.id} value={String(b.id)}>
                                {label.length > 120 ? `${label.slice(0, 120)}...` : label}
                              </option>
                            )
                          })}
                        </select>
                      </td>
                      <td>
                        <input
                          id={`qty-${line.id}`}
                          type="number"
                          className="invoice-entry-input"
                          value={line.qty ?? ''}
                          onChange={(e) => updateMaterialLine(line.id, { qty: e.target.value })}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          disabled={isViewMode}
                        />
                      </td>
                      <td>
                        <select
                          id={`unit-${line.id}`}
                          className="invoice-entry-select"
                          value={line.unit || ''}
                          onChange={(e) => updateMaterialLine(line.id, { unit: e.target.value })}
                          disabled={isViewMode}
                        >
                          <option value="">Select</option>
                          {invoiceUnitSelectOptions.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          id={`unitPrice-${line.id}`}
                          type="text"
                          className="invoice-entry-input invoice-entry-input-readonly"
                          readOnly
                          tabIndex={-1}
                          value={line.unitPrice ?? ''}
                          aria-label="Unit price from PO"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="invoice-entry-input invoice-entry-input-calculated"
                          value={lineCalc.basic.toFixed(2)}
                          readOnly
                        />
                      </td>
                      <td>
                        <select
                          className="invoice-entry-select"
                          value={coerceInvoiceTaxType(line.taxType || formData.taxType)}
                          onChange={(e) => updateMaterialLine(line.id, { taxType: coerceInvoiceTaxType(e.target.value) })}
                          disabled={isViewMode}
                        >
                          {INVOICE_TAX_TYPE_OPTIONS.map(({ value: v, label: lab }) => (
                            <option key={v} value={v}>
                              {lab}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="invoice-entry-input invoice-entry-input-calculated"
                          value={lineCalc.taxAmount.toFixed(2)}
                          readOnly
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="invoice-entry-input"
                          value={line.freight ?? ''}
                          onChange={(e) => updateMaterialLine(line.id, { freight: e.target.value })}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          disabled={isViewMode}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="invoice-entry-input invoice-entry-input-calculated"
                          value={lineCalc.total.toFixed(2)}
                          readOnly
                        />
                      </td>
                      <td>
                        {(formData.materialLines || []).length > 1 && !isViewMode && (
                          <button
                            type="button"
                            className="invoice-entry-material-line-remove"
                            onClick={() => removeMaterialLine(line.id)}
                            aria-label={`Remove line ${lineIndex + 1}`}
                          >
                            <Trash2 size={16} aria-hidden />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========== VALUE CALCULATIONS SECTION ========== */}
        <div className="invoice-entry-section">
          <h2 className="invoice-entry-section-title">
            Tax & Value Calculations
            <Calculator className="invoice-entry-section-icon" />
          </h2>
          <div className="invoice-entry-form-grid">
            {renderField('basicRate', 'Basic Rate', FIELD_TYPES.MANUAL, [], '0.00')}
            {renderField('basicValue', 'Basic Value (Basic Rate × Qty)', FIELD_TYPES.CALCULATED)}
            {renderField('freightInvoiceNo', 'Freight Invoice No', FIELD_TYPES.MANUAL)}
            {renderField('freightRate', 'Freight Rate', FIELD_TYPES.MANUAL, [], '0.00')}
            {renderField('freightValue', 'Freight Value (Freight Rate × Qty)', FIELD_TYPES.CALCULATED)}
            {renderField('taxType', 'Tax Type', FIELD_TYPES.DROPDOWN, INVOICE_TAX_TYPE_OPTIONS)}
            {coerceInvoiceTaxType(formData.taxType) === 'SGST & CGST' &&
              renderField('sgstRate', 'SGST Rate (%)', FIELD_TYPES.MANUAL, [], '0.00')}
            {coerceInvoiceTaxType(formData.taxType) === 'SGST & CGST' &&
              renderField('cgstRate', 'CGST Rate (%)', FIELD_TYPES.MANUAL, [], '0.00')}
            {coerceInvoiceTaxType(formData.taxType) === 'IGST' &&
              renderField('igstRate', 'IGST Rate (%)', FIELD_TYPES.MANUAL, [], '0.00')}
            {coerceInvoiceTaxType(formData.taxType) === 'UGST' && (
              <>
                {renderField('ugstRate', 'UGST Rate (%)', FIELD_TYPES.MANUAL, [], '0.00')}
                <p className="invoice-entry-hint" style={{ gridColumn: '1 / -1', margin: '-6px 0 0 0' }}>
                  Tax amount uses 50% of this rate on taxable value (e.g. 18% entered → 9% applied).
                </p>
              </>
            )}
            {coerceInvoiceTaxType(formData.taxType) === 'SGST & CGST' &&
              renderField('sgstOutput', 'SGST Output', FIELD_TYPES.CALCULATED)}
            {coerceInvoiceTaxType(formData.taxType) === 'SGST & CGST' &&
              renderField('cgstOutput', 'CGST Output', FIELD_TYPES.CALCULATED)}
            {coerceInvoiceTaxType(formData.taxType) === 'IGST' &&
              renderField('igstOutput', 'IGST Output', FIELD_TYPES.CALCULATED)}
            {coerceInvoiceTaxType(formData.taxType) === 'UGST' &&
              renderField('ugstOutput', 'UGST Output', FIELD_TYPES.CALCULATED)}
            {renderField('totalGST', 'Total GST', FIELD_TYPES.CALCULATED)}
            {renderField('tcs', 'TCS', FIELD_TYPES.MANUAL, [], '0.00')}
            {renderField('subtotal', 'SubTotal', FIELD_TYPES.CALCULATED)}
            {renderField('totalInvoiceValue', 'Total Invoice Value', FIELD_TYPES.CALCULATED)}
          </div>
        </div>

        {/* ========== CONSIGNEE & PAYER DETAILS SECTION ========== */}
        <div className="invoice-entry-section">
          <h2 className="invoice-entry-section-title">Consignee & Payer Details</h2>
          <div className="invoice-entry-form-grid">
            {/* Consignee Selection Dropdown */}
            <div className="invoice-entry-field">
              <label htmlFor="consigneeId" className="invoice-entry-label">
                Select Consignee (Optional)
              </label>
              <select
                id="consigneeId"
                name="consigneeId"
                value={formData.consigneeId}
                onChange={handleConsigneeChange}
                className="invoice-entry-select"
                disabled={isViewMode}
              >
                <option value="">Select from Master Data or enter manually</option>
                {consignees.map((consignee) => {
                  const name = consignee.values?.consigneeName || consignee.name || 'Unnamed Consignee'
                  const city = consignee.values?.city || ''
                  return (
                    <option key={consignee.id} value={consignee.id}>
                      {name} {city ? `(${city})` : ''}
                    </option>
                  )
                })}
              </select>
              {consignees.length === 0 && (
                <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                  No consignees found. <a href="/master-data/new/consignee-profile" style={{ color: 'var(--color-primary)' }}>Create one in Master Data</a>
                </p>
              )}
            </div>
            
            {/* Consignee Name & Address - Manual Entry */}
            <div className="invoice-entry-field invoice-entry-field-full">
              <label htmlFor="consigneeNameAddress" className="invoice-entry-label">
                Consignee Name & Address
              </label>
              <textarea
                id="consigneeNameAddress"
                name="consigneeNameAddress"
                value={formData.consigneeNameAddress || ''}
                onChange={handleChange}
                className="invoice-entry-textarea"
                rows="3"
                placeholder="Enter consignee name and address manually or select from dropdown above"
                readOnly={isViewMode}
                disabled={isViewMode}
              />
            </div>
            
            {/* Consignee City - Manual Entry */}
            <div className="invoice-entry-field">
              <label htmlFor="consigneeCity" className="invoice-entry-label">
                Consignee City
              </label>
              <input
                type="text"
                id="consigneeCity"
                name="consigneeCity"
                value={formData.consigneeCity || ''}
                onChange={handleChange}
                className="invoice-entry-input"
                placeholder="Enter city"
                readOnly={isViewMode}
                disabled={isViewMode}
              />
            </div>
            
            {/* Payer Selection Dropdown */}
            <div className="invoice-entry-field">
              <label htmlFor="payerId" className="invoice-entry-label">
                Select Payer (Optional)
              </label>
              <select
                id="payerId"
                name="payerId"
                value={formData.payerId}
                onChange={handlePayerChange}
                className="invoice-entry-select"
                disabled={isViewMode}
              >
                <option value="">Select from Master Data or enter manually</option>
                {payers.map((payer) => {
                  const name = payer.values?.payerName || payer.name || 'Unnamed Payer'
                  const city = payer.values?.city || ''
                  return (
                    <option key={payer.id} value={payer.id}>
                      {name} {city ? `(${city})` : ''}
                    </option>
                  )
                })}
              </select>
              {payers.length === 0 && (
                <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                  No payers found. <a href="/master-data/new/payer-profile" style={{ color: 'var(--color-primary)' }}>Create one in Master Data</a>
                </p>
              )}
            </div>
            
            {/* Payer Name & Address - Manual Entry */}
            <div className="invoice-entry-field invoice-entry-field-full">
              <label htmlFor="payerNameAddress" className="invoice-entry-label">
                Payer Name & Address
              </label>
              <textarea
                id="payerNameAddress"
                name="payerNameAddress"
                value={formData.payerNameAddress || ''}
                onChange={handleChange}
                className="invoice-entry-textarea"
                rows="3"
                placeholder="Enter payer name and address manually or select from dropdown above"
                readOnly={isViewMode}
                disabled={isViewMode}
              />
            </div>
            
            {/* Payer City - Manual Entry */}
            <div className="invoice-entry-field">
              <label htmlFor="payerCity" className="invoice-entry-label">
                City
              </label>
              <input
                type="text"
                id="payerCity"
                name="payerCity"
                value={formData.payerCity || ''}
                onChange={handleChange}
                className="invoice-entry-input"
                placeholder="Enter city"
                readOnly={isViewMode}
                disabled={isViewMode}
              />
            </div>
          </div>
        </div>

        {/* ========== LOGISTICS & TRANSPORT SECTION ========== */}
        <div className="invoice-entry-section">
          <h2 className="invoice-entry-section-title">Logistics & Transport</h2>
          <div className="invoice-entry-form-grid">
            {renderField('lorryReceiptNo', 'Lorry Receipt No', FIELD_TYPES.MANUAL)}
            {renderField('lorryReceiptDate', 'Lorry Receipt Date', FIELD_TYPES.MANUAL)}
            <div className="invoice-entry-field">
              <label htmlFor="transporterId" className="invoice-entry-label">
                Transporter Name
              </label>
              <select
                id="transporterId"
                name="transporterId"
                value={formData.transporterId}
                onChange={handleTransporterChange}
                className="invoice-entry-select"
                disabled={isViewMode}
              >
                <option value="">Select Transporter from Master Data</option>
                {employees
                  .filter((emp) => {
                    const role = (emp.values?.role || emp.role || '').toLowerCase()
                    return role.includes('transporter')
                  })
                  .map((emp) => {
                    const name = emp.values?.nameOfEmployee || emp.values?.transporterName || emp.name || 'Unnamed Transporter'
                    return (
                      <option key={emp.id} value={emp.id}>
                        {name}
                      </option>
                    )
                  })}
              </select>
              <input
                type="text"
                id="transporterName"
                name="transporterName"
                value={formData.transporterName}
                onChange={handleChange}
                className="invoice-entry-input"
                placeholder="Or enter transporter name manually"
                style={{ marginTop: '8px' }}
                readOnly={isViewMode}
                disabled={isViewMode}
              />
              {employees.filter((emp) => {
                const role = (emp.values?.role || emp.role || '').toLowerCase()
                return role.includes('transporter')
              }).length === 0 && (
                <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                  No transporters found. <a href="/master-data/new/employee-profile" style={{ color: 'var(--color-primary)' }}>Create one in Master Data</a>
                </p>
              )}
            </div>
            {renderField('deliveryChallanNo', 'Delivery Challan No', FIELD_TYPES.MANUAL)}
            {renderField('deliveryChallanDate', 'Delivery Challan Date', FIELD_TYPES.MANUAL)}
          </div>
        </div>

        {/* ========== MATERIAL INSPECTION DATES SECTION ========== */}
        <div className="invoice-entry-section">
          <h2 className="invoice-entry-section-title">Material Inspection Dates</h2>
          <div className="invoice-entry-form-grid">
            {renderField('materialInspectionRequestDate', 'Material Inspection Request Date', FIELD_TYPES.MANUAL)}
            {renderField('inspectionOfferDate', 'Inspection Offer Date', FIELD_TYPES.MANUAL)}
            {renderField('materialInspectionDate', 'Material Inspection Date', FIELD_TYPES.MANUAL)}
            {renderField('deliveryInstructionDate', 'Delivery Instruction Date', FIELD_TYPES.MANUAL)}
            {renderField('deliveryInspectionCIPReceivedDate', 'Delivery Inspection / CIP Received Date', FIELD_TYPES.MANUAL)}
            {renderField('miccReceiptDate', 'MICC Receipt Date', FIELD_TYPES.MANUAL)}
            {renderField('lastDateOfDispatch', 'Last Date of Dispatch', FIELD_TYPES.MANUAL)}
            {renderField('invoiceReadyDate', 'Invoice Ready Date', FIELD_TYPES.MANUAL)}
          </div>
        </div>

        {/* ========== COURIER DETAILS SECTION ========== */}
        <div className="invoice-entry-section">
          <h2 className="invoice-entry-section-title">Courier Details</h2>
          <div className="invoice-entry-form-grid">
            {renderField('courierDocumentNo', 'Courier Document No', FIELD_TYPES.MANUAL)}
            {renderField('courierDocumentDate', 'Courier Document Date', FIELD_TYPES.MANUAL)}
            {renderField('courierCompanyName', 'Courier Company Name', FIELD_TYPES.MANUAL)}
            {renderField('billSentToPersonName', 'Bill Sent to Person Name', FIELD_TYPES.MANUAL)}
            {renderField('billSentDate', 'Bill Sent Date', FIELD_TYPES.MANUAL)}
          </div>
        </div>

        {/* ========== MATERIAL RECEIPT DATES SECTION ========== */}
        <div className="invoice-entry-section">
          <h2 className="invoice-entry-section-title">Material Receipt Dates</h2>
          <div className="invoice-entry-form-grid">
            {renderField('lastDateOfMaterialReceipt', 'Last Date of Material Receipt', FIELD_TYPES.MANUAL)}
            {renderField('invoiceReceiptDate', 'Invoice Receipt Date', FIELD_TYPES.MANUAL)}
            <div className="invoice-entry-field">
              <label htmlFor="invoiceReceiptPersonId" className="invoice-entry-label">
                Invoice Receipt Person Name
              </label>
              <select
                id="invoiceReceiptPersonId"
                name="invoiceReceiptPersonId"
                value={formData.invoiceReceiptPersonId}
                onChange={handleInvoiceReceiptPersonChange}
                className="invoice-entry-select"
                disabled={isViewMode}
              >
                <option value="">Select Person from Master Data</option>
                {employees.map((emp) => {
                  const name = emp.values?.nameOfEmployee || emp.name || 'Unnamed Employee'
                  const designation = emp.values?.designation || ''
                  return (
                    <option key={emp.id} value={emp.id}>
                      {name} {designation ? `(${designation})` : ''}
                    </option>
                  )
                })}
              </select>
              <input
                type="text"
                id="invoiceReceiptPersonName"
                name="invoiceReceiptPersonName"
                value={formData.invoiceReceiptPersonName}
                onChange={handleChange}
                className="invoice-entry-input"
                placeholder="Or enter person name manually"
                style={{ marginTop: '8px' }}
                readOnly={isViewMode}
                disabled={isViewMode}
              />
              {employees.length === 0 && (
                <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                  No employees found. <a href="/master-data/new/employee-profile" style={{ color: 'var(--color-primary)' }}>Create one in Master Data</a>
                </p>
              )}
            </div>
            {renderField('materialVerificationDate', 'Material Verification Date', FIELD_TYPES.MANUAL)}
          </div>
        </div>

        {/* ========== PROCESSING DATES SECTION ========== */}
        <div className="invoice-entry-section">
          <h2 className="invoice-entry-section-title">Processing Dates</h2>
          <div className="invoice-entry-form-grid">
            {renderField('jvrDate', 'JVR Date', FIELD_TYPES.MANUAL)}
            {renderField('srnDate', 'SRN Date', FIELD_TYPES.MANUAL)}
            {renderField('mrcDate', 'MRC Date', FIELD_TYPES.MANUAL)}
            {renderField('invoiceSubmissionAtSiteDate', 'Invoice Submission at Site Date', FIELD_TYPES.MANUAL)}
            {renderField('invoiceForwardedToHODate', 'Invoice Forwarded to HO Date', FIELD_TYPES.MANUAL)}
            {renderField('invoiceForwardedForPaymentDate', 'Invoice Forwarded for Payment Date', FIELD_TYPES.MANUAL)}
          </div>
        </div>

        {/* ========== 1ST DUE PAYMENT TRACKING SECTION ========== */}
        <div className="invoice-entry-section">
          <h2 className="invoice-entry-section-title">1st Due Payment Tracking</h2>
          <div className="invoice-entry-form-grid">
            {renderField('firstDueDate', '1st Due Date', FIELD_TYPES.CALCULATED)}
            {renderField('firstDueAmount', '1st Due Amount', FIELD_TYPES.CALCULATED)}
            {renderField('paymentReceivedAmount1stDue', 'Payment Received Amount (1st Due)', FIELD_TYPES.MANUAL)}
            {renderField('receiptDate1stDue', 'Receipt Date (1st Due)', FIELD_TYPES.MANUAL)}
            {renderField('firstDueBalance', '1st Due Balance', FIELD_TYPES.CALCULATED)}
            {renderField('notDue1stDue', 'Not Due (1st Due)', FIELD_TYPES.CALCULATED)}
            {renderField('overDue1stDue', 'Over Due (1st Due)', FIELD_TYPES.CALCULATED)}
            {renderField('noOfDaysOfPaymentReceipt1stDue', 'No. of Days of Payment Receipt (1st Due)', FIELD_TYPES.CALCULATED)}
          </div>
        </div>

        {/* ========== 2ND DUE PAYMENT TRACKING SECTION ========== */}
        <div className="invoice-entry-section">
          <h2 className="invoice-entry-section-title">2nd Due Payment Tracking</h2>
          <div className="invoice-entry-form-grid">
            {renderField('secondDueDate', '2nd Due Date', FIELD_TYPES.CALCULATED)}
            {renderField('secondDueAmount', '2nd Due Amount', FIELD_TYPES.CALCULATED)}
            {renderField('paymentReceivedAmount2ndDue', 'Payment Received Amount (2nd Due)', FIELD_TYPES.MANUAL)}
            {renderField('receiptDate2ndDue', 'Receipt Date (2nd Due)', FIELD_TYPES.MANUAL)}
            {renderField('secondDueBalance', '2nd Due Balance', FIELD_TYPES.CALCULATED)}
            {renderField('notDue2ndDue', 'Not Due (2nd Due)', FIELD_TYPES.CALCULATED)}
            {renderField('overDue2ndDue', 'Over Due (2nd Due)', FIELD_TYPES.CALCULATED)}
            {renderField('noOfDaysOfPaymentReceipt2ndDue', 'No. of Days of Payment Receipt (2nd Due)', FIELD_TYPES.CALCULATED)}
          </div>
        </div>

        {/* ========== 3RD DUE PAYMENT TRACKING SECTION ========== */}
        <div className="invoice-entry-section">
          <h2 className="invoice-entry-section-title">3rd Due Payment Tracking</h2>
          <div className="invoice-entry-form-grid">
            {renderField('thirdDueDate', '3rd Due Date', FIELD_TYPES.CALCULATED)}
            {renderField('thirdDueAmount', '3rd Due Amount', FIELD_TYPES.CALCULATED)}
            {renderField('paymentReceivedAmount3rdDue', 'Payment Received Amount (3rd Due)', FIELD_TYPES.MANUAL)}
            {renderField('receiptDate3rdDue', 'Receipt Date (3rd Due)', FIELD_TYPES.MANUAL)}
            {renderField('thirdDueBalance', '3rd Due Balance', FIELD_TYPES.CALCULATED)}
            {renderField('notDue3rdDue', 'Not Due (3rd Due)', FIELD_TYPES.CALCULATED)}
            {renderField('overDue3rdDue', 'Over Due (3rd Due)', FIELD_TYPES.CALCULATED)}
            {renderField('noOfDaysOfPaymentReceipt3rdDue', 'No. of Days of Payment Receipt (3rd Due)', FIELD_TYPES.CALCULATED)}
          </div>
        </div>

        {/* ========== CONSOLIDATED TOTALS SECTION ========== */}
        <div className="invoice-entry-section">
          <h2 className="invoice-entry-section-title">Consolidated Totals</h2>
          <div className="invoice-entry-form-grid">
            {renderField('totalBalance', 'Total Balance', FIELD_TYPES.CALCULATED)}
            {renderField('notDueTotal', 'Not Due Total', FIELD_TYPES.CALCULATED)}
            {renderField('overDueTotal', 'Over Due Total', FIELD_TYPES.CALCULATED)}
          </div>
        </div>

        {/* ========== TDS FIELDS SECTION ========== */}
        <div className="invoice-entry-section">
          <h2 className="invoice-entry-section-title">TDS Fields (From Payment Advice)</h2>
          <div className="invoice-entry-form-grid">
            {renderField('itTDS2Percent', 'IT TDS @2%', FIELD_TYPES.MANUAL)}
            {renderField('itTDS1Percent194Q', 'IT TDS @1% (194Q)', FIELD_TYPES.MANUAL)}
            {renderField('lcessBoq1Percent', 'LCess / BOQ @1%', FIELD_TYPES.MANUAL)}
            {renderField('tds2PercentCGSTSGST', 'TDS @2% (CGST/SGST)', FIELD_TYPES.MANUAL)}
            {renderField('tdsOnCGST1Percent', 'TDS on CGST @1%', FIELD_TYPES.MANUAL)}
            {renderField('tdsOnSGST1Percent', 'TDS on SGST @1%', FIELD_TYPES.MANUAL)}
          </div>
        </div>

        {/* ========== DEDUCTIONS & ADJUSTMENTS SECTION ========== */}
        <div className="invoice-entry-section">
          <h2 className="invoice-entry-section-title">Deductions & Adjustments (From Payment Advice)</h2>
          <div className="invoice-entry-form-grid">
            {renderField('excessSupplyQty', 'Excess Supply Qty', FIELD_TYPES.MANUAL)}
            {renderField('interestOnAdvance', 'Interest on Advance', FIELD_TYPES.MANUAL)}
            {renderField('anyHold', 'Any Hold', FIELD_TYPES.MANUAL)}
            {renderField('penaltyLDDeduction', 'Penalty / LD Deduction', FIELD_TYPES.MANUAL)}
            {renderField('bankCharges', 'Bank Charges', FIELD_TYPES.MANUAL)}
            {renderField('lcDiscrepancyCharge', 'LC Discrepancy Charge', FIELD_TYPES.MANUAL)}
            {renderField('provisionForBadDebts', 'Provision for Bad Debts', FIELD_TYPES.MANUAL, [], '0.00')}
            {renderField('badDebts', 'Bad Debts', FIELD_TYPES.MANUAL, [], '0.00')}
          </div>
        </div>

        {/* Form Actions */}
        <div className="invoice-entry-actions">
          <button
            type="button"
            onClick={() => navigate('/invoices')}
            className="invoice-entry-button invoice-entry-button-secondary"
          >
            {isViewMode ? 'Close' : 'Cancel'}
          </button>
          {!isViewMode && (
            <>
              <button
                type="button"
                onClick={handleReset}
                className="invoice-entry-button invoice-entry-button-secondary"
              >
                Reset
              </button>
              <button
                type="submit"
                className="invoice-entry-button invoice-entry-button-primary"
              >
                {id ? 'Update Invoice' : 'Submit Invoice'}
              </button>
            </>
          )}
        </div>
      </form>

      {showFieldSelector && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: 16 }} onClick={() => setShowFieldSelector(false)}>
          <div style={{ width: '100%', maxWidth: 760, maxHeight: '80vh', overflow: 'hidden', background: '#fff', border: '1px solid #d6dde7', borderRadius: 12, display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Field Selection</h3>
              <button type="button" onClick={() => setShowFieldSelector(false)} className="invoice-entry-action-button invoice-entry-action-button-secondary" aria-label="Close field selection">
                Close
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
                            onChange={(e) => {
                              const show = e.target.checked
                              setHiddenFieldKeys((prev) =>
                                show ? prev.filter((k) => k !== field.key) : prev.includes(field.key) ? prev : [...prev, field.key]
                              )
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
              <button type="button" className="invoice-entry-action-button invoice-entry-action-button-secondary" onClick={() => setHiddenFieldKeys([])}>
                Reset
              </button>
              <button type="button" className="invoice-entry-action-button invoice-entry-action-button-secondary" onClick={() => setShowFieldSelector(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InvoiceEntry
