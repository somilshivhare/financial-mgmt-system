import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Target,
  Calendar,
  Wallet,
  FileText,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Plus,
  Users,
  Package,
  Bell,
  BarChart3,
  LineChart,
  PieChart,
  ArrowRight,
  Search,
  ChevronDown,
  Filter,
} from 'lucide-react'
import * as dashboardApi from '../api/dashboard'
import { useNotifications } from '../hooks/useNotifications'
import { useMasterData } from '../contexts/MasterDataContext'
import {
  LineChart as RechartsLineChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts'
import '../styles/Dashboard.css'

const formatCurrency = (value, currency = 'INR') => {
  const currencySymbols = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
  }
  const symbol = currencySymbols[currency] || currency
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value).replace(currency, symbol)
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const getUserRole = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    return user.role || 'viewer'
  } catch {
    return 'viewer'
  }
}

const getQuickActions = (role) => {
  const actions = []
  
  if (['admin', 'finance', 'operations'].includes(role)) {
    actions.push({ id: 'invoice', label: 'Create Invoice', icon: FileText, path: '/invoices/new' })
  }
  
  if (['admin', 'finance'].includes(role)) {
    actions.push({ id: 'payment', label: 'Record Payment', icon: CreditCard, path: '/payments/new' })
  }
  
  if (['admin', 'operations', 'sales'].includes(role)) {
    actions.push({ id: 'customer', label: 'Add Customer', icon: Users, path: '/master-data/new/customer-profile' })
  }
  
  if (['admin', 'operations'].includes(role)) {
    actions.push({ id: 'po', label: 'Create PO', icon: Package, path: '/po-entry/new' })
  }
  
  return actions
}

