import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, Eye, Edit, Trash2, X, RefreshCw } from 'lucide-react'
import DatePicker from '../components/DatePicker'
import { ConfirmDialog, useConfirmDialog } from '../components/ConfirmDialog'
import { useToast } from '../contexts/ToastContext'
import * as poEntryService from '../services/poEntryService'
import '../styles/POEntry.css'

function getPOField(po, field) {
  if (po[field] != null && po[field] !== '') return po[field]
  try {
    const draft = typeof po.draft_data === 'string' ? JSON.parse(po.draft_data) : po.draft_data
    return draft?.formData?.[field] ?? null
  } catch {
    return null
  }
}

function formatDate(value) {
  if (!value) return ''
  const s = String(value)
  return s.includes('T') ? s.split('T')[0] : s
}

function pickPONumber(po) {
  const fromDraft = getPOField(po, 'poNumber')
  const fromRow = po.po_number || po.poNumber
  const candidates = [fromDraft, fromRow].filter(Boolean).map((v) => String(v))
  const nonPlaceholder = candidates.find((v) => !v.toUpperCase().includes('XXXX'))
  return nonPlaceholder || candidates[0] || ''
}

function formatStatusLabel(status) {
  const s = String(status || 'draft').toLowerCase()
  if (s === 'approved') return 'Submitted'
  if (s === 'closed') return 'Closed'
  if (s === 'cancelled') return 'Cancelled'
  return 'Draft'
}

function getPOValue(po) {
  try {
    const draft = typeof po.draft_data === 'string' ? JSON.parse(po.draft_data) : po.draft_data
    if (draft) {
      const form = draft.formData || {}
      const fromForm = form.poValue ?? form.boqTotals?.totalPOValue
      const numFromForm = parseFloat(fromForm)
      if (Number.isFinite(numFromForm) && numFromForm >= 0) return numFromForm
      const items = draft.boqItems || []
      if (Array.isArray(items) && items.length > 0) {
        const sum = items.reduce((acc, it) => acc + (parseFloat(it.totalCost) || 0), 0)
        if (Number.isFinite(sum) && sum >= 0) return sum
      }
    }
  } catch (_) {}
  const fromRow = po.total_amount ?? po.totalAmount ?? po.po_value ?? po.poValue
  const numFromRow = parseFloat(fromRow)
  return Number.isFinite(numFromRow) && numFromRow >= 0 ? numFromRow : 0
}

