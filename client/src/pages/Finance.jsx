import { useState, useEffect } from 'react'
import { getAllPayments } from '../services/paymentService'
import '../styles/Finance.css'

function Finance() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await getAllPayments()
        // Transform payments to transaction format for display
        const transactions = response.map(payment => ({
          id: payment.id,
          date: payment.paymentReceiptDate,
          description: `Payment ${payment.paymentID} - ${payment.customerName || 'Customer'}`,
          amount: parseFloat(payment.paymentAmount || 0),
          status: payment.status || 'completed',
          type: 'income'
        }))
        setPayments(transactions)
      } catch (error) {
        console.error('Failed to fetch payments:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPayments()
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
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{formatDate(payment.date)}</td>
                  <td>{payment.description}</td>
                  <td className={getAmountClass(payment.amount)}>
                    {formatAmount(payment.amount)}
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusClass(payment.status)}`}>
                      {payment.status}
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
