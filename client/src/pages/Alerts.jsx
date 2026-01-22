import { useMemo, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  CheckCircle2,
  CircleAlert,
  Filter,
  Info,
  Search,
  ShieldAlert,
  Loader2,
} from 'lucide-react'
import '../styles/Alerts.css'
import * as alertsApi from '../api/alerts'
import { useNotifications } from '../hooks/useNotifications'

const CATEGORIES = ['All', 'Payments', 'Overdue Invoices', 'System', 'Compliance', 'Security']
const READ_FILTERS = ['All', 'Unread', 'Read']
const DATE_FILTERS = [
  { value: 'all', label: 'All time' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
]

function withinRange(dateStr, range) {
  if (range === 'all') return true
  const now = new Date()
  const d = new Date(dateStr)
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  return d >= cutoff
}

function severityMeta(sev) {
  const s = (sev || 'info').toLowerCase()
  if (s === 'critical') return { icon: ShieldAlert, className: 'sev-critical', label: 'Critical' }
  if (s === 'warning') return { icon: CircleAlert, className: 'sev-warning', label: 'Warning' }
  return { icon: Info, className: 'sev-info', label: 'Info' }
}

function getCategoryFromAlertType(alertType) {
  if (alertType?.includes('payment')) return 'Payments'
  if (alertType?.includes('overdue') || alertType?.includes('invoice')) return 'Overdue Invoices'
  if (alertType?.includes('subscription') || alertType?.includes('system')) return 'System'
  if (alertType?.includes('compliance') || alertType?.includes('master_data')) return 'Compliance'
  if (alertType?.includes('security') || alertType?.includes('failed')) return 'Security'
  return 'System'
}

export default function Alerts() {
  const navigate = useNavigate()
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [readFilter, setReadFilter] = useState('All')
  const [dateRange, setDateRange] = useState('30d')
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  
  const { refreshUnreadCount } = useNotifications()

  // Load alerts from API
  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true)
      const startDate = dateRange === 'all' ? '' : (() => {
        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
        const date = new Date()
        date.setDate(date.getDate() - days)
        return date.toISOString().split('T')[0]
      })()
      
      const params = {
        page,
        pageSize: 50,
        search: search.trim() || undefined,
        status: readFilter === 'All' ? undefined : readFilter === 'Read' ? 'read' : 'new',
        startDate: startDate || undefined,
      }
      
      const response = await alertsApi.getAllAlerts(params)
      if (response?.data) {
        setAlerts(response.data.data || [])
        setTotal(response.data.total || 0)
      }
    } catch (error) {
      console.error('Failed to load alerts:', error)
    } finally {
      setLoading(false)
    }
  }, [page, search, readFilter, dateRange])

  // Load unread count
  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await alertsApi.getUnreadCount()
      if (response?.data?.count !== undefined) {
        setUnreadCount(response.data.count)
      }
    } catch (error) {
      console.error('Failed to load unread count:', error)
    }
  }, [])

  // Initial load
  useEffect(() => {
    loadAlerts()
    loadUnreadCount()
  }, [loadAlerts, loadUnreadCount])

  const filtered = useMemo(() => {
    return alerts
      .filter((a) => withinRange(a.created_at, dateRange))
      .filter((a) => {
        if (category === 'All') return true
        const alertCategory = getCategoryFromAlertType(a.alert_type)
        return alertCategory === category
      })
      .filter((a) => {
        if (readFilter === 'All') return true
        if (readFilter === 'Read') return a.status === 'read'
        return a.status === 'new'
      })
      .filter((a) => {
        if (!search.trim()) return true
        const q = search.trim().toLowerCase()
        return (
          a.id?.toLowerCase().includes(q) ||
          a.message?.toLowerCase().includes(q) ||
          a.alert_type?.toLowerCase().includes(q) ||
          a.invoice_number?.toLowerCase().includes(q) ||
          a.payment_reference?.toLowerCase().includes(q) ||
          a.po_number?.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }, [alerts, category, readFilter, dateRange, search])

  const markAsRead = async (id) => {
    try {
      await alertsApi.markAlertAsRead(id)
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'read', read_at: new Date().toISOString() } : a))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
      refreshUnreadCount()
    } catch (error) {
      console.error('Failed to mark alert as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await alertsApi.markAllAlertsAsRead()
      setAlerts((prev) =>
        prev.map((a) => ({ ...a, status: 'read', read_at: new Date().toISOString() }))
      )
      setUnreadCount(0)
      refreshUnreadCount()
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const dismissAlert = async (id) => {
    try {
      await alertsApi.dismissAlert(id)
      setAlerts((prev) => prev.filter((a) => a.id !== id))
    } catch (error) {
      console.error('Failed to dismiss alert:', error)
    }
  }

  const onView = (a) => {
    if (a.link_url) {
      navigate(a.link_url)
      return
    }
    if (a.invoice_id) {
      navigate('/invoices')
      return
    }
    if (a.payment_id) {
      navigate('/payments')
      return
    }
    if (a.po_id) {
      navigate('/po')
      return
    }
    if (a.collection_plan_id) {
      navigate('/collection-plans')
      return
    }
    navigate('/dashboard')
  }

  return (
    <div className="alerts-page">
      <div className="alerts-header">
        <div className="alerts-header-content">
          <h1 className="alerts-title">Alerts & Notifications</h1>
          <p className="alerts-subtitle">Operational alerts generated by the system for daily review.</p>
        </div>

        <div className="alerts-header-actions">
          <div className="alerts-kpi" aria-label="Unread alerts">
            <Bell className="alerts-kpi-icon" />
            <div>
              <div className="alerts-kpi-label">Unread</div>
              <div className="alerts-kpi-value">{unreadCount}</div>
            </div>
          </div>
          <button
            type="button"
            className="alerts-btn alerts-btn-secondary"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <CheckCircle2 className="alerts-btn-icon" />
            Mark all read
          </button>
        </div>
      </div>

      <div className="alerts-filters">
        <div className="alerts-filters-left">
          <div className="alerts-search">
            <Search className="alerts-search-icon" />
            <input
              className="alerts-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search alerts, invoice numbers, customers…"
            />
          </div>

          <button
            type="button"
            className="alerts-btn alerts-btn-ghost"
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
          >
            <Filter className="alerts-btn-icon" />
            Filters
          </button>
        </div>

        <div className="alerts-filters-right">
          <select className="alerts-select" value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
            {DATE_FILTERS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>
      </div>

      {showFilters && (
        <div className="alerts-filter-panel" role="region" aria-label="Alert filters">
          <div className="alerts-filter-grid">
            <div className="alerts-filter-field">
              <label className="alerts-label" htmlFor="cat">Category</label>
              <select id="cat" className="alerts-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="alerts-filter-field">
              <label className="alerts-label" htmlFor="read">Status</label>
              <select id="read" className="alerts-select" value={readFilter} onChange={(e) => setReadFilter(e.target.value)}>
                {READ_FILTERS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="alerts-filter-actions">
            <button
              type="button"
              className="alerts-btn alerts-btn-secondary"
              onClick={() => {
                setCategory('All')
                setReadFilter('All')
                setDateRange('30d')
                setSearch('')
              }}
            >
              Reset
            </button>
          </div>
        </div>
      )}

      <div className="alerts-list-card">
        <div className="alerts-list-head">
          <div className="alerts-list-title">Alerts</div>
          <div className="alerts-list-meta">
            {loading ? (
              <Loader2 className="alerts-loading-icon" size={16} />
            ) : (
              `${filtered.length} shown${total > filtered.length ? ` of ${total}` : ''}`
            )}
          </div>
        </div>

        <div className="alerts-list">
          {loading ? (
            <div className="alerts-empty">
              <Loader2 className="alerts-loading-icon" size={24} />
              <p>Loading alerts...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="alerts-empty">No alerts match your filters.</div>
          ) : (
            filtered.map((a) => {
              const sev = severityMeta(a.severity)
              const SevIcon = sev.icon
              const isRead = a.status === 'read'
              return (
                <div key={a.id} className={`alerts-row ${isRead ? 'is-read' : 'is-unread'}`}>
                  <div className="alerts-row-left">
                    <div className={`alerts-severity ${sev.className}`} aria-label={`Severity: ${sev.label}`}>
                      <SevIcon />
                    </div>

                    <div className="alerts-row-main">
                      <div className="alerts-row-top">
                        <div className="alerts-row-title">
                          <span className="alerts-row-id">{a.id?.substring(0, 8)}</span>
                          <span className="alerts-row-text">{a.message || 'Alert'}</span>
                        </div>
                        <div className="alerts-row-badges">
                          <span className={`alerts-badge alerts-badge-category`}>
                            {getCategoryFromAlertType(a.alert_type)}
                          </span>
                          <span className={`alerts-badge ${sev.className}`}>{sev.label}</span>
                          {!isRead && <span className="alerts-badge alerts-badge-unread">Unread</span>}
                        </div>
                      </div>

                      <div className="alerts-row-msg">{a.message}</div>

                      <div className="alerts-row-ref">
                        {a.invoice_number && (
                          <span className="alerts-ref">Invoice: <strong>{a.invoice_number}</strong></span>
                        )}
                        {a.po_number && (
                          <span className="alerts-ref">PO: <strong>{a.po_number}</strong></span>
                        )}
                        {a.payment_reference && (
                          <span className="alerts-ref">Payment Ref: <strong>{a.payment_reference}</strong></span>
                        )}
                      </div>

                      <div className="alerts-row-time">
                        {new Date(a.created_at).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  <div className="alerts-row-actions">
                    <button type="button" className="alerts-btn alerts-btn-ghost" onClick={() => onView(a)}>
                      View
                    </button>
                    <button
                      type="button"
                      className="alerts-btn alerts-btn-secondary"
                      onClick={() => markAsRead(a.id)}
                      disabled={isRead}
                    >
                      Mark as read
                    </button>
                    <button
                      type="button"
                      className="alerts-btn alerts-btn-ghost"
                      onClick={() => dismissAlert(a.id)}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
