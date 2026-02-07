import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Plus, Search, Filter, Eye, Edit, Trash2, X } from 'lucide-react'
import DatePicker from '../components/DatePicker'
import { ConfirmDialog, useConfirmDialog } from '../components/ConfirmDialog'
import { useToast } from '../contexts/ToastContext'
import * as invoiceService from '../services/invoiceService'
import '../styles/InvoiceEntry.css'

function InvoiceIndex() {
  const navigate = useNavigate()
  const location = useLocation()
  const { confirm, dialogProps } = useConfirmDialog()
  const { showToast } = useToast()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [poNumberFilter, setPoNumberFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const normalizeInvoiceRow = (inv) => (inv && typeof inv === 'object' ? { ...inv } : inv)

  const formatDate = (dateVal) => {
    if (!dateVal) return 'N/A'
    try {
      const d = new Date(dateVal)
      if (isNaN(d.getTime())) return dateVal.split('T')[0] || 'N/A'
      return d.toLocaleDateString('en-GB').replace(/\//g, '-')
    } catch (e) {
      return 'N/A'
    }
  }

  const loadInvoices = async () => {
    try {
      setLoading(true)
      setLoadError(null)
      setInvoices([]) 
      const list = await invoiceService.getAllInvoices()
      console.log('[InvoiceIndex] Invoices loaded:', list?.length || 0, 'invoices')
      if (Array.isArray(list) && list.length > 0) {
        list.slice(0, 3).forEach((inv, idx) => {
          console.log(`[InvoiceIndex] Invoice ${idx + 1}:`, inv.invoice_number || inv.internal_invoice_no, 'status:', inv.status)
        })
      }
      setInvoices(Array.isArray(list) ? list : [])
    } catch (error) {
      console.error('Failed to load invoices:', error)
      setLoadError(error?.response?.data?.message || error?.message || 'Failed to load invoices')
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvoices()
  }, [])

  useEffect(() => {
    if (location.pathname === '/invoices') {
      const timer = setTimeout(() => {
        loadInvoices()
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [location.pathname, location.state])

  useEffect(() => {
    const handleInvoiceUpdate = (e) => {
      const updatedInvoice = e?.detail?.invoice
      if (updatedInvoice && updatedInvoice.id) {
        setInvoices((prev) => {
          const normalized = normalizeInvoiceRow(updatedInvoice)
          const existsIndex = prev.findIndex((inv) => inv.id === updatedInvoice.id)
          if (existsIndex >= 0) {
            const updated = [...prev]
            updated[existsIndex] = normalized
            return updated
          }
          return [normalized, ...prev]
        })
      }
      loadInvoices()
    }
    const handleInvoiceDeleted = () => loadInvoices()
    window.addEventListener('invoiceUpdated', handleInvoiceUpdate)
    window.addEventListener('invoiceDeleted', handleInvoiceDeleted)
    return () => {
      window.removeEventListener('invoiceUpdated', handleInvoiceUpdate)
      window.removeEventListener('invoiceDeleted', handleInvoiceDeleted)
    }
  }, [])

  useEffect(() => {
    const handleVisibility = () => { if (document.visibilityState === 'visible') loadInvoices() }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  const filteredInvoices = useMemo(() => {
    let filtered = [...invoices]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((inv) => {
        return (
          inv.invoice_number?.toLowerCase().includes(query) ||
          inv.gst_tax_invoice_no?.toLowerCase().includes(query) ||
          inv.internal_invoice_no?.toLowerCase().includes(query) ||
          inv.customer_name?.toLowerCase().includes(query) ||
          inv.key_id?.toLowerCase().includes(query) ||
          inv.po_number?.toLowerCase().includes(query)
        )
      })
    }

    if (statusFilter) {
      filtered = filtered.filter((inv) => {
        const status = (inv.status || 'open').toLowerCase()
        const filter = statusFilter.toLowerCase()
        if (filter === 'open') return status === 'open' || status === 'draft'
        if (filter === 'posted') return status === 'posted' || status === 'active'
        if (filter === 'paid') return status === 'paid' || status === 'closed'
        if (filter === 'cancelled') return status === 'cancelled' || status === 'rejected'
        return status === filter
      })
    }

    if (poNumberFilter) {
      const poQuery = poNumberFilter.toLowerCase()
      filtered = filtered.filter((inv) => {
        const poNum = (inv.key_id || inv.po_number || '').toLowerCase()
        return poNum.includes(poQuery)
      })
    }

    const getPureDate = (val) => {
      if (!val) return ''
      return typeof val === 'string' ? val.split('T')[0] : new Date(val).toISOString().split('T')[0]
    }

    if (dateFrom) {
      filtered = filtered.filter((inv) => {
        const invDate = getPureDate(inv.issue_date || inv.gst_tax_invoice_date || inv.created_at)
        return invDate && invDate >= dateFrom
      })
    }

    if (dateTo) {
      filtered = filtered.filter((inv) => {
        const invDate = getPureDate(inv.issue_date || inv.gst_tax_invoice_date || inv.created_at)
        return invDate && invDate <= dateTo
      })
    }

    return filtered
  }, [invoices, searchQuery, statusFilter, poNumberFilter, dateFrom, dateTo])

  const handleDelete = async (invoiceId) => {
    const confirmed = await confirm({
      title: 'Delete invoice?',
      message: 'This invoice will be permanently removed. This action cannot be undone.',
      confirmText: 'Delete invoice',
      tone: 'danger',
    })
    if (!confirmed) return
    
    try {
      await invoiceService.deleteInvoice(invoiceId)
      showToast('Invoice deleted successfully', 'success')
      loadInvoices()
    } catch (error) {
      console.error('Failed to delete invoice:', error)
      
      let errorMessage = 'Failed to delete invoice. Please try again.'
      
      if (error?.code === 'ERR_INVOICE_HAS_PAYMENTS') {
        errorMessage = error?.message || 'Cannot delete invoice with existing payments. Please delete payments first.'
      } else if (error?.code === 'ERR_NOT_FOUND') {
        errorMessage = 'Invoice not found. It may have already been deleted.'
      } else if (error?.message) {
        errorMessage = error.message
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message
      }
      
      showToast(errorMessage, 'error')
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('')
    setPoNumberFilter('')
    setDateFrom('')
    setDateTo('')
  }

  const hasActiveFilters = searchQuery || statusFilter || poNumberFilter || dateFrom || dateTo

  return (
    <div className="invoice-entry-index-page">
      <div className="invoice-entry-index-header">
        <div className="invoice-entry-index-header-content">
          <h1 className="invoice-entry-index-title">Invoice Entry</h1>
          <p className="invoice-entry-index-subtitle">Create and manage invoices linked to PO Entries</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/invoices/new')}
          className="invoice-entry-index-add-button"
        >
          <Plus className="invoice-entry-index-add-icon" />
          <span>New Invoice</span>
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="invoice-entry-index-toolbar">
        <div className="invoice-entry-index-search-container">
          <Search className="invoice-entry-index-search-icon" />
          <input
            type="text"
            className="invoice-entry-index-search-input"
            placeholder="Search by Invoice No, GST Invoice No, Customer, or PO Number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="invoice-entry-index-clear-search"
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`invoice-entry-index-filter-button ${showFilters ? 'active' : ''}`}
        >
          <Filter className="invoice-entry-index-filter-icon" />
          <span>Filters</span>
          {hasActiveFilters && <span className="invoice-entry-index-filter-badge">{[searchQuery, statusFilter, poNumberFilter, dateFrom, dateTo].filter(Boolean).length}</span>}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="invoice-entry-index-filters">
          <div className="invoice-entry-index-filter-group">
            <label className="invoice-entry-index-filter-label">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="invoice-entry-index-filter-select"
            >
              <option value="">All Statuses</option>
              <option value="open">Open / Draft</option>
              <option value="posted">Posted / Active</option>
              <option value="paid">Paid / Closed</option>
              <option value="cancelled">Cancelled / Rejected</option>
            </select>
          </div>

          <div className="invoice-entry-index-filter-group">
            <label className="invoice-entry-index-filter-label">PO Number</label>
            <input
              type="text"
              value={poNumberFilter}
              onChange={(e) => setPoNumberFilter(e.target.value)}
              className="invoice-entry-index-filter-input"
              placeholder="Filter by PO Number..."
            />
          </div>

          <div className="invoice-entry-index-filter-group">
            <label className="invoice-entry-index-filter-label">Date From</label>
            <DatePicker
              selected={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholderText="From Date"
            />
          </div>

          <div className="invoice-entry-index-filter-group">
            <label className="invoice-entry-index-filter-label">Date To</label>
            <DatePicker
              selected={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholderText="To Date"
            />
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="invoice-entry-index-clear-filters"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* Invoices Table */}
      <div className="invoice-entry-index-content">
        {loading ? (
          <div className="invoice-entry-index-loading">
            <p>Loading invoices...</p>
          </div>
        ) : loadError ? (
          <div className="invoice-entry-index-empty">
            <p>{loadError}</p>
            <button
              type="button"
              onClick={() => loadInvoices()}
              className="invoice-entry-index-add-button"
              style={{ marginTop: '12px' }}
            >
              Retry
            </button>
          </div>
        ) : filteredInvoices.length > 0 ? (
          <div className="invoice-entry-index-table-wrapper">
            <table className="invoice-entry-index-table">
              <thead>
                <tr>
                  <th>Invoice Number</th>
                  <th>GST Invoice No</th>
                  <th>Invoice Date</th>
                  <th>PO Number</th>
                  <th>Customer Name</th>
                  <th>Total Value</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>
                      <span className="invoice-entry-index-invoice-number" onClick={() => navigate(`/invoices/view/${invoice.id}`)} style={{ cursor: 'pointer', color: 'var(--color-primary)' }}>
                        {invoice.invoice_number || invoice.internal_invoice_no || 'N/A'}
                      </span>
                    </td>
                    <td>{invoice.gst_tax_invoice_no || 'N/A'}</td>
                    <td>{formatDate(invoice.issue_date || invoice.gst_tax_invoice_date || invoice.created_at)}</td>
                    <td>
                      <span className="invoice-entry-index-po-tag">{invoice.key_id || invoice.po_number || 'N/A'}</span>
                    </td>
                    <td>{invoice.customer_name || 'N/A'}</td>
                    <td>₹{parseFloat(invoice.total_amount || invoice.total_invoice_value || invoice.totalInvoiceValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td>
                      <span className={`invoice-entry-index-status-badge invoice-entry-index-status-badge-${(invoice.status || 'open').toLowerCase()}`}>
                        {(() => {
                          const status = (invoice.status || 'open').toLowerCase()
                          const statusLabels = {
                            'open': 'Open',
                            'draft': 'Draft',
                            'posted': 'Posted',
                            'submitted': 'Posted',
                            'active': 'Posted',
                            'paid': 'Paid',
                            'closed': 'Closed',
                            'cancelled': 'Cancelled',
                            'rejected': 'Cancelled',
                          }
                          return statusLabels[status] || status.charAt(0).toUpperCase() + status.slice(1)
                        })()}
                      </span>
                    </td>
                    <td>
                      <div className="invoice-entry-index-actions">
                        <button
                          type="button"
                          className="invoice-entry-index-action-button"
                          onClick={() => navigate(`/invoices/view/${invoice.id}`)}
                          title="View"
                        >
                          <Eye className="invoice-entry-index-action-icon" />
                        </button>
                        <button
                          type="button"
                          className="invoice-entry-index-action-button"
                          onClick={() => navigate(`/invoices/edit/${invoice.id}`)}
                          title="Edit"
                        >
                          <Edit className="invoice-entry-index-action-icon" />
                        </button>
                        <button
                          type="button"
                          className="invoice-entry-index-action-button invoice-entry-index-action-button-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(invoice.id);
                          }}
                          title="Delete"
                        >
                          <Trash2 className="invoice-entry-index-action-icon" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="invoice-entry-index-empty">
            <p>
              {hasActiveFilters 
                ? 'No invoices found matching your filters.' 
                : 'No invoices found. Click "New Invoice" to create one.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="invoice-entry-index-clear-filters-link"
              >
                Clear filters
              </button>
            )}
            {!hasActiveFilters && (
              <>
                <p style={{ fontSize: '14px', color: 'var(--color-text-tertiary)', marginTop: '8px' }}>
                  Make sure you have created a PO Entry first, as invoices must be linked to a PO Number.
                </p>
                <button
                  type="button"
                  onClick={() => loadInvoices()}
                  className="invoice-entry-index-add-button"
                  style={{ marginTop: '12px' }}
                >
                  Refresh list
                </button>
              </>
            )}
          </div>
        )}
      </div>
      <ConfirmDialog {...dialogProps} />
    </div>
  )
}

export default InvoiceIndex
