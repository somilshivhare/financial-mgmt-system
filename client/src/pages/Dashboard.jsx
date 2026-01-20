import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownToLine,
  ArrowUpRight,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trash2,
  UploadCloud,
  BadgeIndianRupee,
  Percent,
  ShieldCheck,
  Package,
  AlertOctagon,
  Wallet,
} from 'lucide-react'
import { getDashboardStats, getTransactions } from '../api/finance'
import '../styles/Dashboard.css'

function Dashboard() {
  const [stats, setStats] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsResponse, transactionsResponse] = await Promise.all([
          getDashboardStats(),
          getTransactions()
        ])
        setStats(statsResponse.data)
        setTransactions(transactionsResponse.data.slice(0, 5))
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleRefresh = async () => {
    setLoading(true)
    try {
      const [statsResponse, transactionsResponse] = await Promise.all([
        getDashboardStats(),
        getTransactions()
      ])
      setStats(statsResponse.data)
      setTransactions(transactionsResponse.data.slice(0, 5))
    } catch (error) {
      console.error('Failed to refresh data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => alert('Export functionality will be implemented here')

  const handleDeleteAll = () => {
    if (window.confirm('Are you sure you want to delete all data? This action cannot be undone.')) {
      alert('Delete all functionality will be implemented here')
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const trend = (value, positive = true) => ({ text: `${positive ? '+' : ''}${value}%`, positive })

  const statCards = useMemo(() => [
    {
      id: 1,
      label: 'Total Invoice Amount',
      icon: BadgeIndianRupee,
      value: parseFloat(stats?.totalIncome || 0),
      trend: trend(12.5, true),
    },
    {
      id: 2,
      label: 'Total Tax',
      icon: Percent,
      value: parseFloat((stats?.totalIncome * 0.18 || 0).toFixed(2)),
      trend: trend(8.2, true),
    },
    {
      id: 3,
      label: 'Total Deductions',
      icon: ArrowDownToLine,
      value: parseFloat((stats?.totalExpense * 0.15 || 0).toFixed(2)),
      trend: trend(5.1, true),
    },
    {
      id: 4,
      label: 'Penalty / ID',
      icon: AlertOctagon,
      value: 0.00,
      trend: trend(0, false),
    },
    {
      id: 5,
      label: 'Freight',
      icon: Package,
      value: parseFloat((stats?.totalExpense * 0.10 || 0).toFixed(2)),
      trend: trend(3.2, true),
    },
    {
      id: 6,
      label: 'Insurance',
      icon: ShieldCheck,
      value: parseFloat((stats?.totalExpense * 0.08 || 0).toFixed(2)),
      trend: trend(2.1, true),
    },
    {
      id: 7,
      label: 'Bad Debts',
      icon: AlertOctagon,
      value: 0.00,
      trend: trend(0, false),
    },
    {
      id: 8,
      label: 'Net Receivables',
      icon: Wallet,
      value: parseFloat(stats?.balance || 0),
      trend: trend(15.3, true),
    },
  ], [stats])

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="dashboard-page">
      {/* Page Header */}
      <div className="dashboard-header">
        <div className="dashboard-header-content">
          <h1 className="dashboard-title">Sales Invoice Dashboard</h1>
          <p className="dashboard-subtitle">Comprehensive analytics and insights from your invoice data</p>
        </div>
        <div className="dashboard-header-actions">
          <button
            type="button"
            onClick={handleRefresh}
            className="dashboard-action-button"
          >
            <RefreshCw className="dashboard-action-icon" />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="dashboard-action-button dashboard-action-button-primary"
          >
            <ArrowUpRight className="dashboard-action-icon" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="dashboard-filters">
        <div className="dashboard-filters-left">
          <div className="dashboard-search">
            <Search className="dashboard-search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search invoices, customers..."
              className="dashboard-search-input"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="dashboard-filter-button"
          >
            <SlidersHorizontal className="dashboard-filter-icon" />
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
        </div>
        <div className="dashboard-filters-right">
          <button
            type="button"
            className="dashboard-action-button"
          >
            <UploadCloud className="dashboard-action-icon" />
            <span>Upload Files</span>
          </button>
          <button
            type="button"
            onClick={handleDeleteAll}
            className="dashboard-action-button dashboard-action-button-danger"
          >
            <Trash2 className="dashboard-action-icon" />
            <span>Delete All</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="dashboard-loading">
          <div className="dashboard-loading-text">Loading dashboard...</div>
        </div>
      ) : (
        <>
          {/* Statistics Cards */}
          <div className="dashboard-stats-grid">
            {statCards.map((card) => {
              const Icon = card.icon
              return (
                <div key={card.id} className="dashboard-stat-card">
                  <div className="dashboard-stat-card-header">
                    <div className="dashboard-stat-icon-wrapper">
                      <Icon className="dashboard-stat-icon" />
                    </div>
                    <div className="dashboard-stat-trend">
                      <ArrowUpRight className="dashboard-stat-trend-icon" />
                      {card.trend.text}
                    </div>
                  </div>
                  <div className="dashboard-stat-body">
                    <div className="dashboard-stat-label">{card.label}</div>
                    <div className="dashboard-stat-value">{formatCurrency(card.value)}</div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Recent Invoices Table */}
          <div className="dashboard-table-card">
            <div className="dashboard-table-header">
              <div className="dashboard-table-header-content">
                <div className="dashboard-table-section-label">RECENT ACTIVITY</div>
                <h2 className="dashboard-table-title">Latest Invoices</h2>
              </div>
            </div>
            <div className="dashboard-table-wrapper">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 5).map((t, idx) => (
                    <tr key={t.id || idx}>
                      <td className="dashboard-table-invoice-id">#{t.id}</td>
                      <td>{formatDate(t.date)}</td>
                      <td>{t.description}</td>
                      <td>{formatCurrency(t.amount)}</td>
                      <td>
                        <span className={`dashboard-table-status dashboard-table-status-${t.status?.toLowerCase() || 'completed'}`}>
                          {t.status || 'completed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="dashboard-empty">
                        No invoices found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Dashboard
