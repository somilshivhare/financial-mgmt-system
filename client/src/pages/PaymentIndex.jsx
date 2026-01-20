import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, Edit, Trash2, TrendingUp, Calendar } from 'lucide-react'
import * as paymentService from '../services/paymentService'
import '../styles/PaymentEntry.css'

function PaymentIndex() {
  const navigate = useNavigate()
  const [payments, setPayments] = useState([])
  const [filteredPayments, setFilteredPayments] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  
  useEffect(() => {
    loadPayments()
    
    // Listen for payment updates
    const handlePaymentUpdate = () => loadPayments()
    window.addEventListener('paymentUpdated', handlePaymentUpdate)
    window.addEventListener('paymentDeleted', handlePaymentUpdate)
    
    return () => {
      window.removeEventListener('paymentUpdated', handlePaymentUpdate)
      window.removeEventListener('paymentDeleted', handlePaymentUpdate)
    }
  }, [])
  
  useEffect(() => {
    if (searchQuery) {
      const filtered = payments.filter((payment) => {
        const query = searchQuery.toLowerCase()
        return (
          payment.paymentID?.toLowerCase().includes(query) ||
          payment.customerName?.toLowerCase().includes(query) ||
          payment.invoiceIDs?.some((id) => id.toLowerCase().includes(query))
        )
      })
      setFilteredPayments(filtered)
    } else {
      setFilteredPayments(payments)
    }
  }, [searchQuery, payments])
  
  const loadPayments = () => {
    const allPayments = paymentService.getAllPayments()
    setPayments(allPayments)
    setFilteredPayments(allPayments)
  }
  
  const handleDelete = (paymentId) => {
    if (window.confirm('Are you sure you want to delete this payment? This will reverse invoice updates.')) {
      try {
        paymentService.deletePayment(paymentId)
        alert('Payment deleted successfully')
        loadPayments()
      } catch (error) {
        console.error('Failed to delete payment:', error)
        alert('Failed to delete payment. Please try again.')
      }
    }
  }
  
  const getStatus = (payment) => {
    if (payment.draft) return 'Draft'
    return 'Posted'
  }
  
  return (
    <div className="payment-index-page">
      <div className="payment-index-header">
        <div className="payment-index-header-content">
          <h1 className="payment-index-title">Payment Entry</h1>
          <p className="payment-index-subtitle">Record and manage customer payments</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/payments/new')}
          className="payment-index-add-button"
        >
          <Plus className="payment-index-add-icon" />
          <span>New Payment</span>
        </button>
      </div>

      {/* Search */}
      <div className="payment-index-search">
        <input
          type="text"
          className="payment-index-search-input"
          placeholder="Search by Payment ID, Customer, or Invoice..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Payments Table */}
      <div className="payment-index-content">
        {filteredPayments.length > 0 ? (
          <div className="payment-index-table-wrapper">
            <table className="payment-index-table">
              <thead>
                <tr>
                  <th>Payment Date</th>
                  <th>Payment ID</th>
                  <th>Customer Name</th>
                  <th>Invoice No</th>
                  <th>Payment Amount</th>
                  <th>Payment Type</th>
                  <th>Bank Name</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{payment.paymentReceiptDate}</td>
                    <td>
                      <span className="payment-index-id">{payment.paymentID}</span>
                    </td>
                    <td>{payment.customerName}</td>
                    <td>
                      {payment.invoicePayments?.map((ip, idx) => (
                        <span key={idx} className="payment-index-invoice-tag">
                          {ip.invoiceID}
                        </span>
                      ))}
                    </td>
                    <td>₹{parseFloat(payment.paymentAmount || 0).toFixed(2)}</td>
                    <td>
                      <span className="payment-index-type-badge payment-index-type-badge-{payment.paymentType}">
                        {payment.paymentType}
                      </span>
                    </td>
                    <td>{payment.bankName || 'N/A'}</td>
                    <td>
                      <span className={`payment-index-status-badge payment-index-status-badge-${getStatus(payment).toLowerCase()}`}>
                        {getStatus(payment)}
                      </span>
                    </td>
                    <td>
                      <div className="payment-index-actions">
                        <button
                          type="button"
                          className="payment-index-action-button"
                          onClick={() => navigate(`/payments/view/${payment.id}`)}
                          title="View"
                        >
                          <Eye className="payment-index-action-icon" />
                        </button>
                        <button
                          type="button"
                          className="payment-index-action-button"
                          onClick={() => navigate(`/payments/edit/${payment.id}`)}
                          title="Edit"
                        >
                          <Edit className="payment-index-action-icon" />
                        </button>
                        <button
                          type="button"
                          className="payment-index-action-button payment-index-action-button-delete"
                          onClick={() => handleDelete(payment.id)}
                          title="Delete"
                        >
                          <Trash2 className="payment-index-action-icon" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="payment-index-empty">
            <p>No payments found.</p>
            <p style={{ fontSize: '14px', color: 'var(--color-text-tertiary)', marginTop: '8px' }}>
              Click "New Payment" to create one.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default PaymentIndex

