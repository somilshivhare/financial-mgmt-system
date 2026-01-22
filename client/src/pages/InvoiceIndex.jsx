import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, Eye, Edit, Trash2, X } from 'lucide-react'
import * as invoiceService from '../services/invoiceService'
import '../styles/InvoiceEntry.css'

function InvoiceIndex() {
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [poNumberFilter, setPoNumberFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadInvoices()
    
    // Listen for invoice updates
    const handleInvoiceUpdate = () => loadInvoices()
    window.addEventListener('invoiceUpdated', handleInvoiceUpdate)
    window.addEventListener('invoiceDeleted', handleInvoiceUpdate)
    
    return () => {
      window.removeEventListener('invoiceUpdated', handleInvoiceUpdate)
      window.removeEventListener('invoiceDeleted', handleInvoiceUpdate)
    }
  }, [])

  const loadInvoices = async () => {
    try {
      setLoading(true)
      const data = await invoiceService.getAllInvoices()
      setInvoices(data?.data || data || [])
    } catch (error) {
      console.error('Failed to load invoices:', error)
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }

  const filteredInvoices = useMemo(() => {
    let filtered = [...invoices]

    // Search filter
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

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter((inv) => {
        const status = inv.status || 'draft'
        return status.toLowerCase() === statusFilter.toLowerCase()
      })
    }

    // PO Number filter
    if (poNumberFilter) {
      filtered = filtered.filter((inv) => {
        const poNum = inv.key_id || inv.po_number || ''
        return poNum.toLowerCase().includes(poNumberFilter.toLowerCase())
      })
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter((inv) => {
        const invDate = inv.issue_date || inv.gst_tax_invoice_date || inv.created_at
        return invDate && invDate >= dateFrom
      })
    }

    if (dateTo) {
      filtered = filtered.filter((inv) => {
        const invDate = inv.issue_date || inv.gst_tax_invoice_date || inv.created_at
        return invDate && invDate <= dateTo
      })
    }

    return filtered
  }, [invoices, searchQuery, statusFilter, poNumberFilter, dateFrom, dateTo])

  const handleDelete = async (invoiceId) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await invoiceService.deleteInvoice(invoiceId)
        alert('Invoice deleted successfully')
        loadInvoices()
      } catch (error) {
        console.error('Failed to delete invoice:', error)
        alert('Failed to delete invoice. Please try again.')
      }
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
              <option value="draft">Draft</option>
              <option value="posted">Posted</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
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
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="invoice-entry-index-filter-input"
            />
          </div>

          <div className="invoice-entry-index-filter-group">
            <label className="invoice-entry-index-filter-label">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="invoice-entry-index-filter-input"
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
                      <span className="invoice-entry-index-invoice-number">{invoice.invoice_number || invoice.internal_invoice_no || 'N/A'}</span>
                    </td>
                    <td>{invoice.gst_tax_invoice_no || 'N/A'}</td>
                    <td>{invoice.issue_date || invoice.gst_tax_invoice_date || invoice.created_at?.split('T')[0] || 'N/A'}</td>
                    <td>
                      <span className="invoice-entry-index-po-tag">{invoice.key_id || invoice.po_number || 'N/A'}</span>
                    </td>
                    <td>{invoice.customer_name || 'N/A'}</td>
                    <td>₹{parseFloat(invoice.total_invoice_value || invoice.totalInvoiceValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td>
                      <span className={`invoice-entry-index-status-badge invoice-entry-index-status-badge-${(invoice.status || 'draft').toLowerCase()}`}>
                        {(invoice.status || 'Draft').charAt(0).toUpperCase() + (invoice.status || 'Draft').slice(1)}
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
                          onClick={() => handleDelete(invoice.id)}
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
              <p style={{ fontSize: '14px', color: 'var(--color-text-tertiary)', marginTop: '8px' }}>
                Make sure you have created a PO Entry first, as invoices must be linked to a PO Number.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default InvoiceIndex
