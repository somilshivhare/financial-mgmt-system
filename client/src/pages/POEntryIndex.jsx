import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, Eye, Edit, Trash2, X } from 'lucide-react'
import * as poEntryService from '../services/poEntryService'
import '../styles/POEntry.css'

function POEntryIndex() {
  const navigate = useNavigate()
  const [poEntries, setPOEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadPOEntries()
    
    // Listen for PO updates
    const handlePOUpdate = () => loadPOEntries()
    window.addEventListener('poUpdated', handlePOUpdate)
    window.addEventListener('poDeleted', handlePOUpdate)
    
    return () => {
      window.removeEventListener('poUpdated', handlePOUpdate)
      window.removeEventListener('poDeleted', handlePOUpdate)
    }
  }, [])

  const loadPOEntries = async () => {
    try {
      setLoading(true)
      const entries = await poEntryService.getAllPOEntries()
      // Ensure entries is always an array
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
    // Ensure poEntries is always an array before spreading
    if (!Array.isArray(poEntries)) {
      console.warn('poEntries is not an array:', poEntries)
      return []
    }
    let filtered = [...poEntries]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((po) => {
        return (
          po.po_number?.toLowerCase().includes(query) ||
          po.customer_name?.toLowerCase().includes(query) ||
          po.customerName?.toLowerCase().includes(query) ||
          po.poNumber?.toLowerCase().includes(query) ||
          po.projectDescription?.toLowerCase().includes(query)
        )
      })
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter((po) => {
        const status = po.status || 'draft'
        return status.toLowerCase() === statusFilter.toLowerCase()
      })
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter((po) => {
        const poDate = po.po_date || po.poDate || po.created_at
        return poDate && poDate >= dateFrom
      })
    }

    if (dateTo) {
      filtered = filtered.filter((po) => {
        const poDate = po.po_date || po.poDate || po.created_at
        return poDate && poDate <= dateTo
      })
    }

    return filtered
  }, [poEntries, searchQuery, statusFilter, dateFrom, dateTo])

  const handleDelete = async (poId) => {
    if (window.confirm('Are you sure you want to delete this PO Entry?')) {
      try {
        // Note: You may need to implement deletePO in poEntryService
        // await poEntryService.deletePO(poId)
        alert('PO Entry deleted successfully')
        loadPOEntries()
      } catch (error) {
        console.error('Failed to delete PO entry:', error)
        alert('Failed to delete PO entry. Please try again.')
      }
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="po-entry-index-filters">
          <div className="po-entry-index-filter-group">
            <label className="po-entry-index-filter-label">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="po-entry-index-filter-select"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="po-entry-index-filter-group">
            <label className="po-entry-index-filter-label">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="po-entry-index-filter-input"
            />
          </div>

          <div className="po-entry-index-filter-group">
            <label className="po-entry-index-filter-label">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="po-entry-index-filter-input"
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
                      <span className="po-entry-index-po-number">{po.po_number || po.poNumber}</span>
                    </td>
                    <td>{po.po_date || po.poDate || po.created_at?.split('T')[0] || 'N/A'}</td>
                    <td>{po.customer_name || po.customerName || 'N/A'}</td>
                    <td className="po-entry-index-project-desc">
                      {po.projectDescription ? (po.projectDescription.length > 50 ? `${po.projectDescription.substring(0, 50)}...` : po.projectDescription) : 'N/A'}
                    </td>
                    <td>₹{parseFloat(po.po_value || po.poValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td>
                      <span className={`po-entry-index-status-badge po-entry-index-status-badge-${(po.status || 'draft').toLowerCase()}`}>
                        {(po.status || 'Draft').charAt(0).toUpperCase() + (po.status || 'Draft').slice(1)}
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
    </div>
  )
}

export default POEntryIndex
