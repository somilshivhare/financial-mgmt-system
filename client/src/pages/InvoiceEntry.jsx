import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Calculator, RotateCcw } from 'lucide-react'
import DatePicker from '../components/DatePicker'
import { useMasterData } from '../contexts/MasterDataContext'
import { useToast } from '../contexts/ToastContext'
import { usePersistedFormState } from '../hooks/usePersistedFormState'
import * as poEntryService from '../services/poEntryService'
import * as invoiceService from '../services/invoiceService'
import * as paymentApi from '../api/payment'
import { getInvoiceById, updateInvoice } from '../api/invoice'
import { INDIA_STATES } from '../utils/indiaStates'
import '../styles/InvoiceEntry.css'

// Field type constants
const FIELD_TYPES = {
  MANUAL: 'manual',
  DROPDOWN: 'dropdown',
  DEFAULT: 'default', // Auto-filled, read-only
  CALCULATED: 'calculated', // System calculated, non-editable
}

// Invoice Type options
const INVOICE_TYPES = ['REG', 'EXP', 'TAX', 'PRO', 'Other']
const BUSINESS_UNITS = ['MAIN', 'UNIT1', 'UNIT2', 'UNIT3', 'Other']
const SEGMENTS = ['Domestic', 'Export']
const ZONES = ['North', 'East', 'West', 'South']
const REGIONS = ['North', 'East', 'West', 'South', 'Central']
const MATERIAL_DESCRIPTION_TYPES = ['Goods', 'Services', 'Both', 'Other']
const UNITS = ['Nos', 'MT', 'KG', 'LTR', 'MTR', 'SQM', 'CUM', 'Other']