function POEntryIndex() {
  const navigate = useNavigate()
  const { confirm, dialogProps } = useConfirmDialog()
  const { showToast } = useToast()
  const [poEntries, setPOEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadPOEntries()

    const handlePOUpdate = () => loadPOEntries()
    window.addEventListener('poUpdated', handlePOUpdate)
    window.addEventListener('poEntryUpdated', handlePOUpdate)
    window.addEventListener('poDeleted', handlePOUpdate)
    const onFocus = () => loadPOEntries()
    window.addEventListener('focus', onFocus)

    return () => {
      window.removeEventListener('poUpdated', handlePOUpdate)
      window.removeEventListener('poEntryUpdated', handlePOUpdate)
      window.removeEventListener('poDeleted', handlePOUpdate)
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  const loadPOEntries = async () => {
    try {
      setLoading(true)
      const entries = await poEntryService.getAllPOEntries()
      if (Array.isArray(entries)) {
        setPOEntries(entries)
      } else {
        console.warn('PO entries is not an array:', entries)
        setPOEntries([])
      }
    } catch (error) {
      console.error('Failed to load PO entries:', error)
      setPOEntries([])
    } finally {
      setLoading(false)
    }
  }

  const filteredPOEntries = useMemo(() => {
    if (!Array.isArray(poEntries)) {
      console.warn('poEntries is not an array:', poEntries)
      return []
    }
    let filtered = [...poEntries]

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter((po) => {
        const poNum = (po.po_number || getPOField(po, 'poNumber') || '').toString().toLowerCase()
        const cust = (po.customer_name || getPOField(po, 'customerName') || po.customerName || '').toString().toLowerCase()
        const proj = (getPOField(po, 'projectDescription') || po.projectDescription || '').toString().toLowerCase()
        return poNum.includes(q) || cust.includes(q) || proj.includes(q)
      })
    }

    if (statusFilter) {
      filtered = filtered.filter((po) => {
        const status = po.status || 'draft'
        return status.toLowerCase() === statusFilter.toLowerCase()
      })
    }

    if (dateFrom) {
      filtered = filtered.filter((po) => {
        const poDate = po.issue_date || po.po_date || po.poDate || po.created_at
        const d = formatDate(poDate)
        return d && d >= dateFrom
      })
    }

    if (dateTo) {
      filtered = filtered.filter((po) => {
        const poDate = po.issue_date || po.po_date || po.poDate || po.created_at
        const d = formatDate(poDate)
        return d && d <= dateTo
      })
    }

    return filtered
  }, [poEntries, searchQuery, statusFilter, dateFrom, dateTo])

  const handleDelete = async (poId) => {
    const confirmed = await confirm({
      title: 'Delete PO entry?',
      message: 'This purchase order will be permanently removed.',
      confirmText: 'Delete PO',
      tone: 'danger',
    })
    if (!confirmed) return
    try {
      await poEntryService.deletePOEntry(poId)
      showToast('PO Entry deleted successfully', 'success')
      loadPOEntries()
    } catch (error) {
      console.error('Failed to delete PO entry:', error)
      showToast('Failed to delete PO entry. Please try again.', 'error')
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('')
    setDateFrom('')
    setDateTo('')
  }

  const hasActiveFilters = searchQuery || statusFilter || dateFrom || dateTo

  return (
    <div className="po-entry-index-page">
      <div className="po-entry-index-header">
        <div className="po-entry-index-header-content">
          <h1 className="po-entry-index-title">PO Entry</h1>
          <p className="po-entry-index-subtitle">Manage purchase orders and entries</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/po-entry/new')}
          className="po-entry-index-add-button"
        >
          <Plus className="po-entry-index-add-icon" />
          <span>New PO Entry</span>
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="po-entry-index-toolbar">
        <div className="po-entry-index-search-container">
          <Search className="po-entry-index-search-icon" />
          <input
            type="text"
            className="po-entry-index-search-input"
            placeholder="Search by PO Number, Customer, or Project Description..."
            value={searchQuery ?? ''}
            onChange={(e) => setSearchQuery(e.target.value ?? '')}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="po-entry-index-clear-search"
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`po-entry-index-filter-button ${showFilters ? 'active' : ''}`}
        >
          <Filter className="po-entry-index-filter-icon" />
          <span>Filters</span>
          {hasActiveFilters && <span className="po-entry-index-filter-badge">{[searchQuery, statusFilter, dateFrom, dateTo].filter(Boolean).length}</span>}
        </button>
        <button
          type="button"
          onClick={() => loadPOEntries()}
          disabled={loading}
          className="po-entry-index-filter-button"
          title="Refresh list"
        >
          <RefreshCw className="po-entry-index-filter-icon" size={18} style={loading ? { opacity: 0.7 } : undefined} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="po-entry-index-filters">
          <div className="po-entry-index-filter-group">
            <label className="po-entry-index-filter-label">Status</label>
            <select
              value={statusFilter ?? ''}
              onChange={(e) => setStatusFilter(e.target.value ?? '')}
              className="po-entry-index-filter-select"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="approved">Submitted</option>
              <option value="closed">Closed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="po-entry-index-filter-group">
            <label className="po-entry-index-filter-label">Date From</label>
            <DatePicker
              selected={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholderText="From Date"
              maxDate={dateTo || undefined}
            />
          </div>

          <div className="po-entry-index-filter-group">
            <label className="po-entry-index-filter-label">Date To</label>
            <DatePicker
              selected={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholderText="To Date"
              minDate={dateFrom || undefined}
            />
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="po-entry-index-clear-filters"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* PO Entries Table */}
      <div className="po-entry-index-content">
        {loading ? (
          <div className="po-entry-index-loading">
            <p>Loading PO entries...</p>
          </div>
        ) : filteredPOEntries.length > 0 ? (
          <div className="po-entry-index-table-wrapper">
            <table className="po-entry-index-table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>PO Date</th>
                  <th>Customer Name</th>
                  <th>Project Description</th>
                  <th>PO Value</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPOEntries.map((po) => (
                  <tr key={po.id}>
                    <td>
                      <span className="po-entry-index-po-number">{pickPONumber(po) || 'N/A'}</span>
                    </td>
                    <td>{formatDate(po.issue_date || po.po_date || po.poDate || po.created_at) || 'N/A'}</td>
                    <td>{getPOField(po, 'customerName') || po.customer_name || po.customerName || 'N/A'}</td>
                    <td className="po-entry-index-project-desc">
                      {(() => { const desc = getPOField(po, 'projectDescription') || po.projectDescription; return desc ? (desc.length > 50 ? `${desc.substring(0, 50)}...` : desc) : 'N/A'; })()}
                    </td>
                    <td>₹{getPOValue(po).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td>
                      <span className={`po-entry-index-status-badge po-entry-index-status-badge-${(po.status || 'draft').toLowerCase()}`}>
                        {formatStatusLabel(po.status)}
                      </span>
                    </td>
                    <td>
                      <div className="po-entry-index-actions">
                        <button
                          type="button"
                          className="po-entry-index-action-button"
                          onClick={() => navigate(`/po-entry/view/${po.id}`)}
                          title="View"
                        >
                          <Eye className="po-entry-index-action-icon" />
                        </button>
                        <button
                          type="button"
                          className="po-entry-index-action-button"
                          onClick={() => navigate(`/po-entry/edit/${po.id}`)}
                          title="Edit"
                        >
                          <Edit className="po-entry-index-action-icon" />
                        </button>
                        <button
                          type="button"
                          className="po-entry-index-action-button po-entry-index-action-button-delete"
                          onClick={() => handleDelete(po.id)}
                          title="Delete"
                        >
                          <Trash2 className="po-entry-index-action-icon" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="po-entry-index-empty">
            <p>
              {hasActiveFilters 
                ? 'No PO entries found matching your filters.' 
                : 'No PO entries found. Click "New PO Entry" to create one.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="po-entry-index-clear-filters-link"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
      <ConfirmDialog {...dialogProps} />
    </div>
  )
}

export default POEntryIndex
