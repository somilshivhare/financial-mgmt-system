import client from './client'

/**
 * Get comprehensive dashboard data including KPIs, insights, and summaries
 */
export const getDashboardData = async (filters = {}) => {
  const { data } = await client.get('/dashboard', { params: filters })
  return data
}

/**
 * Get analytics data for charts
 */
export const getDashboardAnalytics = async (filters = {}) => {
  const { data } = await client.get('/dashboard/analytics', { params: filters })
  return data
}

/**
 * Get subscription and storage usage
 */
export const getSubscriptionUsage = async () => {
  const { data } = await client.get('/dashboard/subscription-usage')
  return data
}

