import client from './client'

export const getSubscription = async () => {
  const response = await client.get('/subscription')
  return response.data
}

export const updateSubscription = async (subscriptionData) => {
  const response = await client.put('/subscription', subscriptionData)
  return response.data
}

export const getSubscriptionPlans = async () => {
  const response = await client.get('/subscription/plans')
  return response.data
}

export const upgradeSubscription = async (planId) => {
  const response = await client.post(`/subscription/upgrade/${planId}`)
  return response.data
}

export const cancelSubscription = async () => {
  const response = await client.post('/subscription/cancel')
  return response.data
}

export const getBillingHistory = async () => {
  const response = await client.get('/subscription/billing')
  return response.data
}

export const getUsageStats = async () => {
  const response = await client.get('/subscription/usage')
  return response.data
}

export const downloadInvoice = async (invoiceId) => {
  const response = await client.get(`/subscription/invoices/${invoiceId}/download`, {
    responseType: 'blob',
  })
  return response
}