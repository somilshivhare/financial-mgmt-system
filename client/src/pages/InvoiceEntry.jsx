import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Calculator } from 'lucide-react'
import { useMasterData } from '../contexts/MasterDataContext'
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

function InvoiceEntry() {
  const navigate = useNavigate()
  const { id } = useParams() // Get ID if editing existing invoice
  const { getCustomers, getPaymentTerms, getConsignees, getPayers, getEmployees } = useMasterData()
  
  const [poEntries, setPOEntries] = useState([])
  const [customers, setCustomers] = useState([])
  const [paymentTerms, setPaymentTerms] = useState([])
  const [consignees, setConsignees] = useState([])
  const [payers, setPayers] = useState([])
  const [employees, setEmployees] = useState([])
  const [paymentData, setPaymentData] = useState(null) // Payment Advice data
  
  // Comprehensive form data with ALL fields as per Excel specification
  const [formData, setFormData] = useState({
    // ========== INVOICE IDENTIFICATION ==========
    keyID: '', // PO Number - MANDATORY, Primary Linkage
    gstTaxInvoiceNo: '', // Manual Entry
    gstTaxInvoiceDate: '', // Manual Entry
    internalInvoiceNo: '', // Auto-generated
    invoiceType: 'REG', // Dropdown
    businessUnit: 'MAIN', // Dropdown
    
    // ========== CUSTOMER & PO DETAILS (Auto-filled from PO/Master Data) ==========
    customerName: '', // Default (read-only)
    customerId: '', // Default (read-only)
    segment: '', // Default (read-only)
    region: '', // Default (read-only)
    zone: '', // Default (read-only)
    salesOrderNo: '', // Manual Entry
    accountManagerName: '', // Default (read-only)
    accountManagerId: '', // Default (read-only)
    poNoReference: '', // Default (read-only) - same as keyID
    poDate: '', // Default (read-only)
    
    // ========== MATERIAL & SUPPLY DETAILS ==========
    materialDescriptionType: '', // Dropdown
    stateOfSupply: '', // Default (read-only)
    qty: '', // Manual Entry
    unit: '', // Dropdown
    currency: 'INR', // Default (read-only)
    
    // ========== VALUE CALCULATIONS ==========
    basicRate: '', // Manual Entry
    basicValue: '', // Calculated: Basic Rate × Qty
    freightInvoiceNo: '', // Manual Entry
    freightRate: '', // Manual Entry
    freightValue: '', // Calculated: Freight Rate × Qty
    // GST Rates (Manual Entry)
    sgstRate: '', // Manual Entry
    cgstRate: '', // Manual Entry
    igstRate: '', // Manual Entry
    ugstRate: '', // Manual Entry
    // GST Output Values (Calculated)
    sgstOutput: '', // Calculated
    cgstOutput: '', // Calculated
    igstOutput: '', // Calculated
    ugstOutput: '', // Calculated
    totalGST: '', // Calculated: Sum of all GST
    tcs: '', // Manual Entry
    subtotal: '', // Calculated: Basic Value + Freight Value
    totalInvoiceValue: '', // Calculated: Subtotal + Total GST
    
    // ========== CONSIGNEE & PAYER DETAILS ==========
    consigneeId: '', // Selected from dropdown or manual entry
    consigneeNameAddress: '', // Manual Entry (can be selected from dropdown or typed)
    consigneeCity: '', // Manual Entry
    payerId: '', // Selected from dropdown or manual entry
    payerNameAddress: '', // Manual Entry (can be selected from dropdown or typed)
    payerCity: '', // Manual Entry
    
    // ========== LOGISTICS & TRANSPORT ==========
    lorryReceiptNo: '', // Manual Entry
    lorryReceiptDate: '', // Manual Entry
    transporterName: '', // Dropdown from Employees (role: Transporter)
    transporterId: '', // Selected transporter ID
    deliveryChallanNo: '', // Manual Entry
    deliveryChallanDate: '', // Manual Entry
    
    // ========== MATERIAL INSPECTION DATES ==========
    materialInspectionRequestDate: '', // Manual Entry
    inspectionOfferDate: '', // Manual Entry
    materialInspectionDate: '', // Manual Entry
    deliveryInstructionDate: '', // Manual Entry
    deliveryInspectionCIPReceivedDate: '', // Manual Entry
    miccReceiptDate: '', // Manual Entry
    lastDateOfDispatch: '', // Manual Entry
    invoiceReadyDate: '', // Manual Entry
    
    // ========== COURIER DETAILS ==========
    courierDocumentNo: '', // Manual Entry
    courierDocumentDate: '', // Manual Entry
    courierCompanyName: '', // Manual Entry
    billSentToPersonName: '', // Manual Entry
    billSentDate: '', // Manual Entry
    
    // ========== MATERIAL RECEIPT DATES ==========
    lastDateOfMaterialReceipt: '', // Manual Entry
    invoiceReceiptDate: '', // Manual Entry
    invoiceReceiptPersonName: '', // Dropdown from Employees
    invoiceReceiptPersonId: '', // Selected person ID
    materialVerificationDate: '', // Manual Entry
    
    // ========== PROCESSING DATES ==========
    jvrDate: '', // Manual Entry
    srnDate: '', // Manual Entry
    mrcDate: '', // Manual Entry
    invoiceSubmissionAtSiteDate: '', // Manual Entry
    invoiceForwardedToHODate: '', // Manual Entry
    invoiceForwardedForPaymentDate: '', // Manual Entry
    
    // ========== PAYMENT TERMS ==========
    paymentTermsId: '', // Dropdown from Payment Terms Master Data
    paymentTerms: '', // Auto-filled from selected payment terms
    paymentTextId: '', // Dropdown from Payment Terms Master Data (for description)
    paymentText: '', // Auto-filled from selected payment terms description
    
    // ========== 1ST DUE PAYMENT TRACKING (Read-only from Payment Advice) ==========
    firstDueDate: '', // Calculated
    firstDueAmount: '', // Calculated
    paymentReceivedAmount1stDue: '', // Read-only from Payment Advice
    receiptDate1stDue: '', // Read-only from Payment Advice
    firstDueBalance: '', // Calculated: 1st Due Amount - Payment Received Amount
    notDue1stDue: '', // Calculated
    overDue1stDue: '', // Calculated
    noOfDaysOfPaymentReceipt1stDue: '', // Calculated
    
    // ========== 2ND DUE PAYMENT TRACKING (Read-only from Payment Advice) ==========
    secondDueDate: '', // Calculated
    secondDueAmount: '', // Calculated
    paymentReceivedAmount2ndDue: '', // Read-only from Payment Advice
    receiptDate2ndDue: '', // Read-only from Payment Advice
    secondDueBalance: '', // Calculated
    notDue2ndDue: '', // Calculated
    overDue2ndDue: '', // Calculated
    noOfDaysOfPaymentReceipt2ndDue: '', // Calculated
    
    // ========== 3RD DUE PAYMENT TRACKING (Read-only from Payment Advice) ==========
    thirdDueDate: '', // Calculated
    thirdDueAmount: '', // Calculated
    paymentReceivedAmount3rdDue: '', // Read-only from Payment Advice
    receiptDate3rdDue: '', // Read-only from Payment Advice
    thirdDueBalance: '', // Calculated
    notDue3rdDue: '', // Calculated
    overDue3rdDue: '', // Calculated
    noOfDaysOfPaymentReceipt3rdDue: '', // Calculated
    
    // ========== CONSOLIDATED TOTALS ==========
    totalBalance: '', // Calculated: Sum of all balances
    notDueTotal: '', // Calculated: Sum of not-due amounts
    overDueTotal: '', // Calculated: Sum of overdue amounts
    
    // ========== TDS FIELDS (Read-only from Payment Advice) ==========
    itTDS2Percent: '', // Read-only from Payment Advice
    itTDS1Percent194Q: '', // Read-only from Payment Advice
    lcessBoq1Percent: '', // Read-only from Payment Advice
    tds2PercentCGSTSGST: '', // Read-only from Payment Advice
    tdsOnCGST1Percent: '', // Read-only from Payment Advice
    tdsOnSGST1Percent: '', // Read-only from Payment Advice
    
    // ========== DEDUCTIONS & ADJUSTMENTS (Read-only from Payment Advice) ==========
    excessSupplyQty: '', // Read-only from Payment Advice
    interestOnAdvance: '', // Read-only from Payment Advice
    anyHold: '', // Read-only from Payment Advice
    penaltyLDDeduction: '', // Read-only from Payment Advice
    bankCharges: '', // Read-only from Payment Advice
    lcDiscrepancyCharge: '', // Read-only from Payment Advice
    provisionForBadDebts: '', // Manual Entry
    badDebts: '', // Manual Entry
    
    // "Other" fields for dropdowns
    invoiceTypeOther: '',
    businessUnitOther: '',
    materialDescriptionTypeOther: '',
    unitOther: '',
  })
  
  // Load master data and PO entries
  useEffect(() => {
    setCustomers(getCustomers())
    setPaymentTerms(getPaymentTerms())
    setConsignees(getConsignees())
    setPayers(getPayers())
    setEmployees(getEmployees())
    
    // Load PO Entries
    ;(async () => {
      try {
        const allPOs = await poEntryService.getAllPONumbers()
        setPOEntries(allPOs)
      } catch (e) {
        console.error('Failed to load PO numbers:', e)
        setPOEntries([])
      }
    })()
  }, [getCustomers, getPaymentTerms, getConsignees, getPayers, getEmployees])
  
  // Load payment data from Payment Advice
  const loadPaymentData = async (poNumber) => {
    try {
      // Get invoices for this PO
      const invoices = await invoiceService.getInvoicesByPONumber(poNumber)
      if (invoices && invoices.length > 0) {
        const invoice = invoices[0] // Use first invoice for now
        if (invoice.id) {
          const payments = await paymentApi.getPaymentsByInvoice(invoice.id)
          if (payments && payments.data) {
            // Aggregate payment data
            const paymentData = payments.data.reduce((acc, payment) => {
              // Sum up payment amounts by due stage
              // This is simplified - in real system, you'd track which due stage each payment applies to
              acc.firstReceivedAmount = (parseFloat(acc.firstReceivedAmount || 0) + parseFloat(payment.amount || 0)).toFixed(2)
              acc.tds = (parseFloat(acc.tds || 0) + parseFloat(payment.tds || 0)).toFixed(2)
              acc.bankCharges = (parseFloat(acc.bankCharges || 0) + parseFloat(payment.bank_charges || 0)).toFixed(2)
              acc.penalty = (parseFloat(acc.penalty || 0) + parseFloat(payment.penalty || 0)).toFixed(2)
              acc.otherDeductions = (parseFloat(acc.otherDeductions || 0) + parseFloat(payment.other_deductions || 0)).toFixed(2)
              return acc
            }, {})
            
            setPaymentData(paymentData)
            
            // Update form data with payment information
            setFormData((prev) => ({
              ...prev,
              paymentReceivedAmount1stDue: paymentData.firstReceivedAmount || '',
              receiptDate1stDue: paymentData.receiptDate || '',
              itTDS2Percent: paymentData.tds || '',
              bankCharges: paymentData.bankCharges || '',
              penaltyLDDeduction: paymentData.penalty || '',
            }))
          }
        }
      }
    } catch (error) {
      console.error('Failed to load payment data:', error)
      // Don't show error - payment data may not exist yet
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
              gstTaxInvoiceNo: invoice.gst_tax_invoice_no || invoice.gstTaxInvoiceNo || '',
              gstTaxInvoiceDate: invoice.gst_tax_invoice_date || invoice.gstTaxInvoiceDate || '',
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
              poDate: invoice.po_date || invoice.poDate || '',
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
              lorryReceiptDate: invoice.lorry_receipt_date || invoice.lorryReceiptDate || '',
              transporterId: invoice.transporter_id || invoice.transporterId || '',
              transporterName: invoice.transporter_name || invoice.transporterName || '',
              deliveryChallanNo: invoice.delivery_challan_no || invoice.deliveryChallanNo || '',
              deliveryChallanDate: invoice.delivery_challan_date || invoice.deliveryChallanDate || '',
              paymentTermsId: invoice.payment_terms_id || invoice.paymentTermsId || '',
              paymentTerms: invoice.payment_terms || invoice.paymentTerms || '',
              paymentTextId: invoice.payment_text_id || invoice.paymentTextId || '',
              paymentText: invoice.payment_text || invoice.paymentText || '',
              // Load payment data if available
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
  
  // Auto-generate Internal Invoice No
  useEffect(() => {
    if (!formData.internalInvoiceNo && formData.invoiceType && formData.businessUnit) {
      const generatedID = invoiceService.generateInvoiceID(
        formData.invoiceType,
        formData.businessUnit
      )
      setFormData((prev) => ({ ...prev, internalInvoiceNo: generatedID }))
    }
  }, [formData.invoiceType, formData.businessUnit])
  
  // Handle PO Number (Key ID) selection - Auto-populate all linked fields
  const handleKeyIDChange = async (e) => {
    const poNumber = e.target.value
    if (!poNumber) {
      // Clear all auto-filled fields
      setFormData((prev) => ({
        ...prev,
        keyID: '',
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
        transporterId: '',
        transporterName: '',
        invoiceReceiptPersonId: '',
        invoiceReceiptPersonName: '',
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
      const poEntry = await poEntryService.getPOEntryByPONumber(poNumber)
      if (!poEntry) {
        alert(`PO Number ${poNumber} not found. Please create PO Entry first.`)
        return
      }
      
      // Fetch customer details from Master Data
      const customer = customers.find((c) => c.id === poEntry.customerId)
      const terms = paymentTerms.find((t) => t.id === poEntry.paymentTermsId)
      
      // Auto-populate all fields from PO Entry and Master Data
      const updated = {
        ...formData,
        keyID: poNumber,
        poNoReference: poEntry.poNumber || poNumber,
        poDate: poEntry.poDate || '',
        customerName: customer?.name || poEntry.customerName || '',
        customerId: poEntry.customerId || '',
        segment: poEntry.segment || '',
        region: poEntry.region || '',
        zone: poEntry.zone || '',
        accountManagerId: poEntry.accountManagerId || '',
        accountManagerName: employees.find((e) => e.id === poEntry.accountManagerId)?.name || '',
        stateOfSupply: poEntry.customerState || poEntry.poDeliveryState || '',
        currency: poEntry.poCurrency || 'INR',
        paymentTermsId: poEntry.paymentTermsId || '',
        paymentTerms: terms?.values?.paymentTermsDescription || poEntry.poPaymentTerms || '',
        paymentTextId: poEntry.paymentTermsId || '', // Use same payment terms for payment text
        paymentText: terms?.values?.paymentTermsDescription || poEntry.poPaymentTerms || '',
      }
      
      // Optionally set consignee and payer details from customer master data (but allow manual override)
      if (customer) {
        if (customer.consigneeId && !formData.consigneeId && !formData.consigneeNameAddress) {
          const consignee = consignees.find((c) => c.id === customer.consigneeId)
          if (consignee) {
            updated.consigneeId = customer.consigneeId
            updated.consigneeNameAddress = consignee.values?.consigneeAddress || consignee.name || ''
            updated.consigneeCity = consignee.values?.city || ''
          }
        }
        
        if (customer.payerId && !formData.payerId && !formData.payerNameAddress) {
          const payer = payers.find((p) => p.id === customer.payerId)
          if (payer) {
            updated.payerId = customer.payerId
            updated.payerNameAddress = payer.values?.payerAddress || payer.name || ''
            updated.payerCity = payer.values?.city || ''
          }
        }
      }
      
      setFormData(updated)
      
      // Load payment data for this invoice if it exists
      loadPaymentData(poNumber)
    } catch (error) {
      console.error('Failed to load PO entry:', error)
      alert('Failed to load PO entry. Please try again.')
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
      const draft = {
        ...formData,
        ...displayData,
        savedAt: new Date().toISOString(),
        draft: true,
      }
      localStorage.setItem('invoiceEntryDraft', JSON.stringify(draft))
      alert('Draft saved successfully!')
    } catch (error) {
      console.error('Failed to save draft:', error)
      alert('Failed to save draft. Please try again.')
    }
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.keyID) {
      alert('Key ID (PO Number) is mandatory. Please select a PO Number.')
      return
    }
    
    if (!formData.gstTaxInvoiceNo || !formData.gstTaxInvoiceDate) {
      alert('GST Tax Invoice No and Date are required.')
      return
    }
    
    // Save invoice with all computed values
    try {
      const invoiceData = {
        ...formData,
        ...displayData,
        key_id: formData.keyID, // Store Key ID for reporting
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
      
      alert(`Invoice ${savedInvoice?.invoice_number || savedInvoice?.internalInvoiceNo || formData.internalInvoiceNo || ''} saved successfully!`)
      navigate('/invoices')
    } catch (error) {
      console.error('Failed to save invoice:', error)
      alert('Failed to save invoice. Please try again.')
    }
  }
  
  // Render field based on type
  const renderField = (fieldName, label, type = FIELD_TYPES.MANUAL, options = [], placeholder = '', required = false) => {
    const isReadOnly = type === FIELD_TYPES.DEFAULT || type === FIELD_TYPES.CALCULATED
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
    
    return (
      <div className="invoice-entry-field" key={fieldName}>
        <label htmlFor={fieldName} className="invoice-entry-label">
          {label} {required && <span className="invoice-entry-required">*</span>}
        </label>
        <input
          type={fieldName.includes('Date') ? 'date' : fieldName.includes('Amount') || fieldName.includes('Value') || fieldName.includes('Rate') || fieldName.includes('Qty') || fieldName.includes('Percent') ? 'number' : 'text'}
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
        {isReadOnly && !isCalculated && <small className="invoice-entry-hint">Auto-filled from PO/Master Data</small>}
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
              poEntries.map(po => po.poNumber), '', true)}
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
            {renderField('region', 'Region', FIELD_TYPES.DEFAULT)}
            {renderField('zone', 'Zone', FIELD_TYPES.DEFAULT)}
            {renderField('salesOrderNo', 'Sales Order No', FIELD_TYPES.MANUAL)}
            {renderField('accountManagerName', 'Account Manager Name', FIELD_TYPES.DEFAULT)}
            {renderField('poNoReference', 'PO No / Reference', FIELD_TYPES.DEFAULT)}
            {renderField('poDate', 'PO Date', FIELD_TYPES.DEFAULT)}
          </div>
        </div>

        {/* ========== MATERIAL & SUPPLY DETAILS SECTION ========== */}
        <div className="invoice-entry-section">
          <h2 className="invoice-entry-section-title">Material & Supply Details</h2>
          <div className="invoice-entry-form-grid">
            {renderField('materialDescriptionType', 'Material Description Type', FIELD_TYPES.DROPDOWN, MATERIAL_DESCRIPTION_TYPES)}
            {renderField('stateOfSupply', 'State of Supply', FIELD_TYPES.DEFAULT)}
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
            {renderField('paymentReceivedAmount1stDue', 'Payment Received Amount (1st Due)', FIELD_TYPES.DEFAULT)}
            {renderField('receiptDate1stDue', 'Receipt Date (1st Due)', FIELD_TYPES.DEFAULT)}
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
            {renderField('paymentReceivedAmount2ndDue', 'Payment Received Amount (2nd Due)', FIELD_TYPES.DEFAULT)}
            {renderField('receiptDate2ndDue', 'Receipt Date (2nd Due)', FIELD_TYPES.DEFAULT)}
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
            {renderField('paymentReceivedAmount3rdDue', 'Payment Received Amount (3rd Due)', FIELD_TYPES.DEFAULT)}
            {renderField('receiptDate3rdDue', 'Receipt Date (3rd Due)', FIELD_TYPES.DEFAULT)}
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
            {renderField('itTDS2Percent', 'IT TDS @2%', FIELD_TYPES.DEFAULT)}
            {renderField('itTDS1Percent194Q', 'IT TDS @1% (194Q)', FIELD_TYPES.DEFAULT)}
            {renderField('lcessBoq1Percent', 'LCess / BOQ @1%', FIELD_TYPES.DEFAULT)}
            {renderField('tds2PercentCGSTSGST', 'TDS @2% (CGST/SGST)', FIELD_TYPES.DEFAULT)}
            {renderField('tdsOnCGST1Percent', 'TDS on CGST @1%', FIELD_TYPES.DEFAULT)}
            {renderField('tdsOnSGST1Percent', 'TDS on SGST @1%', FIELD_TYPES.DEFAULT)}
          </div>
        </div>

        {/* ========== DEDUCTIONS & ADJUSTMENTS SECTION ========== */}
        <div className="invoice-entry-section">
          <h2 className="invoice-entry-section-title">Deductions & Adjustments (From Payment Advice)</h2>
          <div className="invoice-entry-form-grid">
            {renderField('excessSupplyQty', 'Excess Supply Qty', FIELD_TYPES.DEFAULT)}
            {renderField('interestOnAdvance', 'Interest on Advance', FIELD_TYPES.DEFAULT)}
            {renderField('anyHold', 'Any Hold', FIELD_TYPES.DEFAULT)}
            {renderField('penaltyLDDeduction', 'Penalty / LD Deduction', FIELD_TYPES.DEFAULT)}
            {renderField('bankCharges', 'Bank Charges', FIELD_TYPES.DEFAULT)}
            {renderField('lcDiscrepancyCharge', 'LC Discrepancy Charge', FIELD_TYPES.DEFAULT)}
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
            Cancel
          </button>
          <button
            type="submit"
            className="invoice-entry-button invoice-entry-button-primary"
          >
            Submit Invoice
          </button>
        </div>
      </form>
    </div>
  )
}

export default InvoiceEntry
