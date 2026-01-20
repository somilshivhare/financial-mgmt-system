import { useState, useEffect } from 'react'
import { getTransactions } from '../api/finance'
import '../styles/Finance.css'

function Finance() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await getTransactions()
        setTransactions(response.data)
      } catch (error) {
        console.error('Failed to fetch transactions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [])

  const getStatusClass = (status) => {
    return status === 'completed'
      ? 'status-completed'
      : status === 'pending'
        ? 'status-pending'
        : 'status-failed'
  }

  const getAmountClass = (amount) => {
    return amount > 0 ? 'amount-positive' : 'amount-negative'
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatAmount = (amount) => {
    return amount > 0 ? `+₹${amount.toFixed(2)}` : `₹${amount.toFixed(2)}`
  }

  return (
    <div className="finance-page">
      <div className="finance-header">
        <h1>Payment Transactions</h1>
        <p>View and manage all your financial transactions and payments.</p>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div className="finance-loading">Loading transactions...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{formatDate(transaction.date)}</td>
                  <td>{transaction.description}</td>
                  <td className={getAmountClass(transaction.amount)}>
                    {formatAmount(transaction.amount)}
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusClass(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default Finance
