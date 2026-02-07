
import * as collectionApi from '../api/collection'
import * as masterDataService from './masterDataService'

export const getAllCollectionPlans = async () => {
  try {
    const response = await collectionApi.getAllCollectionPlans()
    return response.data || []
  } catch (error) {
    console.error('Failed to load collection plans:', error)
    return []
  }
}

export const getCollectionPlanById = async (id) => {
  try {
    const response = await collectionApi.getCollectionPlanById(id)
    return response.data || null
  } catch (error) {
    console.error(`Failed to load collection plan ${id}:`, error)
    return null
  }
}

export const calculateCustomerReceivables = async (customerId, businessUnit = null, month = null) => {
  try {
    const response = await collectionApi.calculateCustomerReceivables(customerId, businessUnit, month)
    return response.data
  } catch (error) {
    console.error(`Failed to calculate receivables for customer ${customerId}:`, error)
    return {
      totalOutstanding: '0.00',
      notDue: '0.00',
      overdue: '0.00',
      dueThisMonth: '0.00',
    }
  }
}

export const calculateCustomerPayments = async (customerId, businessUnit = null, month = null) => {
  try {
    const payments = await paymentService.getPaymentsByCustomer(customerId)

    let filteredPayments = payments.filter((p) => !p.draft)

    let totalReceived = 0
    let totalDeductions = 0

    filteredPayments.forEach((payment) => {
      payment.invoicePayments?.forEach((ip) => {
        const paymentAmount = parseFloat(ip.paymentAmount || 0)
        totalReceived += paymentAmount

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
  } catch (error) {
    console.error(`Failed to calculate payments for customer ${customerId}:`, error)
    return {
      received: '0.00',
      statutoryDeductions: '0.00',
    }
  }
}

export const getCollectionPlanData = async (filters = {}) => {
  try {
    const response = await collectionApi.getCollectionPlanData(filters)
    return response.data || []
  } catch (error) {
    console.error('Failed to load collection plan data:', error)
    return []
  }
}

export const saveCollectionPlan = async (planData) => {
  try {
    let response
    if (planData.id) {
      response = await collectionApi.updateCollectionPlan(planData.id, planData)
    } else {
      response = await collectionApi.createCollectionPlan(planData)
    }

    window.dispatchEvent(new CustomEvent('collectionPlanUpdated', { detail: { plan: response.data } }))

    return response.data
  } catch (error) {
    console.error('Failed to save collection plan:', error)
    throw error
  }
}

export const getCollectionAnalytics = async (filters = {}) => {
  try {
    const response = await collectionApi.getCollectionAnalytics(filters)
    return response.data
  } catch (error) {
    console.error('Failed to load collection analytics:', error)
    return {
      plannedVsCollected: { planned: 0, collected: 0, balance: 0 },
      targetByPerson: {},
      overdueVsNotDue: { overdue: 0, notDue: 0 },
    }
  }
}

