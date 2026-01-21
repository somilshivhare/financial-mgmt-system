import * as subscriptionApi from '../api/subscription'

export const getSubscription = async () => {
  try {
    const response = await subscriptionApi.getSubscription()
    return response.data || null
  } catch (error) {
    console.error('Failed to load subscription:', error)
    return null
  }
}

export const updateSubscription = async (subscriptionData) => {
  try {
    const response = await subscriptionApi.updateSubscription(subscriptionData)
    return response.data
  } catch (error) {
    console.error('Failed to update subscription:', error)
    throw error
  }
}

export const getSubscriptionPlans = async () => {
  try {
    const response = await subscriptionApi.getSubscriptionPlans()
    return response.data || []
  } catch (error) {
    console.error('Failed to load subscription plans:', error)
    return []
  }
}

export const upgradeSubscription = async (planId) => {
  try {
    const response = await subscriptionApi.upgradeSubscription(planId)
    return response.data
  } catch (error) {
    console.error('Failed to upgrade subscription:', error)
    throw error
  }
}

export const cancelSubscription = async () => {
  try {
    const response = await subscriptionApi.cancelSubscription()
    return response.data
  } catch (error) {
    console.error('Failed to cancel subscription:', error)
    throw error
  }
}

export const getBillingHistory = async () => {
  try {
    const response = await subscriptionApi.getBillingHistory()
    return response.data || []
  } catch (error) {
    console.error('Failed to load billing history:', error)
    return []
  }
}
