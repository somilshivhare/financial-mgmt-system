import client from './client'

export const getTransactions = async (params = {}) => {
  const { data } = await client.get('/payments', { params })
  const transactions = (data.data?.data || data.data || []).map((p) => ({
    id: p.id,
    date: p.paid_at || p.created_at,
    description: p.reference || `Payment ${p.id}`,
    amount: Number(p.amount || 0),
    status: p.status || 'pending',
    type: 'income',
  }))
  return { data: transactions }
}

export const getDashboardStats = async () => {
  const { data } = await client.get('/dashboard')
  const totals = data.data?.totals || {}
  const payments = data.data?.payments || {}
  return {
    data: {
      balance: Number(totals.outstanding || 0),
      totalIncome: Number(payments.totalPaid || 0),
      totalExpense: 0,
      monthlyChange: 'n/a',
    },
  }
}
