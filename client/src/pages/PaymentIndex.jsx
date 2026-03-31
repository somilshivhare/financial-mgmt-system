import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, Edit, Trash2, TrendingUp, Calendar, Search, Filter, X } from 'lucide-react'
import DatePicker from '../components/DatePicker'
import { ConfirmDialog, useConfirmDialog } from '../components/ConfirmDialog'
import { useToast } from '../contexts/ToastContext'
import * as paymentService from '../services/paymentService'
import '../styles/PaymentEntry.css'

function PaymentIndex() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { confirm, dialogProps } = useConfirmDialog()
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

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((payment) => {
        return (
          (payment.payment_number || payment.paymentID)?.toLowerCase().includes(query) ||
          (payment.customer_name || payment.customerName)?.toLowerCase().includes(query) ||
          (payment.invoice_number_display || payment.invoice_id)?.toLowerCase().includes(query) ||
          (payment.reference || payment.bankName)?.toLowerCase().includes(query) ||
          payment.invoiceIDs?.some((id) => id?.toLowerCase().includes(query)) ||
          payment.chequeNumber?.toLowerCase().includes(query) ||
          payment.utrNumber?.toLowerCase().includes(query)
        )
      })
    }

    if (statusFilter) {
      filtered = filtered.filter((payment) => {
        const status = getStatus(payment).toLowerCase()
        return status === statusFilter.toLowerCase()
      })
    }

    if (paymentTypeFilter) {
      filtered = filtered.filter((payment) => {
        const type = (payment.method || payment.paymentType || '').toLowerCase()
        return type === paymentTypeFilter.toLowerCase()
      })
    }

    if (dateFrom) {
      filtered = filtered.filter((payment) => {
        const paymentDate = payment.paid_at || payment.paymentReceiptDate || payment.created_at
        const dateStr = paymentDate ? (typeof paymentDate === 'string' ? paymentDate.slice(0, 10) : String(paymentDate).slice(0, 10)) : ''
        return dateStr && dateStr >= dateFrom
      })
    }

    if (dateTo) {
      filtered = filtered.filter((payment) => {
        const paymentDate = payment.paid_at || payment.paymentReceiptDate || payment.created_at
        const dateStr = paymentDate ? (typeof paymentDate === 'string' ? paymentDate.slice(0, 10) : String(paymentDate).slice(0, 10)) : ''
        return dateStr && dateStr <= dateTo
      })
    }

    return filtered
  }, [payments, searchQuery, statusFilter, paymentTypeFilter, dateFrom, dateTo])
  
  const handleDelete = async (paymentId) => {
    const confirmed = await confirm({
      title: 'Delete payment?',
      message: 'This will remove the payment and reverse linked invoice updates.',
      confirmText: 'Delete payment',
      tone: 'danger',
    })
    if (!confirmed) return
    try {
      await paymentService.deletePayment(paymentId)
      showToast('Payment deleted successfully', 'success')
      loadPayments()
    } catch (error) {
      console.error('Failed to delete payment:', error)
      showToast('Failed to delete payment. Please try again.', 'error')
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
            <DatePicker
              selected={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholderText="From Date"
              maxDate={dateTo || undefined}
            />
          </div>

          <div className="payment-index-filter-group">
            <label className="payment-index-filter-label">Date To</label>
            <DatePicker
              selected={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholderText="To Date"
              minDate={dateFrom || undefined}
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
                {filteredPayments.map((payment) => {
                  const paymentDate = payment.paid_at || payment.paymentReceiptDate || payment.created_at
                  const dateStr = paymentDate
                    ? (typeof paymentDate === 'string' && paymentDate.includes('T')
                        ? paymentDate.split('T')[0]
                        : String(paymentDate).slice(0, 10))
                    : ''
                  return (
                  <tr key={payment.id}>
                    <td>{dateStr}</td>
                    <td>
                      <span className="payment-index-id">{payment.payment_number || payment.paymentID}</span>
                    </td>
                    <td>{payment.customer_name || payment.customerName || 'N/A'}</td>
                    <td>
                      {payment.invoice_number_display ? (
                        <span className="payment-index-invoice-tag">
                          {payment.invoice_number_display}
                        </span>
                      ) : payment.invoicePayments?.length > 0 ? (
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
                      ) : payment.invoice_id && !String(payment.invoice_id).match(/^[0-9a-f-]{36}$/i) ? (
                        <span className="payment-index-invoice-tag">
                          {payment.invoice_id}
                        </span>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td>₹{parseFloat(payment.amount ?? payment.paymentAmount ?? payment.payment_amount ?? 0).toFixed(2)}</td>
                    <td>
                      <span className={`payment-index-type-badge payment-index-type-badge-${(payment.method || payment.paymentType || payment.payment_type || 'other').toLowerCase().replace(/\s/g, '-')}`}>
                        {payment.method || payment.paymentType || payment.payment_type || 'N/A'}
                      </span>
                    </td>
                    <td>{payment.reference || payment.bankName || payment.bank_name || 'N/A'}</td>
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
                  )
                })}
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
      <ConfirmDialog {...dialogProps} />
    </div>
  )
}

export default PaymentIndex

