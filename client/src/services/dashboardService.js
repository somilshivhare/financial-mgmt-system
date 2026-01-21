import client from '../api/client'

export const getDashboardStats = async () => {
  try {
    const response = await client.get('/dashboard/stats')
    return response.data
  } catch (error) {
    console.error('Failed to load dashboard stats:', error)
    return {
      totalRevenue: '0.00',
      totalOutstanding: '0.00',
      overdueAmount: '0.00',
      monthlyRevenue: '0.00',
      recentTransactions: [],
      topCustomers: [],
    }
  }
}

export const getRevenueChart = async (period = 'monthly') => {
  try {
    const response = await client.get(`/dashboard/revenue-chart?period=${period}`)
    return response.data || []
  } catch (error) {
    console.error('Failed to load revenue chart:', error)
    return []
  }
}

export const getOutstandingChart = async () => {
  try {
    const response = await client.get('/dashboard/outstanding-chart')
    return response.data || []
  } catch (error) {
    console.error('Failed to load outstanding chart:', error)
    return []
  }
}
