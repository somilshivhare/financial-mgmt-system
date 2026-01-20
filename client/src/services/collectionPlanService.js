/**
 * Collection Plan Service
 * Manages Collection Plan data, calculates receivables, and links with Invoices and Payments
 */

import * as invoiceService from './invoiceService'
import * as paymentService from './paymentService'
import * as masterDataService from './masterDataService'

const STORAGE_KEY = 'nbaurum_collection_plans'

// Get all collection plans
export const getAllCollectionPlans = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Failed to load collection plans:', error)
    return []
  }
}

// Get collection plan by ID
export const getCollectionPlanById = (id) => {
  const plans = getAllCollectionPlans()
  return plans.find((p) => p.id === id)
}

// Calculate receivables for a customer
export const calculateCustomerReceivables = (customerId, businessUnit = null, month = null) => {
  const invoices = invoiceService.getAllInvoices()
  let customerInvoices = invoices.filter((inv) => inv.customerId === customerId)
  
  // Filter by business unit if provided
  if (businessUnit) {
    customerInvoices = customerInvoices.filter((inv) => inv.businessUnit === businessUnit)
  }
  
  // Filter by month if provided
  if (month) {
    customerInvoices = customerInvoices.filter((inv) => {
      const invDate = new Date(inv.invoiceDate)
      return invDate.getMonth() === month.getMonth() && invDate.getFullYear() === month.getFullYear()
    })
  }
  
  let totalOutstanding = 0
  let notDue = 0
  let overdue = 0
  let dueThisMonth = 0
  
  customerInvoices.forEach((inv) => {
    const invoiceValue = parseFloat(inv.totalInvoiceValue || 0)
    
    // Calculate received amounts
    const firstReceived = parseFloat(inv.firstReceivedAmount || 0)
    const secondReceived = parseFloat(inv.secondReceivedAmount || 0)
    const thirdReceived = parseFloat(inv.thirdReceivedAmount || 0)
    const totalReceived = firstReceived + secondReceived + thirdReceived
    
    const outstanding = invoiceValue - totalReceived
    totalOutstanding += outstanding
    
    // Calculate due amounts
    const firstDue = parseFloat(inv.firstDueAmount || 0)
    const secondDue = parseFloat(inv.secondDueAmount || 0)
    const thirdDue = parseFloat(inv.thirdDueAmount || 0)
    
    // Calculate balances for each due stage
    const firstBalance = firstDue - firstReceived
    const secondBalance = secondDue - secondReceived
    const thirdBalance = thirdDue - thirdReceived
    
    // Determine not-due and overdue
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (inv.firstDueDate) {
      const firstDueDate = new Date(inv.firstDueDate)
      firstDueDate.setHours(0, 0, 0, 0)
      
      if (firstBalance > 0) {
        if (firstDueDate >= today) {
          notDue += firstBalance
        } else {
          overdue += firstBalance
        }
        
        // Check if due this month
        if (firstDueDate.getMonth() === today.getMonth() && firstDueDate.getFullYear() === today.getFullYear()) {
          dueThisMonth += firstBalance
        }
      }
    }
    
    if (inv.secondDueDate) {
      const secondDueDate = new Date(inv.secondDueDate)
      secondDueDate.setHours(0, 0, 0, 0)
      
      if (secondBalance > 0) {
        if (secondDueDate >= today) {
          notDue += secondBalance
        } else {
          overdue += secondBalance
        }
        
        if (secondDueDate.getMonth() === today.getMonth() && secondDueDate.getFullYear() === today.getFullYear()) {
          dueThisMonth += secondBalance
        }
      }
    }
    
    if (inv.thirdDueDate) {
      const thirdDueDate = new Date(inv.thirdDueDate)
      thirdDueDate.setHours(0, 0, 0, 0)
      
      if (thirdBalance > 0) {
        if (thirdDueDate >= today) {
          notDue += thirdBalance
        } else {
          overdue += thirdBalance
        }
        
        if (thirdDueDate.getMonth() === today.getMonth() && thirdDueDate.getFullYear() === today.getFullYear()) {
          dueThisMonth += thirdBalance
        }
      }
    }
  })
  
  return {
    totalOutstanding: totalOutstanding.toFixed(2),
    notDue: notDue.toFixed(2),
    overdue: overdue.toFixed(2),
    dueThisMonth: dueThisMonth.toFixed(2),
  }
}

// Calculate received and deductions from payments
export const calculateCustomerPayments = (customerId, businessUnit = null, month = null) => {
  const payments = paymentService.getAllPayments()
  let customerPayments = payments.filter((p) => p.customerId === customerId && !p.draft)
  
  // Filter by business unit if provided
  if (businessUnit) {
    customerPayments = customerPayments.filter((p) => {
      // Get invoices for this payment and check business unit
      return p.invoicePayments?.some((ip) => {
        const invoice = invoiceService.getInvoiceByID(ip.invoiceID)
        return invoice?.businessUnit === businessUnit
      })
    })
  }
  
  // Filter by month if provided
  if (month) {
    customerPayments = customerPayments.filter((p) => {
      const payDate = new Date(p.paymentReceiptDate)
      return payDate.getMonth() === month.getMonth() && payDate.getFullYear() === month.getFullYear()
    })
  }
  
  let totalReceived = 0
  let totalDeductions = 0
  
  customerPayments.forEach((payment) => {
    payment.invoicePayments?.forEach((ip) => {
      const paymentAmount = parseFloat(ip.paymentAmount || 0)
      totalReceived += paymentAmount
      
      // Calculate deductions
      const charges = ip.charges || {}
      const tds = parseFloat(charges.tds || 0)
      const bankCharges = parseFloat(charges.bankCharges || 0)
      const penalty = parseFloat(charges.penalty || 0)
      const otherDeductions = parseFloat(charges.otherDeductions || 0)
      
      totalDeductions += tds + bankCharges + penalty + otherDeductions
    })
  })
  
  return {
    received: totalReceived.toFixed(2),
    statutoryDeductions: totalDeductions.toFixed(2),
  }
}

