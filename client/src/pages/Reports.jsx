import { useState, useEffect, useMemo } from 'react'
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Filter,
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  ShoppingCart,
  CreditCard,
  Users,
  Calendar,
  AlertCircle,
  PieChart,
  LineChart,
  FileSearch,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import DatePicker from '../components/DatePicker'
import * as reportsApi from '../api/reports'
import { useMasterData } from '../contexts/MasterDataContext'
import '../styles/Reports.css'

const REPORT_TYPES = [
  { id: 'sales', label: 'Sales Report', icon: TrendingUp },
  { id: 'purchase-orders', label: 'Purchase Order Report', icon: ShoppingCart },
  { id: 'invoices', label: 'Invoice Report', icon: Receipt },
  { id: 'payments', label: 'Payment Report', icon: CreditCard },
  { id: 'collections', label: 'Collection Report', icon: DollarSign },
  { id: 'outstanding', label: 'Outstanding & Overdue', icon: AlertCircle },
  { id: 'customers', label: 'Customer-wise Report', icon: Users },
  { id: 'projects', label: 'Project-wise Report', icon: FileSearch },
  { id: 'aging', label: 'Aging Report (30/60/90+)', icon: Calendar },
  { id: 'tax-gst', label: 'Tax & GST Report', icon: FileText },
  { id: 'commissions', label: 'Commission Report', icon: Users },
  { id: 'reconciliation', label: 'Bank Reconciliation', icon: CreditCard },
  { id: 'audit-log', label: 'Audit/Activity Log', icon: FileSearch },
]

const CHART_COLORS = ['#0f4c81', '#b8860b', '#0d9488', '#b45309', '#b91c1c', '#64748b']