function Dashboard() {
  const navigate = useNavigate()
  const userRole = getUserRole()
  const { notifications, unreadCount: notificationUnreadCount, markAsRead: markNotificationRead } = useNotifications()
  const { getCustomers } = useMasterData()
  
  const [dashboardData, setDashboardData] = useState(null)
  const [analyticsData, setAnalyticsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dateRange, setDateRange] = useState('all')
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [customerFilter, setCustomerFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  const dateFilters = useMemo(() => {
    const now = new Date()
    const filters = { dateFrom: null, dateTo: null }
    
    switch (dateRange) {
      case 'today':
        filters.dateFrom = now.toISOString().split('T')[0]
        filters.dateTo = now.toISOString().split('T')[0]
        break
      case 'week':
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        filters.dateFrom = weekStart.toISOString().split('T')[0]
        filters.dateTo = now.toISOString().split('T')[0]
        break
      case 'month':
        filters.dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
        filters.dateTo = now.toISOString().split('T')[0]
        break
      case 'quarter':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
        filters.dateFrom = quarterStart.toISOString().split('T')[0]
        filters.dateTo = now.toISOString().split('T')[0]
        break
      case 'year':
        filters.dateFrom = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
        filters.dateTo = now.toISOString().split('T')[0]
        break
      default:
        break
    }
    
    return filters
  }, [dateRange])

  const loadDashboard = async (retryCount = 0) => {
    const maxRetries = 1 // Only retry once
    
    try {
      setError(null)
      
      const [dashboardResponse, analyticsResponse] = await Promise.allSettled([
        dashboardApi.getDashboardData(dateFilters).catch(err => {
          console.error('[Dashboard] Failed to load dashboard data:', err)
          return { success: false, data: null }
        }),
        dashboardApi.getDashboardAnalytics(dateFilters).catch(err => {
          console.error('[Dashboard] Failed to load analytics:', err)
          return { success: false, data: null }
        }),
      ])
      
      const dashboardData = dashboardResponse.status === 'fulfilled' 
        ? (dashboardResponse.value?.data || dashboardResponse.value || null)
        : null
      const analyticsData = analyticsResponse.status === 'fulfilled'
        ? (analyticsResponse.value?.data || analyticsResponse.value || null)
        : null
      
      if (dashboardData) setDashboardData(dashboardData)
      if (analyticsData) setAnalyticsData(analyticsData)
      
      const allFailed = [dashboardResponse, analyticsResponse]
        .every(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value?.data))
      
      if (allFailed && retryCount < maxRetries) {
        setTimeout(() => {
          loadDashboard(retryCount + 1)
        }, 2000)
        return
      }
      
      if (allFailed) {
        setError('Unable to load dashboard data. Please refresh the page.')
      }
    } catch (err) {
      console.error('[Dashboard] Unexpected error loading dashboard:', err)
      if (retryCount === 0) {
        setError('Failed to load dashboard data. Some features may be unavailable.')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [dateRange])

  useEffect(() => {
    const handleDataUpdate = () => {
      setRefreshing(true)
      loadDashboard()
    }

    window.addEventListener('invoiceUpdated', handleDataUpdate)
    window.addEventListener('paymentUpdated', handleDataUpdate)
    window.addEventListener('paymentDeleted', handleDataUpdate)
    window.addEventListener('collectionPlanUpdated', handleDataUpdate)
    window.addEventListener('poEntryUpdated', handleDataUpdate)
    window.addEventListener('poUpdated', handleDataUpdate)
    window.addEventListener('poDeleted', handleDataUpdate)

    const onFocus = () => loadDashboard()
    window.addEventListener('focus', onFocus)

    return () => {
      window.removeEventListener('invoiceUpdated', handleDataUpdate)
      window.removeEventListener('paymentUpdated', handleDataUpdate)
      window.removeEventListener('paymentDeleted', handleDataUpdate)
      window.removeEventListener('collectionPlanUpdated', handleDataUpdate)
      window.removeEventListener('poEntryUpdated', handleDataUpdate)
      window.removeEventListener('poUpdated', handleDataUpdate)
      window.removeEventListener('poDeleted', handleDataUpdate)
      window.removeEventListener('focus', onFocus)
    }
  }, [dateRange])

  const handleRefresh = () => {
    setRefreshing(true)
    loadDashboard()
  }

  const currency = dashboardData?.kpis?.currency || 'INR'
  const kpis = dashboardData?.kpis || {}
  const invoiceInsights = dashboardData?.invoiceInsights || {}
  const paymentsCollections = dashboardData?.paymentsCollections || {}
  const quickActions = getQuickActions(userRole)
  const customers = getCustomers()

  const filteredRecentInvoices = useMemo(() => {
    let filtered = invoiceInsights.recent || []
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(invoice => 
        invoice.invoice_number?.toLowerCase().includes(query) ||
        invoice.customer_name?.toLowerCase().includes(query)
      )
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter)
    }
    
    if (customerFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.customer_id === customerFilter)
    }
    
    return filtered
  }, [invoiceInsights.recent, searchQuery, statusFilter, customerFilter])

  const chartColors = {
    primary: '#0f4c81',
    secondary: '#b8860b',
    success: '#0d9488',
    warning: '#b45309',
    danger: '#b91c1c',
    gray: '#64748b',
  }

  const statusColors = {
    draft: '#64748b',
    open: '#0f4c81',
    paid: '#0d9488',
    overdue: '#b91c1c',
    cancelled: '#94a3b8',
  }

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          <RefreshCw className="dashboard-loading-spinner" />
          <div className="dashboard-loading-text">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-error">
          <AlertTriangle className="dashboard-error-icon" />
          <div className="dashboard-error-message">{error}</div>
          <button onClick={handleRefresh} className="dashboard-error-retry">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-header-content">
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">Business control panel and financial overview</p>
        </div>
        <div className="dashboard-header-actions">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="dashboard-action-button"
            aria-label="Toggle filters"
          >
            <Filter className="dashboard-action-icon" />
            <span>Filters</span>
          </button>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="dashboard-date-select"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="dashboard-action-button"
            aria-label="Refresh dashboard"
          >
            <RefreshCw className={`dashboard-action-icon ${refreshing ? 'spinning' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters Card */}
      {showFilters && (
        <div className="dashboard-filter-card">
          <div className="dashboard-filter-content">
            <div className="dashboard-filter-search">
              <Search className="dashboard-filter-search-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search invoices, customers..."
                className="dashboard-filter-search-input"
              />
            </div>
            <div className="dashboard-filter-select-wrap">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="dashboard-filter-select"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="open">Open</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <ChevronDown className="dashboard-filter-select-chevron" />
            </div>
            <div className="dashboard-filter-select-wrap">
              <select
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                className="dashboard-filter-select"
              >
                <option value="all">All Customers</option>
                {customers.map((customer) => {
                  const name = customer.values?.customerName || customer.values?.name || 'Unnamed Customer'
                  return (
                    <option key={customer.id} value={customer.id}>
                      {name}
                    </option>
                  )
                })}
              </select>
              <ChevronDown className="dashboard-filter-select-chevron" />
            </div>
            {(searchQuery || statusFilter !== 'all' || customerFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('all')
                  setCustomerFilter('all')
                }}
                className="dashboard-filter-clear"
                aria-label="Clear filters"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Financial KPIs */}
      <div className="dashboard-section">
        <h2 className="dashboard-section-title">Financial Overview</h2>
        <div className="dashboard-kpi-grid">
          <div className="dashboard-kpi-card">
            <div className="dashboard-kpi-header">
              <div className="dashboard-kpi-icon-container" style={{ backgroundColor: `${chartColors.primary}15` }}>
                <DollarSign className="dashboard-kpi-icon" style={{ color: chartColors.primary }} />
              </div>
              <span className="dashboard-kpi-label">Total Outstanding</span>
            </div>
            <div className="dashboard-kpi-value">{formatCurrency(kpis.totalOutstanding || 0, currency)}</div>
            <div className="dashboard-kpi-trend">
              <TrendingUp className="dashboard-kpi-trend-icon" />
              <span>Active receivables</span>
            </div>
          </div>

          <div className="dashboard-kpi-card">
            <div className="dashboard-kpi-header">
              <div className="dashboard-kpi-icon-container" style={{ backgroundColor: `${chartColors.success}15` }}>
                <CheckCircle2 className="dashboard-kpi-icon" style={{ color: chartColors.success }} />
              </div>
              <span className="dashboard-kpi-label">Total Collected</span>
            </div>
            <div className="dashboard-kpi-value">{formatCurrency(kpis.totalCollected || 0, currency)}</div>
            <div className="dashboard-kpi-trend">
              <TrendingUp className="dashboard-kpi-trend-icon" />
              <span>Payments received</span>
            </div>
          </div>

          <div className="dashboard-kpi-card">
            <div className="dashboard-kpi-header">
              <div className="dashboard-kpi-icon-container" style={{ backgroundColor: `${chartColors.danger}15` }}>
                <AlertTriangle className="dashboard-kpi-icon" style={{ color: chartColors.danger }} />
              </div>
              <span className="dashboard-kpi-label">Total Overdue</span>
            </div>
            <div className="dashboard-kpi-value">{formatCurrency(kpis.totalOverdue || 0, currency)}</div>
            <div className="dashboard-kpi-trend">
              <TrendingDown className="dashboard-kpi-trend-icon" />
              <span>Requires attention</span>
            </div>
          </div>

          <div className="dashboard-kpi-card">
            <div className="dashboard-kpi-header">
              <div className="dashboard-kpi-icon-container" style={{ backgroundColor: `${chartColors.warning}15` }}>
                <Target className="dashboard-kpi-icon" style={{ color: chartColors.warning }} />
              </div>
              <span className="dashboard-kpi-label">Collection Target</span>
            </div>
            <div className="dashboard-kpi-value">{kpis.collectionTargetAchieved || 0}%</div>
            <div className="dashboard-kpi-trend">
              <Target className="dashboard-kpi-trend-icon" />
              <span>Target achieved</span>
            </div>
          </div>

          <div className="dashboard-kpi-card">
            <div className="dashboard-kpi-header">
              <div className="dashboard-kpi-icon-container" style={{ backgroundColor: `${chartColors.secondary}15` }}>
                <Calendar className="dashboard-kpi-icon" style={{ color: chartColors.secondary }} />
              </div>
              <span className="dashboard-kpi-label">Dues This Month</span>
            </div>
            <div className="dashboard-kpi-value">{formatCurrency(kpis.duesCurrentMonth || 0, currency)}</div>
            <div className="dashboard-kpi-trend">
              <Calendar className="dashboard-kpi-trend-icon" />
              <span>Current month</span>
            </div>
          </div>

          <div className="dashboard-kpi-card">
            <div className="dashboard-kpi-header">
              <div className="dashboard-kpi-icon-container" style={{ backgroundColor: `${chartColors.primary}15` }}>
                <Wallet className="dashboard-kpi-icon" style={{ color: chartColors.primary }} />
              </div>
              <span className="dashboard-kpi-label">Total Balance</span>
            </div>
            <div className="dashboard-kpi-value">{formatCurrency(kpis.totalBalance || 0, currency)}</div>
            <div className="dashboard-kpi-trend">
              <Wallet className="dashboard-kpi-trend-icon" />
              <span>All invoices</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <div className="dashboard-section">
          <h2 className="dashboard-section-title">Quick Actions</h2>
          <div className="dashboard-quick-actions">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.id}
                  onClick={() => navigate(action.path)}
                  className="dashboard-quick-action-button"
                >
                  <Icon className="dashboard-quick-action-icon" />
                  <span>{action.label}</span>
                  <ArrowRight className="dashboard-quick-action-arrow" />
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="dashboard-section">
        <h2 className="dashboard-section-title">Analytics</h2>
        <div className="dashboard-charts-grid">
          {/* Monthly Invoices vs Collections */}
          <div className="dashboard-chart-card">
            <h3 className="dashboard-chart-title">Monthly Invoices vs Collections</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsLineChart data={analyticsData?.monthlyInvoicesVsCollections || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  formatter={(value) => formatCurrency(value, currency)}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="invoices"
                  name="Invoices"
                  stroke={chartColors.primary}
                  strokeWidth={2}
                  dot={{ fill: chartColors.primary, r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="collections"
                  name="Collections"
                  stroke={chartColors.success}
                  strokeWidth={2}
                  dot={{ fill: chartColors.success, r: 4 }}
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>

          {/* Outstanding Trends */}
          <div className="dashboard-chart-card">
            <h3 className="dashboard-chart-title">Outstanding Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData?.outstandingTrends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  formatter={(value) => formatCurrency(value, currency)}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Bar dataKey="outstanding" fill={chartColors.warning} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Realization Percentages */}
        <div className="dashboard-chart-card dashboard-chart-full">
          <h3 className="dashboard-chart-title">Realization Percentages</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsLineChart data={analyticsData?.realizationPercentages || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                formatter={(value, name) => {
                  if (name === 'realizationPercent') return `${value.toFixed(2)}%`
                  return formatCurrency(value, currency)
                }}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="invoiced"
                name="Invoiced"
                stroke={chartColors.primary}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="collected"
                name="Collected"
                stroke={chartColors.success}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="realizationPercent"
                name="Realization %"
                stroke={chartColors.warning}
                strokeWidth={2}
                yAxisId={1}
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Invoice Insights and Recent Invoices */}
      <div className="dashboard-section">
        <div className="dashboard-two-column">
          {/* Invoice Status Breakdown */}
          <div className="dashboard-card">
            <h3 className="dashboard-card-title">Invoice Status</h3>
            <div className="dashboard-status-list">
              {(invoiceInsights.byStatus || []).map((status) => (
                <div key={status.status} className="dashboard-status-item">
                  <div
                    className="dashboard-status-indicator"
                    style={{ backgroundColor: statusColors[status.status] || chartColors.gray }}
                  />
                  <span className="dashboard-status-label">{status.status || 'Unknown'}</span>
                  <span className="dashboard-status-count">{status.count || 0}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Invoices */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h3 className="dashboard-card-title">Recent Invoices</h3>
              <button
                onClick={() => navigate('/invoices')}
                className="dashboard-card-link"
                aria-label="View all invoices"
              >
                View All <ArrowRight className="dashboard-card-link-icon" />
              </button>
            </div>
            <div className="dashboard-table-container">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecentInvoices.slice(0, 5).map((invoice) => (
                    <tr key={invoice.id}>
                      <td>
                        <button
                          onClick={() => navigate(`/invoices/${invoice.id}`)}
                          className="dashboard-table-link"
                        >
                          {invoice.invoice_number}
                        </button>
                      </td>
                      <td>{invoice.customer_name || 'N/A'}</td>
                      <td>{formatCurrency(invoice.total_amount || 0, currency)}</td>
                      <td>
                        <span
                          className="dashboard-table-status"
                          style={{ backgroundColor: statusColors[invoice.status] || chartColors.gray }}
                        >
                          {invoice.status || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredRecentInvoices.length === 0 && (
                    <tr>
                      <td colSpan={4} className="dashboard-table-empty">
                        {searchQuery || statusFilter !== 'all' || customerFilter !== 'all' 
                          ? 'No invoices match the filters' 
                          : 'No invoices found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Payments & Collections Summary */}
      <div className="dashboard-section">
        <div className="dashboard-two-column">
          {/* Upcoming Follow-ups */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h3 className="dashboard-card-title">Upcoming Follow-ups</h3>
              <Clock className="dashboard-card-icon" />
            </div>
            <div className="dashboard-list">
              {(paymentsCollections.upcomingFollowUps || []).slice(0, 5).map((item) => (
                <div key={item.id} className="dashboard-list-item">
                  <div className="dashboard-list-item-content">
                    <div className="dashboard-list-item-title">{item.invoice_number}</div>
                    <div className="dashboard-list-item-subtitle">{item.customer_name || 'N/A'}</div>
                  </div>
                  <div className="dashboard-list-item-meta">
                    <div className="dashboard-list-item-value">{formatCurrency(item.balance || 0, currency)}</div>
                    <div className="dashboard-list-item-date">
                      Due in {item.days_until_due || 0} days
                    </div>
                  </div>
                </div>
              ))}
              {(!paymentsCollections.upcomingFollowUps || paymentsCollections.upcomingFollowUps.length === 0) && (
                <div className="dashboard-list-empty">No upcoming follow-ups</div>
              )}
            </div>
          </div>

          {/* Overdue Highlights */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h3 className="dashboard-card-title">Overdue Highlights</h3>
              <AlertTriangle className="dashboard-card-icon" style={{ color: chartColors.danger }} />
            </div>
            <div className="dashboard-list">
              {(paymentsCollections.overdueHighlights || []).slice(0, 5).map((item) => (
                <div key={item.id} className="dashboard-list-item dashboard-list-item-overdue">
                  <div className="dashboard-list-item-content">
                    <div className="dashboard-list-item-title">{item.invoice_number}</div>
                    <div className="dashboard-list-item-subtitle">{item.customer_name || 'N/A'}</div>
                  </div>
                  <div className="dashboard-list-item-meta">
                    <div className="dashboard-list-item-value">{formatCurrency(item.balance || 0, currency)}</div>
                    <div className="dashboard-list-item-date dashboard-list-item-date-overdue">
                      {item.days_overdue || 0} days overdue
                    </div>
                  </div>
                </div>
              ))}
              {(!paymentsCollections.overdueHighlights || paymentsCollections.overdueHighlights.length === 0) && (
                <div className="dashboard-list-empty">No overdue invoices</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="dashboard-section">
        <div className="dashboard-two-column">
          {/* Real-time Notifications */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h3 className="dashboard-card-title">
                Notifications
                {notificationUnreadCount > 0 && (
                  <span className="dashboard-badge">{notificationUnreadCount}</span>
                )}
              </h3>
              <Bell className="dashboard-card-icon" />
            </div>
            <div className="dashboard-list">
              {(notifications || []).slice(0, 5).map((notification) => (
                <div
                  key={notification.id}
                  className={`dashboard-list-item ${notification.status === 'new' ? 'dashboard-list-item-unread' : ''}`}
                  onClick={() => markNotificationRead(notification.id)}
                >
                  <div className="dashboard-list-item-content">
                    <div className="dashboard-list-item-title">{notification.title || notification.message}</div>
                    <div className="dashboard-list-item-subtitle">
                      {notification.type || 'Notification'} • {formatDate(notification.created_at)}
                    </div>
                  </div>
                </div>
              ))}
              {(!notifications || notifications.length === 0) && (
                <div className="dashboard-list-empty">No notifications</div>
              )}
            </div>
            <button
              onClick={() => navigate('/notifications')}
              className="dashboard-card-footer-link"
            >
              View All Notifications <ArrowRight className="dashboard-card-link-icon" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
