import client from './client'

export const getDashboardData = async (filters = {}) => {
  const { data } = await client.get('/dashboard', { params: filters })
  return data
}

export const getDashboardAnalytics = async (filters = {}) => {
  const { data } = await client.get('/dashboard/analytics', { params: filters })
  return data
}

export const getSubscriptionUsage = async () => {
  const { data } = await client.get('/dashboard/subscription-usage')
  return data
}