// Get collection plan data for grid
export const getCollectionPlanData = (filters = {}) => {
  const { personId, businessUnit, month } = filters
  
  // Get all customers
  const customers = masterDataService.getCustomers()
  
  // Get collection plans
  const plans = getAllCollectionPlans()
  
  // Build grid data
  const gridData = customers.map((customer) => {
    // Calculate receivables
    const receivables = calculateCustomerReceivables(customer.id, businessUnit, month)
    
    // Calculate payments
    const payments = calculateCustomerPayments(customer.id, businessUnit, month)
    
    // Get collection plan for this customer
    const plan = plans.find((p) => 
      p.customerId === customer.id && 
      (!businessUnit || p.businessUnit === businessUnit) &&
      (!month || p.month === month?.toISOString().split('T')[0])
    )
    
    // Get customer's assigned collection incharge (from Master Data or default)
    const collectionIncharge = customer.collectionInchargeId || customer.collectionIncharge || 'Default'
    
    // Calculate balance and target achieved
    const planFinalised = parseFloat(plan?.planFinalised || 0)
    const received = parseFloat(payments.received)
    const deductions = parseFloat(payments.statutoryDeductions)
    const balance = planFinalised - received - deductions
    const targetAchieved = planFinalised > 0 ? ((received + deductions) / planFinalised * 100) : 0
    
    return {
      id: customer.id,
      collectionIncharge,
      customerName: customer.name || customer.customerName,
      segment: customer.segment || 'N/A',
      packageName: customer.packageName || 'N/A',
      totalOutstanding: receivables.totalOutstanding,
      notDue: receivables.notDue,
      overdue: receivables.overdue,
      dueThisMonth: receivables.dueThisMonth,
      totalDueForPlan: receivables.totalOutstanding, // Same as total outstanding
      planFinalised: planFinalised.toFixed(2),
      received: payments.received,
      statutoryDeductions: payments.statutoryDeductions,
      balance: balance.toFixed(2),
      targetAchieved: targetAchieved.toFixed(2),
      customerId: customer.id,
      businessUnit: businessUnit || 'ALL',
      month: month ? month.toISOString().split('T')[0] : null,
    }
  })
  
  // Filter by person if provided
  if (personId) {
    const employees = masterDataService.getEmployees()
    const employee = employees.find((e) => e.id === personId)
    
    if (employee) {
      const employeeName = employee.name || employee.nameOfEmployee
      return gridData.filter((row) => {
        // Match by collection incharge name
        return row.collectionIncharge === employeeName || row.collectionIncharge === personId
      })
    }
  }
  
  return gridData
}

// Save collection plan
export const saveCollectionPlan = (planData) => {
  try {
    const plans = getAllCollectionPlans()
    
    if (!planData.id) {
      planData.id = `cp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      planData.createdAt = new Date().toISOString()
    }
    
    planData.updatedAt = new Date().toISOString()
    
    const index = plans.findIndex((p) => 
      p.id === planData.id ||
      (p.customerId === planData.customerId && 
       p.businessUnit === planData.businessUnit &&
       p.month === planData.month)
    )
    
    if (index >= 0) {
      plans[index] = planData
    } else {
      plans.push(planData)
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans))
    
    // Trigger update event
    window.dispatchEvent(new CustomEvent('collectionPlanUpdated', { detail: { plan: planData } }))
    
    return planData
  } catch (error) {
    console.error('Failed to save collection plan:', error)
    throw error
  }
}

// Get analytics data
export const getCollectionAnalytics = (filters = {}) => {
  const gridData = getCollectionPlanData(filters)
  
  // Planned vs Collected vs Balance
  const plannedVsCollected = {
    planned: gridData.reduce((sum, row) => sum + parseFloat(row.planFinalised || 0), 0),
    collected: gridData.reduce((sum, row) => sum + parseFloat(row.received || 0) + parseFloat(row.statutoryDeductions || 0), 0),
    balance: gridData.reduce((sum, row) => sum + parseFloat(row.balance || 0), 0),
  }
  
  // Target Achieved by person
  const targetByPerson = {}
  gridData.forEach((row) => {
    const person = row.collectionIncharge
    if (!targetByPerson[person]) {
      targetByPerson[person] = { planned: 0, achieved: 0, targetAchieved: 0 }
    }
    targetByPerson[person].planned += parseFloat(row.planFinalised || 0)
    targetByPerson[person].achieved += parseFloat(row.received || 0) + parseFloat(row.statutoryDeductions || 0)
  })
  
  Object.keys(targetByPerson).forEach((person) => {
    const data = targetByPerson[person]
    data.targetAchieved = data.planned > 0 ? (data.achieved / data.planned * 100) : 0
  })
  
  // Overdue vs Not Due
  const overdueVsNotDue = {
    overdue: gridData.reduce((sum, row) => sum + parseFloat(row.overdue || 0), 0),
    notDue: gridData.reduce((sum, row) => sum + parseFloat(row.notDue || 0), 0),
  }
  
  return {
    plannedVsCollected,
    targetByPerson,
    overdueVsNotDue,
  }
}

