import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, Edit, Trash2, TrendingUp, Calendar, Search, Filter, X } from 'lucide-react'
import * as paymentService from '../services/paymentService'
import '../styles/PaymentEntry.css'

function PaymentIndex() {
  const navigate = useNavigate()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
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
  
  const loadPayments = async () => {
    try {
      setLoading(true)
      const response = await paymentService.getAllPayments()
      // Handle both direct array and response.data format
      const allPayments = Array.isArray(response) ? response : (response?.data || [])
      setPayments(allPayments)
    } catch (error) {
      console.error('Failed to load payments:', error)
      setPayments([])
    } finally {
      setLoading(false)
    }
  }

  const getStatus = (payment) => {
    if (payment.draft) return 'Draft'
    return 'Posted'
  }

  const filteredPayments = useMemo(() => {
    let filtered = [...payments]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((payment) => {
        return (
          payment.paymentID?.toLowerCase().includes(query) ||
          payment.customerName?.toLowerCase().includes(query) ||
          payment.invoiceIDs?.some((id) => id?.toLowerCase().includes(query)) ||
          payment.bankName?.toLowerCase().includes(query) ||
          payment.chequeNumber?.toLowerCase().includes(query) ||
          payment.utrNumber?.toLowerCase().includes(query)
        )
      })
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter((payment) => {
        const status = getStatus(payment).toLowerCase()
        return status === statusFilter.toLowerCase()
      })
    }

    // Payment type filter
    if (paymentTypeFilter) {
      filtered = filtered.filter((payment) => {
        const type = (payment.paymentType || '').toLowerCase()
        return type === paymentTypeFilter.toLowerCase()
      })
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter((payment) => {
        const paymentDate = payment.paymentReceiptDate || payment.created_at
        return paymentDate && paymentDate >= dateFrom
      })
    }

    if (dateTo) {
      filtered = filtered.filter((payment) => {
        const paymentDate = payment.paymentReceiptDate || payment.created_at
        return paymentDate && paymentDate <= dateTo
      })
    }

    return filtered
  }, [payments, searchQuery, statusFilter, paymentTypeFilter, dateFrom, dateTo])
  
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

      {/* Search and Filter Bar */}
      <div className="payment-index-toolbar">
        <div className="payment-index-search-container">
          <Search className="payment-index-search-icon" />
          <input
            type="text"
            className="payment-index-search-input"
            placeholder="Search by Payment ID, Customer, Invoice, Bank, or UTR..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="payment-index-clear-search"
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`payment-index-filter-button ${showFilters ? 'active' : ''}`}
        >
          <Filter className="payment-index-filter-icon" />
          <span>Filters</span>
          {[searchQuery, statusFilter, paymentTypeFilter, dateFrom, dateTo].filter(Boolean).length > 0 && (
            <span className="payment-index-filter-badge">
              {[searchQuery, statusFilter, paymentTypeFilter, dateFrom, dateTo].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="payment-index-filters">
          <div className="payment-index-filter-group">
            <label className="payment-index-filter-label">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="payment-index-filter-select"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="posted">Posted</option>
            </select>
          </div>

          <div className="payment-index-filter-group">
            <label className="payment-index-filter-label">Payment Type</label>
            <select
              value={paymentTypeFilter}
              onChange={(e) => setPaymentTypeFilter(e.target.value)}
              className="payment-index-filter-select"
            >
              <option value="">All Types</option>
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
              <option value="neft">NEFT</option>
              <option value="rtgs">RTGS</option>
              <option value="imps">IMPS</option>
              <option value="upi">UPI</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="payment-index-filter-group">
            <label className="payment-index-filter-label">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="payment-index-filter-input"
            />
          </div>

          <div className="payment-index-filter-group">
            <label className="payment-index-filter-label">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="payment-index-filter-input"
            />
          </div>

          {[searchQuery, statusFilter, paymentTypeFilter, dateFrom, dateTo].filter(Boolean).length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('')
                setPaymentTypeFilter('')
                setDateFrom('')
                setDateTo('')
              }}
              className="payment-index-clear-filters"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* Payments Table */}
      <div className="payment-index-content">
        {loading ? (
          <div className="payment-index-loading">
            <p>Loading payments...</p>
          </div>
        ) : filteredPayments.length > 0 ? (
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
                    <td>{payment.customerName || payment.customer_name || 'N/A'}</td>
                    <td>
                      {payment.invoicePayments?.length > 0 ? (
                        payment.invoicePayments.map((ip, idx) => (
                          <span key={idx} className="payment-index-invoice-tag">
                            {ip.invoiceID || ip.invoice_id || ip.invoice_number || 'N/A'}
                          </span>
                        ))
                      ) : payment.invoiceIDs?.length > 0 ? (
                        payment.invoiceIDs.map((id, idx) => (
                          <span key={idx} className="payment-index-invoice-tag">
                            {id}
                          </span>
                        ))
                      ) : payment.invoice_id ? (
                        <span className="payment-index-invoice-tag">
                          {payment.invoice_id}
                        </span>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td>₹{parseFloat(payment.paymentAmount || payment.amount || payment.payment_amount || 0).toFixed(2)}</td>
                    <td>
                      <span className={`payment-index-type-badge payment-index-type-badge-${(payment.paymentType || payment.payment_type || 'other').toLowerCase()}`}>
                        {payment.paymentType || payment.payment_type || 'N/A'}
                      </span>
                    </td>
                    <td>{payment.bankName || payment.bank_name || 'N/A'}</td>
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
            <p>
              {[searchQuery, statusFilter, paymentTypeFilter, dateFrom, dateTo].filter(Boolean).length > 0
                ? 'No payments found matching your filters.'
                : 'No payments found.'}
            </p>
            {[searchQuery, statusFilter, paymentTypeFilter, dateFrom, dateTo].filter(Boolean).length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('')
                  setPaymentTypeFilter('')
                  setDateFrom('')
                  setDateTo('')
                }}
                className="payment-index-clear-filters-link"
              >
                Clear filters
              </button>
            ) : (
              <p style={{ fontSize: '14px', color: 'var(--color-text-tertiary)', marginTop: '8px' }}>
                Click "New Payment" to create one.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default PaymentIndex

