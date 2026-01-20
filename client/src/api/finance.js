// Mock financial data
const mockTransactions = [
  { id: '1', date: '2025-01-15', description: 'Salary Deposit', amount: 5000, status: 'completed', type: 'income' },
  { id: '2', date: '2025-01-14', description: 'Grocery Store', amount: -125.50, status: 'completed', type: 'expense' },
  { id: '3', date: '2025-01-13', description: 'Electric Bill', amount: -85.00, status: 'completed', type: 'expense' },
  { id: '4', date: '2025-01-12', description: 'Restaurant', amount: -42.30, status: 'completed', type: 'expense' },
  { id: '5', date: '2025-01-11', description: 'Freelance Project', amount: 800, status: 'pending', type: 'income' },
  { id: '6', date: '2025-01-10', description: 'Gym Membership', amount: -50, status: 'completed', type: 'expense' },
  { id: '7', date: '2025-01-09', description: 'Online Purchase', amount: -199.99, status: 'failed', type: 'expense' },
  { id: '8', date: '2025-01-08', description: 'Insurance Premium', amount: -300, status: 'completed', type: 'expense' },
]

export const getTransactions = async () => {
  try {
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 300))
    return { data: mockTransactions }
  } catch (error) {
    throw error
  }
}

export const getDashboardStats = async () => {
  try {
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const totalIncome = mockTransactions
      .filter(t => t.type === 'income' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const totalExpense = Math.abs(mockTransactions
      .filter(t => t.type === 'expense' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0))
    
    const balance = totalIncome - totalExpense
    
    return {
      data: {
        balance: balance.toFixed(2),
        totalIncome: totalIncome.toFixed(2),
        totalExpense: totalExpense.toFixed(2),
        monthlyChange: '12.5%',
      },
    }
  } catch (error) {
    throw error
  }
}
