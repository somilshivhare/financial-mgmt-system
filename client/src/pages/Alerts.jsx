import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  CheckCircle2,
  CircleAlert,
  Filter,
  Info,
  Search,
  ShieldAlert,
} from 'lucide-react'
import '../styles/Alerts.css'

const CATEGORIES = ['All', 'Payments', 'Overdue Invoices', 'System', 'Compliance', 'Security']
const READ_FILTERS = ['All', 'Unread', 'Read']
const DATE_FILTERS = [
  { value: 'all', label: 'All time' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
]

const MOCK_ALERTS = [
  {
    id: 'ALT-10021',
    category: 'Overdue Invoices',
    severity: 'Critical',
    title: 'Invoice overdue beyond threshold',
    message: 'Invoice is overdue by 18 days. Collection follow-up is recommended.',
    references: { invoiceNo: 'INV-2024-0198', customer: 'Acme Corp.' },
    createdAt: '2024-01-18T09:22:00Z',
    read: false,
  },
  {
    id: 'ALT-10018',
    category: 'Payments',
    severity: 'Warning',
    title: 'Payment pending confirmation',
    message: 'Payment was recorded but bank confirmation is pending.',
    references: { invoiceNo: 'INV-2024-0189', customer: 'Northwind', paymentRef: 'UTR-928173' },
    createdAt: '2024-01-16T12:10:00Z',
    read: false,
  },
  {
    id: 'ALT-10012',
    category: 'Compliance',
    severity: 'Info',
    title: 'GST invoice details incomplete',
    message: 'Some tax fields are missing. Review invoice to ensure compliance-ready output.',
    references: { invoiceNo: 'INV-2024-0164' },
    createdAt: '2024-01-10T08:45:00Z',
    read: true,
  },
  {
    id: 'ALT-10008',
    category: 'Security',
    severity: 'Warning',
    title: 'New sign-in detected',
    message: 'A new session was created from a different device. Review active sessions if unexpected.',
    references: { user: 'user@example.com', device: 'Edge on Windows' },
    createdAt: '2024-01-06T18:02:00Z',
    read: false,
  },
  {
    id: 'ALT-10003',
    category: 'System',
    severity: 'Info',
    title: 'Background processing completed',
    message: 'Master data refresh completed successfully.',
    references: { job: 'Master Data Sync' },
    createdAt: '2024-01-02T06:12:00Z',
    read: true,
  },
  {
    id: 'ALT-09998',
    category: 'Payments',
    severity: 'Critical',
    title: 'Payment failed',
    message: 'Payment attempt failed. Verify payment details and retry.',
    references: { invoiceNo: 'INV-2023-0991', customer: 'Globex' },
    createdAt: '2023-12-28T14:30:00Z',
    read: true,
  },
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
  const s = (sev || '').toLowerCase()
  if (s === 'critical') return { icon: ShieldAlert, className: 'sev-critical', label: 'Critical' }
  if (s === 'warning') return { icon: CircleAlert, className: 'sev-warning', label: 'Warning' }
  return { icon: Info, className: 'sev-info', label: 'Info' }
}

export default function Alerts() {
  const navigate = useNavigate()
  const [alerts, setAlerts] = useState(MOCK_ALERTS)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [readFilter, setReadFilter] = useState('All')
  const [dateRange, setDateRange] = useState('30d')
  const [showFilters, setShowFilters] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return alerts
      .filter((a) => withinRange(a.createdAt, dateRange))
      .filter((a) => (category === 'All' ? true : a.category === category))
      .filter((a) => (readFilter === 'All' ? true : readFilter === 'Read' ? a.read : !a.read))
      .filter((a) => {
        if (!q) return true
        const ref = Object.values(a.references || {}).join(' ').toLowerCase()
        return (
          a.id.toLowerCase().includes(q) ||
          a.title.toLowerCase().includes(q) ||
          a.message.toLowerCase().includes(q) ||
          ref.includes(q)
        )
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [alerts, category, readFilter, dateRange, search])

  const counts = useMemo(() => {
    const unread = alerts.filter((a) => !a.read).length
    return { total: alerts.length, unread }
  }, [alerts])

  const markAsRead = (id) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)))
  }

  const markAllAsRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })))
  }

  const onView = (a) => {
    // Keep navigation conservative: go to invoice if present, else to subscription/profile as applicable.
    if (a.references?.invoiceNo) {
      navigate('/invoices')
      return
    }
    if (a.category === 'Payments') navigate('/payments')
    else if (a.category === 'Security') navigate('/profile')
    else navigate('/dashboard')
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
              <div className="alerts-kpi-value">{counts.unread}</div>
            </div>
          </div>
          <button type="button" className="alerts-btn alerts-btn-secondary" onClick={markAllAsRead}>
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
          <div className="alerts-list-meta">{filtered.length} shown</div>
        </div>

        <div className="alerts-list">
          {filtered.length === 0 ? (
            <div className="alerts-empty">No alerts match your filters.</div>
          ) : (
            filtered.map((a) => {
              const sev = severityMeta(a.severity)
              const SevIcon = sev.icon
              return (
                <div key={a.id} className={`alerts-row ${a.read ? 'is-read' : 'is-unread'}`}>
                  <div className="alerts-row-left">
                    <div className={`alerts-severity ${sev.className}`} aria-label={`Severity: ${sev.label}`}>
                      <SevIcon />
                    </div>

                    <div className="alerts-row-main">
                      <div className="alerts-row-top">
                        <div className="alerts-row-title">
                          <span className="alerts-row-id">{a.id}</span>
                          <span className="alerts-row-text">{a.title}</span>
                        </div>
                        <div className="alerts-row-badges">
                          <span className={`alerts-badge alerts-badge-category`}>{a.category}</span>
                          <span className={`alerts-badge ${sev.className}`}>{sev.label}</span>
                          {!a.read && <span className="alerts-badge alerts-badge-unread">Unread</span>}
                        </div>
                      </div>

                      <div className="alerts-row-msg">{a.message}</div>

                      <div className="alerts-row-ref">
                        {a.references?.invoiceNo && <span className="alerts-ref">Invoice: <strong>{a.references.invoiceNo}</strong></span>}
                        {a.references?.poNo && <span className="alerts-ref">PO: <strong>{a.references.poNo}</strong></span>}
                        {a.references?.customer && <span className="alerts-ref">Customer: <strong>{a.references.customer}</strong></span>}
                        {a.references?.paymentRef && <span className="alerts-ref">Payment Ref: <strong>{a.references.paymentRef}</strong></span>}
                        {a.references?.device && <span className="alerts-ref">Device: <strong>{a.references.device}</strong></span>}
                        {a.references?.job && <span className="alerts-ref">Job: <strong>{a.references.job}</strong></span>}
                      </div>

                      <div className="alerts-row-time">
                        {new Date(a.createdAt).toLocaleString('en-IN')}
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
                      disabled={a.read}
                    >
                      Mark as read
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


