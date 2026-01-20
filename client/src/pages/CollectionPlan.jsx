import { useState, useEffect, useMemo } from 'react'
import { useMasterData } from '../contexts/MasterDataContext'
import * as collectionPlanService from '../services/collectionPlanService'
import '../styles/CollectionPlan.css'

function CollectionPlan() {
  const { getEmployees } = useMasterData()
  const [employees, setEmployees] = useState([])
  
  const [filters, setFilters] = useState({
    personId: '',
    businessUnit: '',
    month: null,
  })
  
  const [gridData, setGridData] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [editingPlan, setEditingPlan] = useState(null)
  
  useEffect(() => {
    setEmployees(getEmployees())
  }, [getEmployees])
  
  // Load collection plan data when filters change
  useEffect(() => {
    loadCollectionPlanData()
  }, [filters])
  
  // Listen for updates
  useEffect(() => {
    const handleUpdate = () => {
      loadCollectionPlanData()
    }
    
    window.addEventListener('collectionPlanUpdated', handleUpdate)
    window.addEventListener('paymentUpdated', handleUpdate)
    window.addEventListener('invoiceUpdated', handleUpdate)
    
    return () => {
      window.removeEventListener('collectionPlanUpdated', handleUpdate)
      window.removeEventListener('paymentUpdated', handleUpdate)
      window.removeEventListener('invoiceUpdated', handleUpdate)
    }
  }, [filters])
  
  const loadCollectionPlanData = () => {
    const data = collectionPlanService.getCollectionPlanData(filters)
    setGridData(data)
    
    const analyticsData = collectionPlanService.getCollectionAnalytics(filters)
    setAnalytics(analyticsData)
  }
  
  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }))
  }
  
  const handlePlanFinalisedChange = (customerId, value) => {
    const planData = {
      customerId,
      businessUnit: filters.businessUnit || 'ALL',
      month: filters.month ? filters.month.toISOString().split('T')[0] : null,
      planFinalised: parseFloat(value || 0),
    }
    
    collectionPlanService.saveCollectionPlan(planData)
    loadCollectionPlanData()
  }
  
  const handleMonthChange = (e) => {
    const value = e.target.value
    setFilters((prev) => ({
      ...prev,
      month: value ? new Date(value + '-01') : null,
    }))
  }
  
  // Get person options for filter
  const personOptions = useMemo(() => {
    const roles = [
      'Sales Manager',
      'Sales Head',
      'Project Manager',
      'Project Head',
      'Collection Head',
      'Business Head',
      'Collection Agent',
      'Collection Incharge',
    ]
    
    return employees.map((emp) => ({
      id: emp.id,
      name: emp.name || emp.nameOfEmployee,
      role: emp.designation || 'Employee',
    }))
  }, [employees])
  
  // Calculate totals
  const totals = useMemo(() => {
    return {
      totalOutstanding: gridData.reduce((sum, row) => sum + parseFloat(row.totalOutstanding || 0), 0),
      notDue: gridData.reduce((sum, row) => sum + parseFloat(row.notDue || 0), 0),
      overdue: gridData.reduce((sum, row) => sum + parseFloat(row.overdue || 0), 0),
      dueThisMonth: gridData.reduce((sum, row) => sum + parseFloat(row.dueThisMonth || 0), 0),
      totalDueForPlan: gridData.reduce((sum, row) => sum + parseFloat(row.totalDueForPlan || 0), 0),
      planFinalised: gridData.reduce((sum, row) => sum + parseFloat(row.planFinalised || 0), 0),
      received: gridData.reduce((sum, row) => sum + parseFloat(row.received || 0), 0),
      statutoryDeductions: gridData.reduce((sum, row) => sum + parseFloat(row.statutoryDeductions || 0), 0),
      balance: gridData.reduce((sum, row) => sum + parseFloat(row.balance || 0), 0),
    }
  }, [gridData])
  
  const overallTargetAchieved = totals.planFinalised > 0 
    ? ((totals.received + totals.statutoryDeductions) / totals.planFinalised * 100).toFixed(2)
    : '0.00'
  
  return (
    <div className="collection-plan-page">
      {/* Page Header */}
      <div className="collection-plan-header">
        <div className="collection-plan-header-content">
          <h1 className="collection-plan-title">Collection Plan</h1>
          <p className="collection-plan-subtitle">Person-wise, Customer-wise, Business Unit-wise Receivables Dashboard</p>
        </div>
      </div>

      {/* Filters */}
      <div className="collection-plan-filters">
        <div className="collection-plan-filter-group">
          <label htmlFor="personFilter" className="collection-plan-filter-label">
            Person-wise Filter
          </label>
          <select
            id="personFilter"
            value={filters.personId}
            onChange={(e) => handleFilterChange('personId', e.target.value)}
            className="collection-plan-filter-select"
          >
            <option value="">All Persons</option>
            {personOptions.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name} ({person.role})
              </option>
            ))}
          </select>
        </div>
        
        <div className="collection-plan-filter-group">
          <label htmlFor="businessUnitFilter" className="collection-plan-filter-label">
            Business Unit
          </label>
          <select
            id="businessUnitFilter"
            value={filters.businessUnit}
            onChange={(e) => handleFilterChange('businessUnit', e.target.value)}
            className="collection-plan-filter-select"
          >
            <option value="">All Business Units</option>
            <option value="MAIN">MAIN</option>
            <option value="UNIT1">UNIT1</option>
            <option value="UNIT2">UNIT2</option>
            <option value="UNIT3">UNIT3</option>
          </select>
        </div>
        
        <div className="collection-plan-filter-group">
          <label htmlFor="monthFilter" className="collection-plan-filter-label">
            Planning Period (Month)
          </label>
          <input
            type="month"
            id="monthFilter"
            value={filters.month ? `${filters.month.getFullYear()}-${String(filters.month.getMonth() + 1).padStart(2, '0')}` : ''}
            onChange={handleMonthChange}
            className="collection-plan-filter-input"
          />
        </div>
      </div>

      {/* Collection Plan Grid */}
      <div className="collection-plan-grid-section">
        <h2 className="collection-plan-section-title">Collection Plan Grid</h2>
        <div className="collection-plan-grid-wrapper">
          <table className="collection-plan-grid">
            <thead>
              <tr>
                <th>Collection Incharge</th>
                <th>Customer Name</th>
                <th>Segment</th>
                <th>Package Name</th>
                <th>Total Outstanding</th>
                <th>Not Due</th>
                <th>Overdue</th>
                <th>Due for this Month</th>
                <th>Total Due for Plan</th>
                <th>Plan Finalised</th>
                <th>Received</th>
                <th>Statutory Deductions</th>
                <th>Balance</th>
                <th>Target Achieved (%)</th>
              </tr>
            </thead>
            <tbody>
              {gridData.map((row) => (
                <tr key={row.id}>
                  <td>{row.collectionIncharge}</td>
                  <td>{row.customerName}</td>
                  <td>{row.segment}</td>
                  <td>{row.packageName}</td>
                  <td className="collection-plan-number">₹{row.totalOutstanding}</td>
                  <td className="collection-plan-number">₹{row.notDue}</td>
                  <td className="collection-plan-number collection-plan-overdue">₹{row.overdue}</td>
                  <td className="collection-plan-number">₹{row.dueThisMonth}</td>
                  <td className="collection-plan-number">₹{row.totalDueForPlan}</td>
                  <td>
                    <input
                      type="number"
                      value={row.planFinalised}
                      onChange={(e) => handlePlanFinalisedChange(row.customerId, e.target.value)}
                      className="collection-plan-input-editable"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="collection-plan-number collection-plan-readonly">₹{row.received}</td>
                  <td className="collection-plan-number collection-plan-readonly">₹{row.statutoryDeductions}</td>
                  <td className="collection-plan-number collection-plan-calculated">₹{row.balance}</td>
                  <td className="collection-plan-number collection-plan-calculated">
                    {row.targetAchieved}%
                  </td>
                </tr>
              ))}
              {gridData.length > 0 && (
                <tr className="collection-plan-totals-row">
                  <td colSpan="4" className="collection-plan-totals-label">TOTALS</td>
                  <td className="collection-plan-number collection-plan-totals">₹{totals.totalOutstanding.toFixed(2)}</td>
                  <td className="collection-plan-number collection-plan-totals">₹{totals.notDue.toFixed(2)}</td>
                  <td className="collection-plan-number collection-plan-totals collection-plan-overdue">₹{totals.overdue.toFixed(2)}</td>
                  <td className="collection-plan-number collection-plan-totals">₹{totals.dueThisMonth.toFixed(2)}</td>
                  <td className="collection-plan-number collection-plan-totals">₹{totals.totalDueForPlan.toFixed(2)}</td>
                  <td className="collection-plan-number collection-plan-totals">₹{totals.planFinalised.toFixed(2)}</td>
                  <td className="collection-plan-number collection-plan-totals">₹{totals.received.toFixed(2)}</td>
                  <td className="collection-plan-number collection-plan-totals">₹{totals.statutoryDeductions.toFixed(2)}</td>
                  <td className="collection-plan-number collection-plan-totals">₹{totals.balance.toFixed(2)}</td>
                  <td className="collection-plan-number collection-plan-totals">{overallTargetAchieved}%</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Analytics Section */}
      {analytics && (
        <div className="collection-plan-analytics">
          <h2 className="collection-plan-section-title">Collection Analytics</h2>
          
          <div className="collection-plan-analytics-grid">
            {/* Planned vs Collected vs Balance */}
            <div className="collection-plan-analytics-card">
              <h3 className="collection-plan-analytics-card-title">Planned vs Collected vs Balance</h3>
              <div className="collection-plan-analytics-bars">
                <div className="collection-plan-analytics-bar-group">
                  <div className="collection-plan-analytics-bar-label">Planned</div>
                  <div className="collection-plan-analytics-bar">
                    <div 
                      className="collection-plan-analytics-bar-fill collection-plan-analytics-bar-planned"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div className="collection-plan-analytics-bar-value">
                    ₹{parseFloat(analytics.plannedVsCollected.planned).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="collection-plan-analytics-bar-group">
                  <div className="collection-plan-analytics-bar-label">Collected</div>
                  <div className="collection-plan-analytics-bar">
                    <div 
                      className="collection-plan-analytics-bar-fill collection-plan-analytics-bar-collected"
                      style={{ 
                        width: analytics.plannedVsCollected.planned > 0 
                          ? `${(analytics.plannedVsCollected.collected / analytics.plannedVsCollected.planned * 100)}%`
                          : '0%'
                      }}
                    />
                  </div>
                  <div className="collection-plan-analytics-bar-value">
                    ₹{parseFloat(analytics.plannedVsCollected.collected).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="collection-plan-analytics-bar-group">
                  <div className="collection-plan-analytics-bar-label">Balance</div>
                  <div className="collection-plan-analytics-bar">
                    <div 
                      className="collection-plan-analytics-bar-fill collection-plan-analytics-bar-balance"
                      style={{ 
                        width: analytics.plannedVsCollected.planned > 0 
                          ? `${(Math.abs(analytics.plannedVsCollected.balance) / analytics.plannedVsCollected.planned * 100)}%`
                          : '0%'
                      }}
                    />
                  </div>
                  <div className="collection-plan-analytics-bar-value">
                    ₹{parseFloat(analytics.plannedVsCollected.balance).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Target Achieved by Person */}
            <div className="collection-plan-analytics-card">
              <h3 className="collection-plan-analytics-card-title">Target Achieved (%) by Person</h3>
              <div className="collection-plan-analytics-list">
                {Object.entries(analytics.targetByPerson).map(([person, data]) => (
                  <div key={person} className="collection-plan-analytics-item">
                    <div className="collection-plan-analytics-item-label">{person}</div>
                    <div className="collection-plan-analytics-progress">
                      <div 
                        className="collection-plan-analytics-progress-fill"
                        style={{ width: `${Math.min(data.targetAchieved, 100)}%` }}
                      />
                    </div>
                    <div className="collection-plan-analytics-item-value">{data.targetAchieved.toFixed(2)}%</div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Overdue vs Not Due */}
            <div className="collection-plan-analytics-card">
              <h3 className="collection-plan-analytics-card-title">Overdue vs Not Due Distribution</h3>
              <div className="collection-plan-analytics-pie">
                <div className="collection-plan-analytics-pie-segment collection-plan-analytics-pie-overdue"
                  style={{
                    width: '50%',
                    background: '#fee2e2',
                    color: '#991b1b',
                  }}
                >
                  <div className="collection-plan-analytics-pie-label">Overdue</div>
                  <div className="collection-plan-analytics-pie-value">
                    ₹{parseFloat(analytics.overdueVsNotDue.overdue).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="collection-plan-analytics-pie-segment collection-plan-analytics-pie-notdue"
                  style={{
                    width: '50%',
                    background: '#d1fae5',
                    color: '#065f46',
                  }}
                >
                  <div className="collection-plan-analytics-pie-label">Not Due</div>
                  <div className="collection-plan-analytics-pie-value">
                    ₹{parseFloat(analytics.overdueVsNotDue.notDue).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CollectionPlan