const INITIAL_INVOICE_FORM_DATA = {
  keyID: '',
  poId: '', // PO UUID from selected Key ID; sent on submit so backend can validate from single source
  gstTaxInvoiceNo: '',
  gstTaxInvoiceDate: '',
  internalInvoiceNo: '',
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
  stateOfSupply: '',
  qty: '',
  unit: '',
  currency: 'INR',
  basicRate: '',
  basicValue: '',
  freightInvoiceNo: '',
  freightRate: '',
  freightValue: '',
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
  const { getCustomers, getPaymentTerms, getConsignees, getPayers, getEmployees } = useMasterData()
  const { showToast } = useToast()
  
  const [poEntries, setPOEntries] = useState([])
  const [poNumbersLoading, setPONumbersLoading] = useState(true)
  const [customers, setCustomers] = useState([])
  const [paymentTerms, setPaymentTerms] = useState([])
  const [consignees, setConsignees] = useState([])
  const [payers, setPayers] = useState([])
  const [employees, setEmployees] = useState([])
  const [paymentData, setPaymentData] = useState(null) // Payment Advice data
  
  const { values, setValues: setFormData, clearLocalDraft, persistNow, reset: resetForm } = usePersistedFormState({
    pathKey: 'invoice-entry',
    defaultValues: INITIAL_INVOICE_FORM_DATA,
    entityId: id || null,
  })
  const formData = values && typeof values === 'object' && !Array.isArray(values)
    ? values
    : INITIAL_INVOICE_FORM_DATA

  // Load master data and PO entries
  useEffect(() => {
    setCustomers(getCustomers())
    setPaymentTerms(getPaymentTerms())
    setConsignees(getConsignees())
    setPayers(getPayers())
    setEmployees(getEmployees())
    
    // Load PO numbers for Key ID dropdown
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
  }, [getCustomers, getPaymentTerms, getConsignees, getPayers, getEmployees])
  
  // Load payment data from Payment Advice (payments linked to invoice for this PO)
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
  
  // Load existing invoice data when editing (ID present)
  useEffect(() => {
    if (id) {
      const loadInvoice = async () => {
        try {
          const response = await getInvoiceById(id)
          const invoiceData = response?.data || response
          if (invoiceData) {
            const invoice = invoiceData.data || invoiceData
            
            // Transform invoice data to form format
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
              stateOfSupply: invoice.state_of_supply || invoice.stateOfSupply || '',
              qty: invoice.qty || invoice.quantity || '',
              unit: invoice.unit || '',
              currency: invoice.currency || 'INR',
              basicRate: invoice.basic_rate || invoice.basicRate || '',
              basicValue: invoice.basic_value || invoice.basicValue || '',
              freightInvoiceNo: invoice.freight_invoice_no || invoice.freightInvoiceNo || '',
              freightRate: invoice.freight_rate || invoice.freightRate || '',
              freightValue: invoice.freight_value || invoice.freightValue || '',
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
            
            // Load payment data for this invoice
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
  }, [id, getCustomers, getPaymentTerms, getConsignees, getPayers, getEmployees])
  
  // Auto-generate Internal Invoice No (real number from backend or fallback – never leave XXXX)
  useEffect(() => {
    const type = formData.invoiceType || 'REG'
    const bu = formData.businessUnit || 'MAIN'
    const current = (formData.internalInvoiceNo || '').trim()
    const hasPlaceholder = /XXXX/i.test(current)
    if ((!current || hasPlaceholder) && type && bu) {
      let cancelled = false
      invoiceService.fetchNextInvoiceNumber(type, bu).then((nextNumber) => {
        if (!cancelled && nextNumber) setFormData((prev) => ({ ...prev, internalInvoiceNo: nextNumber }))
      })
      return () => { cancelled = true }
    }
  }, [formData.invoiceType, formData.businessUnit, formData.internalInvoiceNo])
  
  // Format date to YYYY-MM-DD for inputs (from ISO string or Date)
  const formatDateForInput = (val) => {
    if (val === undefined || val === null) return ''
    const str = typeof val === 'string' ? val.trim() : String(val)
    if (str && /^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10)
    const d = new Date(val)
    return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10)
  }

  // Normalize BOQ unit to invoice dropdown value (e.g. "Metric Ton" -> "MT")
  const normalizeUnit = (u) => {
    if (!u || typeof u !== 'string') return ''
    const s = String(u).trim().toUpperCase()
    const map = { 'METRIC TON': 'MT', 'M.T.': 'MT', 'MTON': 'MT', 'NUMBERS': 'Nos', 'NO.': 'Nos', 'NOS': 'Nos', 'LITRE': 'LTR', 'LITRES': 'LTR', 'METER': 'MTR', 'METRE': 'MTR', 'SQ M': 'SQM', 'SQ.M': 'SQM', 'CUBIC M': 'CUM' }
    return map[s] || (UNITS.includes(s) ? s : (UNITS.includes(u) ? u : u))
  }

  // Handle PO Number (Key ID) selection - Auto-populate all linked fields from PO + Master Data
  const handleKeyIDChange = async (e) => {
    const poNumber = e.target.value
    if (!poNumber) {
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
        paymentTextId: '',
        paymentText: '',
        materialDescriptionType: '',
        qty: '',
        unit: '',
        basicRate: '',
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
      }

      const customer = customers.find((c) => c.id === poEntry.customerId)
      const terms = paymentTerms.find((t) => t.id === poEntry.paymentTermsId)
      const accountManager = employees.find((e) => e.id === poEntry.accountManagerId)
      const customerName = customer?.name ?? customer?.values?.customerName ?? customer?.customerName ?? poEntry.customerName ?? ''
      const accountManagerName = accountManager?.values?.nameOfEmployee ?? accountManager?.name ?? ''
      const paymentTermsDesc = terms?.values?.paymentTermsDescription ?? terms?.values?.termName ?? poEntry.poPaymentTerms ?? ''
      // Fallback segment/region/zone from customer Master Data when not on PO
      const segment = poEntry.segment || customer?.segment || customer?.values?.segment || customer?.fullRecord?.values?.segment || ''
      const region = poEntry.region || customer?.values?.region || customer?.fullRecord?.values?.region || ''
      const zone = poEntry.zone || customer?.values?.zone || customer?.fullRecord?.values?.zone || ''

      const firstBoq = Array.isArray(raw.boqItems) && raw.boqItems.length > 0 ? raw.boqItems[0] : null
      const materialDescRaw = firstBoq?.materialDescription ?? firstBoq?.description ?? ''
      const materialDesc = MATERIAL_DESCRIPTION_TYPES.includes(materialDescRaw) ? materialDescRaw : (materialDescRaw && MATERIAL_DESCRIPTION_TYPES.includes(materialDescRaw.trim()) ? materialDescRaw.trim() : '')
      const boqQty = firstBoq?.quantity ?? firstBoq?.qty ?? ''
      const boqUnitRaw = firstBoq?.uom ?? firstBoq?.unit ?? ''
      const boqUnit = normalizeUnit(boqUnitRaw) || (UNITS.includes(boqUnitRaw) ? boqUnitRaw : boqUnitRaw)
      const boqRate = firstBoq?.unitPrice ?? firstBoq?.basicRate ?? ''
      const poDateValue = poEntry.poDate || formatDateForInput(raw.issue_date) || formatDateForInput(raw.poDate) || ''

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
        stateOfSupply: poEntry.customerState || poEntry.poDeliveryState || '',
        currency: poEntry.poCurrency || 'INR',
        paymentTermsId: poEntry.paymentTermsId || '',
        paymentTerms: paymentTermsDesc,
        paymentTextId: poEntry.paymentTermsId || '',
        paymentText: paymentTermsDesc,
        materialDescriptionType: materialDesc || formData.materialDescriptionType,
        qty: boqQty !== '' ? String(boqQty) : formData.qty,
        unit: (boqUnit && (UNITS.includes(boqUnit) || boqUnit === 'Other')) ? boqUnit : (formData.unit || boqUnit || ''),
        basicRate: boqRate !== '' ? String(boqRate) : formData.basicRate,
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
  
  // Calculate all values when inputs change
  const calculatedValues = useMemo(() => {
    return invoiceService.calculateInvoiceValues(formData)
  }, [
    formData.basicRate,
    formData.qty,
    formData.freightRate,
    formData.sgstRate,
    formData.cgstRate,
    formData.igstRate,
    formData.ugstRate,
  ])
  
  // Calculate due dates and amounts
  const dueCalculations = useMemo(() => {
    return invoiceService.calculateDueDates(
      formData.gstTaxInvoiceDate || new Date().toISOString().split('T')[0],
      formData.paymentTerms,
      calculatedValues.totalInvoiceValue
    )
  }, [formData.gstTaxInvoiceDate, formData.paymentTerms, calculatedValues.totalInvoiceValue])
  
  // Calculate balances and status for each due stage
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
  
  // Compute due stage calculations
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
  
  // Merge all computed values for display
  const displayData = {
    ...formData,
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
    // Key ID change must fetch PO and auto-fill Customer & PO details
    if (name === 'keyID') {
      handleKeyIDChange(e)
      return
    }
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle Consignee selection from dropdown
  const handleConsigneeChange = (e) => {
    const consigneeId = e.target.value
    if (!consigneeId) {
      setFormData((prev) => ({
        ...prev,
        consigneeId: '',
        // Don't clear name/address and city - allow manual entry to persist
      }))
      return
    }
    
    const consignee = consignees.find((c) => c.id === consigneeId)
    if (consignee) {
      // Build address from consignee data
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

  // Handle Payer selection from dropdown
  const handlePayerChange = (e) => {
    const payerId = e.target.value
    if (!payerId) {
      setFormData((prev) => ({
        ...prev,
        payerId: '',
        // Don't clear name/address and city - allow manual entry to persist
      }))
      return
    }
    
    const payer = payers.find((p) => p.id === payerId)
    if (payer) {
      // Build address from payer data
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

  // Handle Transporter selection from dropdown
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

  // Handle Invoice Receipt Person selection from dropdown
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

  // Handle Payment Terms selection from dropdown
  const handlePaymentTermsChange = (e) => {
    const paymentTermsId = e.target.value
    if (!paymentTermsId) {
      setFormData((prev) => ({
        ...prev,
        paymentTermsId: '',
        paymentTerms: '',
      }))
      return
    }
    
    const terms = paymentTerms.find((t) => t.id === paymentTermsId)
    if (terms) {
      // Build payment terms description from the payment terms data
      const description = terms.values?.paymentTermsDescription || ''
      setFormData((prev) => ({
        ...prev,
        paymentTermsId,
        paymentTerms: description,
      }))
    }
  }

  // Handle Payment Text selection from dropdown
  const handlePaymentTextChange = (e) => {
    const paymentTextId = e.target.value
    if (!paymentTextId) {
      setFormData((prev) => ({
        ...prev,
        paymentTextId: '',
        paymentText: '',
      }))
      return
    }
    
    const terms = paymentTerms.find((t) => t.id === paymentTextId)
    if (terms) {
      const description = terms.values?.paymentTermsDescription || ''
      setFormData((prev) => ({
        ...prev,
        paymentTextId,
        paymentText: description,
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate required fields
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
    
    // Save invoice with all computed values. Send poId when available so backend validates from single source.
    try {
      const invoiceData = {
        ...formData,
        ...displayData,
        key_id: formData.keyID, // Store Key ID for reporting
        poId: formData.poId || undefined, // Preferred: backend uses this for PO lookup when present
        invoice_number: formData.internalInvoiceNo,
        issue_date: formData.gstTaxInvoiceDate,
      }
      
      let savedInvoice
      if (id) {
        // Update existing invoice
        const response = await updateInvoice(id, invoiceData)
        savedInvoice = response?.data || response
        // Ensure the rest of the app (Dashboard/Reports/Indexes) refreshes on edit as well
        try {
          window.dispatchEvent(new CustomEvent('invoiceUpdated', { detail: { invoice: savedInvoice } }))
        } catch (e) {
          console.warn('[InvoiceEntry] Failed to dispatch invoiceUpdated event:', e)
        }
      } else {
        // Create new invoice
        savedInvoice = await invoiceService.saveInvoice(invoiceData)
      }
      
      // Re-fetch the saved invoice to ensure UI is synced with backend
      if (savedInvoice?.id || id) {
        try {
          const refreshedInvoice = await getInvoiceById(savedInvoice?.id || id)
          const invoiceData = refreshedInvoice?.data || refreshedInvoice
          if (invoiceData) {
            const invoice = invoiceData.data || invoiceData
            // Update form with refreshed data
            setFormData(prev => ({
              ...prev,
              gstTaxInvoiceNo: invoice.gst_tax_invoice_no || invoice.gstTaxInvoiceNo || prev.gstTaxInvoiceNo,
              gstTaxInvoiceDate: invoice.gst_tax_invoice_date || invoice.gstTaxInvoiceDate || prev.gstTaxInvoiceDate,
              internalInvoiceNo: invoice.internal_invoice_no || invoice.internalInvoiceNo || invoice.invoice_number || prev.internalInvoiceNo,
              totalInvoiceValue: invoice.total_invoice_value || invoice.totalInvoiceValue || invoice.total_amount || prev.totalInvoiceValue,
            }))
          }
        } catch (refreshError) {
          console.warn('[InvoiceEntry] Failed to refresh invoice after save:', refreshError)
          // Continue anyway - save was successful
        }
      }
      
      showToast(`Invoice ${savedInvoice?.invoice_number || savedInvoice?.internalInvoiceNo || formData.internalInvoiceNo || ''} saved successfully!`, 'success')
      if (typeof clearLocalDraft === 'function') clearLocalDraft()
      navigate('/invoices', { state: { fromCreate: true }, replace: false })
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
  
  // Render field based on type
  const renderField = (fieldName, label, type = FIELD_TYPES.MANUAL, options = [], placeholder = '', required = false) => {
    const isReadOnly = type === FIELD_TYPES.DEFAULT || type === FIELD_TYPES.CALCULATED || isViewMode
    const isCalculated = type === FIELD_TYPES.CALCULATED
    const value = displayData[fieldName] || formData[fieldName] || ''
    
    if (type === FIELD_TYPES.DROPDOWN) {
      return (
        <div className="invoice-entry-field" key={fieldName}>
          <label htmlFor={fieldName} className="invoice-entry-label">
            {label} {required && <span className="invoice-entry-required">*</span>}
          </label>
          <select
            id={fieldName}
            name={fieldName}
            value={formData[fieldName] || ''}
            onChange={handleChange}
            className="invoice-entry-select"
            required={required}
            disabled={isReadOnly}
          >
            <option value="">Select {label}</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
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
          {formData.internalInvoiceNo && (
            <p className="invoice-entry-subtitle">Internal Invoice No: {formData.internalInvoiceNo}</p>
          )}
        </div>
        
        <div className="invoice-entry-header-actions">
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
        {/* ========== KEY ID & INVOICE IDENTIFICATION SECTION ========== */}
        <div className="invoice-entry-section">
          <h2 className="invoice-entry-section-title">Key ID & Invoice Identification</h2>
          <div className="invoice-entry-form-grid">
            {renderField('keyID', 'Key ID (PO Number)', FIELD_TYPES.DROPDOWN,
              poNumbersLoading ? [] : (poEntries || []).map((po) => po?.poNumber ?? '').filter(Boolean),
              '', true)}
            {renderField('gstTaxInvoiceNo', 'GST Tax Invoice No', FIELD_TYPES.MANUAL, [], '', true)}
            {renderField('gstTaxInvoiceDate', 'GST Tax Invoice Date', FIELD_TYPES.MANUAL, [], '', true)}
            {renderField('internalInvoiceNo', 'Internal Invoice No', FIELD_TYPES.CALCULATED)}
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
          <h2 className="invoice-entry-section-title">Material & Supply Details</h2>
          <div className="invoice-entry-form-grid">
            {renderField('materialDescriptionType', 'Material Description Type', FIELD_TYPES.DROPDOWN, MATERIAL_DESCRIPTION_TYPES)}
            {renderField('stateOfSupply', 'State of Supply', FIELD_TYPES.MANUAL)}
            {renderField('qty', 'Qty', FIELD_TYPES.MANUAL, [], '0.00')}
            {renderField('unit', 'Unit', FIELD_TYPES.DROPDOWN, UNITS)}
            {renderField('currency', 'Currency', FIELD_TYPES.DEFAULT)}
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
            {renderField('sgstRate', 'SGST Rate (%)', FIELD_TYPES.MANUAL, [], '0.00')}
            {renderField('cgstRate', 'CGST Rate (%)', FIELD_TYPES.MANUAL, [], '0.00')}
            {renderField('igstRate', 'IGST Rate (%)', FIELD_TYPES.MANUAL, [], '0.00')}
            {renderField('ugstRate', 'UGST Rate (%)', FIELD_TYPES.MANUAL, [], '0.00')}
            {renderField('sgstOutput', 'SGST Output', FIELD_TYPES.CALCULATED)}
            {renderField('cgstOutput', 'CGST Output', FIELD_TYPES.CALCULATED)}
            {renderField('igstOutput', 'IGST Output', FIELD_TYPES.CALCULATED)}
            {renderField('ugstOutput', 'UGST Output', FIELD_TYPES.CALCULATED)}
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

        {/* ========== PAYMENT TERMS SECTION ========== */}
        <div className="invoice-entry-section">
          <h2 className="invoice-entry-section-title">Payment Terms</h2>
          <div className="invoice-entry-form-grid">
            <div className="invoice-entry-field">
              <label htmlFor="paymentTermsId" className="invoice-entry-label">
                Payment Terms
              </label>
              <select
                id="paymentTermsId"
                name="paymentTermsId"
                value={formData.paymentTermsId}
                onChange={handlePaymentTermsChange}
                className="invoice-entry-select"
                disabled={isViewMode}
              >
                <option value="">Select Payment Terms from Master Data</option>
                {paymentTerms.map((terms) => {
                  const description = terms.values?.paymentTermsDescription || terms.name || 'Unnamed Payment Terms'
                  return (
                    <option key={terms.id} value={terms.id}>
                      {description.substring(0, 100)}{description.length > 100 ? '...' : ''}
                    </option>
                  )
                })}
              </select>
              {paymentTerms.length === 0 && (
                <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                  No payment terms found. <a href="/master-data/new/payment-terms" style={{ color: 'var(--color-primary)' }}>Create one in Master Data</a>
                </p>
              )}
            </div>
            
            <div className="invoice-entry-field invoice-entry-field-full">
              <label htmlFor="paymentTerms" className="invoice-entry-label">
                Payment Terms Description (Auto-filled)
              </label>
              <textarea
                id="paymentTerms"
                name="paymentTerms"
                value={formData.paymentTerms || ''}
                onChange={handleChange}
                className="invoice-entry-textarea"
                rows="3"
                readOnly
                style={{ background: 'var(--color-bg-tertiary)' }}
              />
            </div>
            
            <div className="invoice-entry-field">
              <label htmlFor="paymentTextId" className="invoice-entry-label">
                Payment Text
              </label>
              <select
                id="paymentTextId"
                name="paymentTextId"
                value={formData.paymentTextId}
                onChange={handlePaymentTextChange}
                className="invoice-entry-select"
                disabled={isViewMode}
              >
                <option value="">Select Payment Text from Master Data</option>
                {paymentTerms.map((terms) => {
                  const description = terms.values?.paymentTermsDescription || terms.name || 'Unnamed Payment Terms'
                  return (
                    <option key={terms.id} value={terms.id}>
                      {description.substring(0, 100)}{description.length > 100 ? '...' : ''}
                    </option>
                  )
                })}
              </select>
              {paymentTerms.length === 0 && (
                <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                  No payment terms found. <a href="/master-data/new/payment-terms" style={{ color: 'var(--color-primary)' }}>Create one in Master Data</a>
                </p>
              )}
            </div>
            
            <div className="invoice-entry-field invoice-entry-field-full">
              <label htmlFor="paymentText" className="invoice-entry-label">
                Payment Text Description (Auto-filled)
              </label>
              <textarea
                id="paymentText"
                name="paymentText"
                value={formData.paymentText || ''}
                onChange={handleChange}
                className="invoice-entry-textarea"
                rows="3"
                readOnly
                style={{ background: 'var(--color-bg-tertiary)' }}
              />
            </div>
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
    </div>
  )
}

export default InvoiceEntry
