import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAllPayments } from '../services/paymentService'
import '../styles/Finance.css'

function Finance() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setError(null)
        const list = await getAllPayments()
        const transactions = (Array.isArray(list) ? list : []).map((p) => {
          const dateRaw = p.paid_at ?? p.paidAt ?? p.paymentReceiptDate ?? p.created_at ?? p.createdAt ?? null
          const paymentNumber = p.payment_number ?? p.paymentNumber ?? p.paymentID ?? p.id ?? ''
          const customerName = p.customer_name ?? p.customerName ?? 'Customer'
          const amount = parseFloat(p.amount ?? p.paymentAmount ?? 0) || 0
          const status = (p.status ?? 'pending').toLowerCase()
          return {
            id: p.id,
            date: dateRaw,
            description: paymentNumber ? `Payment ${paymentNumber} – ${customerName}` : `Payment – ${customerName}`,
            invoiceNumber: p.invoice_number_display ?? p.invoiceNumber ?? p.invoice_number ?? '',
            amount,
            status,
            type: 'income',
          }
        })
        setPayments(transactions)
      } catch (err) {
        console.error('Failed to fetch payments:', err)
        setError('Unable to load transactions.')
        setPayments([])
      } finally {
        setLoading(false)
      }
    }

    fetchPayments()
  }, [])

  const getStatusClass = (status) => {
    if (status === 'completed' || status === 'paid') return 'status-completed'
    if (status === 'pending') return 'status-pending'
    if (status === 'failed' || status === 'cancelled') return 'status-failed'
    return 'status-pending'
  }

  const getAmountClass = (amount) => {
    return amount > 0 ? 'amount-positive' : amount < 0 ? 'amount-negative' : ''
  }

  const formatDate = (date) => {
    if (date === null || date === undefined || date === '') return '—'
    const d = new Date(date)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatAmount = (amount) => {
    const n = Number(amount)
    if (!Number.isFinite(n)) return '₹0.00'
    return amount > 0 ? `+₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatStatusLabel = (status) => {
    if (status === 'paid' || status === 'completed') return 'Completed'
    if (status === 'pending') return 'Pending'
    if (status === 'failed' || status === 'cancelled') return status.charAt(0).toUpperCase() + status.slice(1)
    return String(status).charAt(0).toUpperCase() + String(status).slice(1)
  }

  return (
    <div className="finance-page">
      <div className="finance-header">
        <h1>Payment Transactions</h1>
        <p>View and manage all your financial transactions and payments.</p>
      </div>

      {error && (
        <div className="finance-error" role="alert">
          {error}
        </div>
      )}

      <div className="table-wrapper">
        {loading ? (
          <div className="finance-loading">Loading transactions…</div>
        ) : payments.length === 0 ? (
          <div className="finance-empty">
            <p>No payment transactions yet.</p>
            <Link to="/payments/new" className="finance-empty-link">
              Record a payment
            </Link>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Invoice</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{formatDate(payment.date)}</td>
                  <td>{payment.description}</td>
                  <td>
                    {payment.invoiceNumber ? (
                      <Link to={`/invoices`} className="finance-invoice-link">
                        {payment.invoiceNumber}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className={getAmountClass(payment.amount)}>
                    {formatAmount(payment.amount)}
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusClass(payment.status)}`}>
                      {formatStatusLabel(payment.status)}
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
