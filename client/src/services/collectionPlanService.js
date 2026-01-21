/**
 * Collection Plan Service
 * Manages Collection Plan data, calculates receivables, and links with Invoices and Payments
 */

import * as collectionApi from '../api/collection'
import * as masterDataService from './masterDataService'

// Get all collection plans
export const getAllCollectionPlans = async () => {
  try {
    const response = await collectionApi.getAllCollectionPlans()
    return response.data || []
  } catch (error) {
    console.error('Failed to load collection plans:', error)
    return []
  }
}

// Get collection plan by ID
export const getCollectionPlanById = async (id) => {
  try {
    const response = await collectionApi.getCollectionPlanById(id)
    return response.data || null
  } catch (error) {
    console.error(`Failed to load collection plan ${id}:`, error)
    return null
  }
}

// Calculate receivables for a customer
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

// Calculate received and deductions from payments
export const calculateCustomerPayments = async (customerId, businessUnit = null, month = null) => {
  try {
    // This is handled by the backend through the collection API, but we can use the payment service
    const payments = await paymentService.getPaymentsByCustomer(customerId)

    let filteredPayments = payments.filter((p) => !p.draft)

    // Filter by business unit if provided - this would need to be implemented
    // For now, return basic calculation
    let totalReceived = 0
    let totalDeductions = 0

    filteredPayments.forEach((payment) => {
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
  } catch (error) {
    console.error(`Failed to calculate payments for customer ${customerId}:`, error)
    return {
      received: '0.00',
      statutoryDeductions: '0.00',
    }
  }
}

// Get collection plan data for grid
export const getCollectionPlanData = async (filters = {}) => {
  try {
    const response = await collectionApi.getCollectionPlanData(filters)
    return response.data || []
  } catch (error) {
    console.error('Failed to load collection plan data:', error)
    return []
  }
}

// Save collection plan
export const saveCollectionPlan = async (planData) => {
  try {
    let response
    if (planData.id) {
      response = await collectionApi.updateCollectionPlan(planData.id, planData)
    } else {
      response = await collectionApi.createCollectionPlan(planData)
    }

    // Trigger update event
    window.dispatchEvent(new CustomEvent('collectionPlanUpdated', { detail: { plan: response.data } }))

    return response.data
  } catch (error) {
    console.error('Failed to save collection plan:', error)
    throw error
  }
}

// Get analytics data
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