function Reports() {
  const { getCustomers } = useMasterData()
  const customers = getCustomers() || []
  const [selectedReport, setSelectedReport] = useState('sales')
  const [reportData, setReportData] = useState(null)
  const [kpis, setKpis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState('summary') // summary, detailed, chart

  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    customerId: '',
    businessUnitId: '',
    segmentId: '',
    regionId: '',
    userId: '',
    status: '',
  })

  useEffect(() => {
    loadKPIs()
  }, [filters.dateFrom, filters.dateTo])

  useEffect(() => {
    if (selectedReport) {
      loadReport()
    }
  }, [selectedReport, filters])

  useEffect(() => {
    const handleDataUpdate = () => {
      loadKPIs()
      loadReport()
    }

    window.addEventListener('invoiceUpdated', handleDataUpdate)
    window.addEventListener('paymentUpdated', handleDataUpdate)
    window.addEventListener('paymentDeleted', handleDataUpdate)
    window.addEventListener('collectionPlanUpdated', handleDataUpdate)
    window.addEventListener('poEntryUpdated', handleDataUpdate)
    window.addEventListener('poUpdated', handleDataUpdate)
    window.addEventListener('poDeleted', handleDataUpdate)

    const onFocus = () => {
      loadKPIs()
      loadReport()
    }
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
  }, [selectedReport, filters])

  const loadKPIs = async () => {
    try {
      const response = await reportsApi.getKPIs({
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      })
      setKpis(response.data)
    } catch (error) {
      console.error('Failed to load KPIs:', error)
    }
  }

  const loadReport = async () => {
    setLoading(true)
    try {
      let response
      switch (selectedReport) {
        case 'sales':
          response = await reportsApi.getSalesReport(filters)
          break
        case 'purchase-orders':
          response = await reportsApi.getPOReport(filters)
          break
        case 'invoices':
          response = await reportsApi.getInvoiceReport(filters)
          break
        case 'payments':
          response = await reportsApi.getPaymentReport(filters)
          break
        case 'collections':
          response = await reportsApi.getCollectionReport(filters)
          break
        case 'outstanding':
          response = await reportsApi.getOutstandingReport(filters)
          break
        case 'customers':
          response = await reportsApi.getCustomerWiseReport(filters)
          break
        case 'projects':
          response = await reportsApi.getProjectWiseReport(filters)
          break
        case 'aging':
          response = await reportsApi.getAgingReport(filters)
          break
        case 'tax-gst':
          response = await reportsApi.getTaxGSTReport(filters)
          break
        case 'commissions':
          response = await reportsApi.getCommissionReport(filters)
          break
        case 'reconciliation':
          response = await reportsApi.getReconciliationReport(filters)
          break
        case 'audit-log':
          response = await reportsApi.getAuditLogReport(filters)
          break
        default:
          return
      }
      setReportData(response.data)
    } catch (error) {
      console.error('Failed to load report:', error)
      setReportData(null)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0)
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      customerId: '',
      businessUnitId: '',
      segmentId: '',
      regionId: '',
      userId: '',
      status: '',
    })
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== '')

  const exportToExcel = () => {
    if (!reportData?.data) return

    const ws = XLSX.utils.json_to_sheet(reportData.data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Report Data')

    if (reportData.summary) {
      const summaryData = Object.entries(reportData.summary).map(([key, value]) => ({
        Metric: key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()),
        Value: typeof value === 'number' ? value : JSON.stringify(value),
      }))
      const summaryWs = XLSX.utils.json_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary')
    }

    const reportName = REPORT_TYPES.find((r) => r.id === selectedReport)?.label || 'Report'
    XLSX.writeFile(wb, `${reportName}_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const exportToCSV = () => {
    if (!reportData?.data) return

    const ws = XLSX.utils.json_to_sheet(reportData.data)
    const csv = XLSX.utils.sheet_to_csv(ws)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${selectedReport}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToPDF = () => {
    if (!reportData?.data) return

    const doc = new jsPDF()
    const reportName = REPORT_TYPES.find((r) => r.id === selectedReport)?.label || 'Report'

    doc.setFontSize(18)
    doc.text(reportName, 14, 20)

    if (reportData.summary) {
      doc.setFontSize(12)
      doc.text('Summary', 14, 35)
      let yPos = 45
      Object.entries(reportData.summary).forEach(([key, value]) => {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())
        doc.setFontSize(10)
        doc.text(`${label}: ${typeof value === 'number' ? formatCurrency(value) : value}`, 14, yPos)
        yPos += 7
        if (yPos > 280) {
          doc.addPage()
          yPos = 20
        }
      })
    }

    if (reportData.data.length > 0) {
      const tableData = reportData.data.slice(0, 50).map((row) => {
        return Object.values(row).map((v) => {
          if (typeof v === 'number' && v > 1000) return formatCurrency(v)
          if (v instanceof Date) return formatDate(v)
          return String(v || '')
        })
      })

      const headers = Object.keys(reportData.data[0]).map((k) =>
        k.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())
      )

      doc.autoTable({
        head: [headers],
        body: tableData,
        startY: reportData.summary ? doc.lastAutoTable.finalY + 10 : 35,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [15, 76, 129] }, // NB Aurum primary
      })
    }

    doc.save(`${reportName}_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const chartData = useMemo(() => {
    if (!reportData?.data || viewMode !== 'chart') return []

    switch (selectedReport) {
      case 'sales':
      case 'invoices':
        return reportData.data
          .slice(0, 10)
          .map((row) => ({
            name: row.customer_name || row.invoice_number,
            amount: parseFloat(row.total_amount || 0),
            paid: parseFloat(row.amount_paid || 0),
            balance: parseFloat(row.balance || 0),
          }))
      case 'aging':
        return [
          { name: '0-30 days', value: reportData.summary?.age0_30 || 0 },
          { name: '31-60 days', value: reportData.summary?.age31_60 || 0 },
          { name: '61-90 days', value: reportData.summary?.age61_90 || 0 },
          { name: '90+ days', value: reportData.summary?.age90Plus || 0 },
        ]
      default:
        return reportData.data.slice(0, 10).map((row, idx) => ({
          name: `Item ${idx + 1}`,
          value: parseFloat(row.total_amount || row.amount || 0),
        }))
    }
  }, [reportData, viewMode, selectedReport])

  const currentReport = REPORT_TYPES.find((r) => r.id === selectedReport)

  return (
    <div className="reports-page">
      {/* Header */}
      <div className="reports-header">
        <div className="reports-header-content">
          <h1 className="reports-title">Reports & Analytics</h1>
          <p className="reports-subtitle">Comprehensive business intelligence and reporting</p>
        </div>
        <div className="reports-header-actions">
          <button
            type="button"
            onClick={loadReport}
            className="reports-action-button"
            disabled={loading}
          >
            <RefreshCw className={`reports-action-icon ${loading ? 'spin' : ''}`} />
            <span>Refresh</span>
          </button>
          {reportData && (
            <>
              <button type="button" onClick={exportToExcel} className="reports-action-button">
                <FileSpreadsheet className="reports-action-icon" />
                <span>Excel</span>
              </button>
              <button type="button" onClick={exportToCSV} className="reports-action-button">
                <Download className="reports-action-icon" />
                <span>CSV</span>
              </button>
              <button type="button" onClick={exportToPDF} className="reports-action-button">
                <FileText className="reports-action-icon" />
                <span>PDF</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPIs */}
      {kpis && (
        <div className="reports-kpis">
          <div className="reports-kpi-card">
            <div className="reports-kpi-icon">
              <Receipt />
            </div>
            <div className="reports-kpi-content">
              <div className="reports-kpi-label">Total Invoices</div>
              <div className="reports-kpi-value">{kpis.total_invoices || 0}</div>
            </div>
          </div>
          <div className="reports-kpi-card">
            <div className="reports-kpi-icon">
              <TrendingUp />
            </div>
            <div className="reports-kpi-content">
              <div className="reports-kpi-label">Total Invoiced</div>
              <div className="reports-kpi-value">{formatCurrency(kpis.total_invoiced || 0)}</div>
            </div>
          </div>
          <div className="reports-kpi-card">
            <div className="reports-kpi-icon">
              <DollarSign />
            </div>
            <div className="reports-kpi-content">
              <div className="reports-kpi-label">Total Collected</div>
              <div className="reports-kpi-value">{formatCurrency(kpis.total_collected || 0)}</div>
            </div>
          </div>
          <div className="reports-kpi-card">
            <div className="reports-kpi-icon">
              <AlertCircle />
            </div>
            <div className="reports-kpi-content">
              <div className="reports-kpi-label">Outstanding</div>
              <div className="reports-kpi-value">{formatCurrency(kpis.total_outstanding || 0)}</div>
            </div>
          </div>
          <div className="reports-kpi-card">
            <div className="reports-kpi-icon">
              <AlertCircle />
            </div>
            <div className="reports-kpi-content">
              <div className="reports-kpi-label">Overdue</div>
              <div className="reports-kpi-value">{formatCurrency(kpis.total_overdue || 0)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Report Type Selector */}
      <div className="reports-type-selector">
        {REPORT_TYPES.map((report) => {
          const Icon = report.icon
          return (
            <button
              key={report.id}
              type="button"
              onClick={() => setSelectedReport(report.id)}
              className={`reports-type-button ${selectedReport === report.id ? 'active' : ''}`}
            >
              <Icon className="reports-type-icon" />
              <span>{report.label}</span>
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <div className="reports-filters-section">
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`reports-filter-toggle ${showFilters ? 'active' : ''}`}
        >
          <Filter className="reports-filter-icon" />
          <span>Filters</span>
          {hasActiveFilters && <span className="reports-filter-badge">{Object.values(filters).filter(Boolean).length}</span>}
        </button>

        {showFilters && (
          <div className="reports-filters">
            <div className="reports-filter-row">
              <div className="reports-filter-group">
                <label>Date From</label>
                <DatePicker
                  selected={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  placeholderText="From Date"
                  maxDate={filters.dateTo || undefined}
                />
              </div>
              <div className="reports-filter-group">
                <label>Date To</label>
                <DatePicker
                  selected={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  placeholderText="To Date"
                  minDate={filters.dateFrom || undefined}
                />
              </div>
              <div className="reports-filter-group">
                <label>Customer</label>
                <select
                  value={filters.customerId}
                  onChange={(e) => handleFilterChange('customerId', e.target.value)}
                  className="reports-filter-select"
                >
                  <option value="">All Customers</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.values?.customerName || c.values?.name || c.name || 'Unnamed Customer'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="reports-filter-group">
                <label>Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="reports-filter-select"
                >
                  <option value="">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="open">Open</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            {hasActiveFilters && (
              <button type="button" onClick={clearFilters} className="reports-clear-filters">
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* View Mode Toggle */}
      <div className="reports-view-mode">
        <button
          type="button"
          onClick={() => setViewMode('summary')}
          className={`reports-view-button ${viewMode === 'summary' ? 'active' : ''}`}
        >
          Summary
        </button>
        <button
          type="button"
          onClick={() => setViewMode('detailed')}
          className={`reports-view-button ${viewMode === 'detailed' ? 'active' : ''}`}
        >
          Detailed
        </button>
        <button
          type="button"
          onClick={() => setViewMode('chart')}
          className={`reports-view-button ${viewMode === 'chart' ? 'active' : ''}`}
        >
          Charts
        </button>
      </div>

      {/* Report Content */}
      <div className="reports-content">
        {loading ? (
          <div className="reports-loading">Loading report data...</div>
        ) : !reportData ? (
          <div className="reports-empty">Select a report type to view data</div>
        ) : viewMode === 'summary' && reportData.summary ? (
          <div className="reports-summary">
            <h2 className="reports-summary-title">Summary</h2>
            <div className="reports-summary-grid">
              {Object.entries(reportData.summary).map(([key, value]) => (
                <div key={key} className="reports-summary-item">
                  <div className="reports-summary-label">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                  </div>
                  <div className="reports-summary-value">
                    {typeof value === 'number' && value > 1000
                      ? formatCurrency(value)
                      : typeof value === 'object'
                        ? JSON.stringify(value)
                        : value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : viewMode === 'chart' && chartData.length > 0 ? (
          <div className="reports-charts">
            {selectedReport === 'aging' ? (
              <ResponsiveContainer width="100%" height={400}>
                <RechartsPieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="amount" fill={CHART_COLORS[0]} name="Amount" />
                  <Bar dataKey="paid" fill={CHART_COLORS[2]} name="Paid" />
                  <Bar dataKey="balance" fill={CHART_COLORS[4]} name="Balance" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        ) : (
          <div className="reports-table-wrapper">
            <table className="reports-table">
              <thead>
                <tr>
                  {reportData.data.length > 0 &&
                    Object.keys(reportData.data[0]).map((key) => (
                      <th key={key}>
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {reportData.data.map((row, idx) => (
                  <tr key={idx}>
                    {Object.values(row).map((value, colIdx) => (
                      <td key={colIdx}>
                        {typeof value === 'number' && value > 1000
                          ? formatCurrency(value)
                          : value instanceof Date
                            ? formatDate(value)
                            : String(value || 'N/A')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {reportData.data.length === 0 && (
              <div className="reports-empty">No data available for the selected filters</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Reports

