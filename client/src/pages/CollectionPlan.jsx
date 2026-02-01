import { useState, useEffect, useMemo } from 'react'
import { useMasterData } from '../contexts/MasterDataContext'
import { useToast } from '../contexts/ToastContext'
import { usePersistedFormState } from '../hooks/usePersistedFormState'
import * as collectionPlanService from '../services/collectionPlanService'
import DatePicker from '../components/DatePicker'
import '../styles/CollectionPlan.css'

function CollectionPlan() {
  const { getEmployees } = useMasterData()
  const { showToast } = useToast()
  const [employees, setEmployees] = useState([])
  
  const { values: filterValues, setValues: setFilterValues } = usePersistedFormState({
    pathKey: 'collection-plan',
    defaultValues: { personId: '', businessUnit: '', monthIso: null },
  })
  const filters = useMemo(() => ({
    personId: filterValues.personId ?? '',
    businessUnit: filterValues.businessUnit ?? '',
    month: filterValues.monthIso ? new Date(filterValues.monthIso) : null,
  }), [filterValues.personId, filterValues.businessUnit, filterValues.monthIso])
  
  const [gridData, setGridData] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [editingPlan, setEditingPlan] = useState(null)
  
  useEffect(() => {
    setEmployees(getEmployees())
  }, [getEmployees])
  
  // Load collection plan data when filters change
  useEffect(() => {
    loadCollectionPlanData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.personId, filters.businessUnit, filters.month])
  
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
  
  const loadCollectionPlanData = async () => {
    try {
      const filterParams = {
        personId: filters.personId || undefined,
        businessUnit: filters.businessUnit || undefined,
        month: filters.month ? filters.month.toISOString().split('T')[0].substring(0, 7) : undefined,
      }
      
      // Remove undefined values
      Object.keys(filterParams).forEach(key => 
        filterParams[key] === undefined && delete filterParams[key]
      )
      
      const data = await collectionPlanService.getCollectionPlanData(filterParams)
      setGridData(data || [])
    } catch (e) {
      console.error('Failed to load collection plan data:', e)
      setGridData([])
    }

    try {
      const filterParams = {
        personId: filters.personId || undefined,
        businessUnit: filters.businessUnit || undefined,
        month: filters.month ? filters.month.toISOString().split('T')[0].substring(0, 7) : undefined,
      }
      
      // Remove undefined values
      Object.keys(filterParams).forEach(key => 
        filterParams[key] === undefined && delete filterParams[key]
      )
      
      const analyticsData = await collectionPlanService.getCollectionAnalytics(filterParams)
      setAnalytics(analyticsData)
    } catch (e) {
      console.error('Failed to load collection analytics:', e)
      setAnalytics({
        plannedVsCollected: { planned: 0, collected: 0, balance: 0 },
        targetByPerson: {},
        overdueVsNotDue: { overdue: 0, notDue: 0 },
      })
    }
  }
  
  const handleFilterChange = (name, value) => {
    setFilterValues((prev) => ({
      ...prev,
      ...(name === 'month' ? { monthIso: value ? (value.toISOString?.() ?? null) : null } : { [name]: value }),
    }))
  }
  
  const handlePlanFinalisedChange = async (customerId, value) => {
    try {
      // Find invoice for this customer to link the collection plan
      const customerInvoices = gridData.filter(row => row.customerId === customerId)
      if (customerInvoices.length === 0) {
        console.warn('No invoice found for customer:', customerId)
        return
      }
      
      // Use the first invoice for this customer (or we could aggregate)
      // For now, we'll need to get the actual invoice ID from the grid data
      // Since gridData doesn't have invoice IDs, we'll need to fetch them
      // For simplicity, let's create/update collection plan with customer reference
      const planData = {
        customerId,
        businessUnit: filters.businessUnit || undefined,
        month: filters.month ? filters.month.toISOString().split('T')[0].substring(0, 7) : undefined,
        planFinalised: parseFloat(value || 0),
        expectedAmount: parseFloat(value || 0),
        targetDate: filters.month ? filters.month.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        status: 'planned',
      }
      
      await collectionPlanService.saveCollectionPlan(planData)
      // Reload data after a short delay
      setTimeout(() => {
        loadCollectionPlanData()
      }, 500)
    } catch (error) {
      console.error('Failed to save collection plan:', error)
      showToast('Failed to save collection plan. Please try again.', 'error')
    }
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
          <DatePicker
            id="monthFilter"
            selected={filters.month ? filters.month.toISOString().split('T')[0] : ''}
            onChange={(e) => handleMonthChange(e)}
            showMonthYearPicker
            placeholderText="Select month"
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
              {gridData.length === 0 ? (
                <tr>
                  <td colSpan="14" className="collection-plan-empty-state">
                    <div className="collection-plan-empty-message">
                      No collection plan data available. Please adjust your filters or create collection plans.
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {gridData.map((row, index) => (
                    <tr key={row.id || row.customerId || index}>
                      <td className="collection-plan-text">{row.collectionIncharge || '-'}</td>
                      <td className="collection-plan-text">{row.customerName || '-'}</td>
                      <td className="collection-plan-text">{row.segment || '-'}</td>
                      <td className="collection-plan-text">{row.packageName || '-'}</td>
                      <td className="collection-plan-number">
                        ₹{parseFloat(row.totalOutstanding || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="collection-plan-number">
                        ₹{parseFloat(row.notDue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="collection-plan-number collection-plan-overdue">
                        ₹{parseFloat(row.overdue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="collection-plan-number">
                        ₹{parseFloat(row.dueThisMonth || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="collection-plan-number">
                        ₹{parseFloat(row.totalDueForPlan || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td>
                        <input
                          type="number"
                          value={row.planFinalised || ''}
                          onChange={(e) => handlePlanFinalisedChange(row.customerId || row.id, e.target.value)}
                          className="collection-plan-input-editable"
                          step="0.01"
                          placeholder="0.00"
                          min="0"
                        />
                      </td>
                      <td className="collection-plan-number collection-plan-readonly">
                        ₹{parseFloat(row.received || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="collection-plan-number collection-plan-readonly">
                        ₹{parseFloat(row.statutoryDeductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="collection-plan-number collection-plan-calculated">
                        ₹{parseFloat(row.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="collection-plan-number collection-plan-calculated">
                        {parseFloat(row.targetAchieved || 0).toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                  <tr className="collection-plan-totals-row">
                    <td colSpan="4" className="collection-plan-totals-label">TOTALS</td>
                    <td className="collection-plan-number collection-plan-totals">
                      ₹{totals.totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="collection-plan-number collection-plan-totals">
                      ₹{totals.notDue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="collection-plan-number collection-plan-totals collection-plan-overdue">
                      ₹{totals.overdue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="collection-plan-number collection-plan-totals">
                      ₹{totals.dueThisMonth.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="collection-plan-number collection-plan-totals">
                      ₹{totals.totalDueForPlan.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="collection-plan-number collection-plan-totals">
                      ₹{totals.planFinalised.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="collection-plan-number collection-plan-totals">
                      ₹{totals.received.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="collection-plan-number collection-plan-totals">
                      ₹{totals.statutoryDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="collection-plan-number collection-plan-totals">
                      ₹{totals.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="collection-plan-number collection-plan-totals">{overallTargetAchieved}%</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="collection-plan-analytics">
        <h2 className="collection-plan-section-title">Collection Analytics</h2>
        
        {analytics && (
          <div className="collection-plan-analytics-grid">
            {/* Planned vs Collected vs Balance - Enhanced Bar Chart */}
            <div className="collection-plan-analytics-card">
              <h3 className="collection-plan-analytics-card-title">Planned vs Collected vs Balance</h3>
              <div className="collection-plan-analytics-chart-container">
                <div className="collection-plan-analytics-bars">
                  <div className="collection-plan-analytics-bar-group">
                    <div className="collection-plan-analytics-bar-header">
                      <div className="collection-plan-analytics-bar-label">Planned</div>
                      <div className="collection-plan-analytics-bar-value">
                        ₹{parseFloat(analytics.plannedVsCollected.planned || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="collection-plan-analytics-bar">
                      <div 
                        className="collection-plan-analytics-bar-fill collection-plan-analytics-bar-planned"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                  <div className="collection-plan-analytics-bar-group">
                    <div className="collection-plan-analytics-bar-header">
                      <div className="collection-plan-analytics-bar-label">Collected</div>
                      <div className="collection-plan-analytics-bar-value">
                        ₹{parseFloat(analytics.plannedVsCollected.collected || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="collection-plan-analytics-bar">
                      <div 
                        className="collection-plan-analytics-bar-fill collection-plan-analytics-bar-collected"
                        style={{ 
                          width: analytics.plannedVsCollected.planned > 0 
                            ? `${Math.min((analytics.plannedVsCollected.collected / analytics.plannedVsCollected.planned * 100), 100)}%`
                            : '0%'
                        }}
                      />
                    </div>
                    <div className="collection-plan-analytics-bar-percentage">
                      {analytics.plannedVsCollected.planned > 0 
                        ? ((analytics.plannedVsCollected.collected / analytics.plannedVsCollected.planned * 100).toFixed(2))
                        : '0.00'}%
                    </div>
                  </div>
                  <div className="collection-plan-analytics-bar-group">
                    <div className="collection-plan-analytics-bar-header">
                      <div className="collection-plan-analytics-bar-label">Balance</div>
                      <div className="collection-plan-analytics-bar-value">
                        ₹{parseFloat(analytics.plannedVsCollected.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="collection-plan-analytics-bar">
                      <div 
                        className="collection-plan-analytics-bar-fill collection-plan-analytics-bar-balance"
                        style={{ 
                          width: analytics.plannedVsCollected.planned > 0 
                            ? `${Math.min((Math.abs(analytics.plannedVsCollected.balance) / analytics.plannedVsCollected.planned * 100), 100)}%`
                            : '0%'
                        }}
                      />
                    </div>
                    <div className="collection-plan-analytics-bar-percentage">
                      {analytics.plannedVsCollected.planned > 0 
                        ? ((Math.abs(analytics.plannedVsCollected.balance) / analytics.plannedVsCollected.planned * 100).toFixed(2))
                        : '0.00'}%
                    </div>
                  </div>
                </div>
                <div className="collection-plan-analytics-summary">
                  <div className="collection-plan-analytics-summary-item">
                    <span className="collection-plan-analytics-summary-label">Collection Efficiency:</span>
                    <span className="collection-plan-analytics-summary-value">
                      {analytics.plannedVsCollected.planned > 0 
                        ? ((analytics.plannedVsCollected.collected / analytics.plannedVsCollected.planned * 100).toFixed(2))
                        : '0.00'}%
                    </span>
                  </div>
                  <div className="collection-plan-analytics-summary-item">
                    <span className="collection-plan-analytics-summary-label">Pending Collection:</span>
                    <span className="collection-plan-analytics-summary-value">
                      ₹{parseFloat(Math.abs(analytics.plannedVsCollected.balance || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Target Achieved by Person - Enhanced Progress Chart */}
            <div className="collection-plan-analytics-card">
              <h3 className="collection-plan-analytics-card-title">Target Achieved (%) by Person</h3>
              <div className="collection-plan-analytics-chart-container">
                {Object.keys(analytics.targetByPerson).length > 0 ? (
                  <div className="collection-plan-analytics-list">
                    {Object.entries(analytics.targetByPerson)
                      .sort((a, b) => b[1].targetAchieved - a[1].targetAchieved)
                      .map(([person, data]) => {
                        const percentage = Math.min(data.targetAchieved || 0, 100);
                        const isOverTarget = data.targetAchieved > 100;
                        return (
                          <div key={person} className="collection-plan-analytics-item">
                            <div className="collection-plan-analytics-item-header">
                              <div className="collection-plan-analytics-item-label">{person}</div>
                              <div className="collection-plan-analytics-item-stats">
                                <span className="collection-plan-analytics-item-stat">
                                  Planned: ₹{parseFloat(data.planned || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span className="collection-plan-analytics-item-stat">
                                  Collected: ₹{parseFloat(data.collected || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                            <div className="collection-plan-analytics-progress">
                              <div 
                                className={`collection-plan-analytics-progress-fill ${isOverTarget ? 'collection-plan-analytics-progress-over' : ''}`}
                                style={{ width: `${percentage}%` }}
                              />
                              {isOverTarget && (
                                <div 
                                  className="collection-plan-analytics-progress-fill collection-plan-analytics-progress-excess"
                                  style={{ width: `${Math.min(data.targetAchieved - 100, 20)}%`, marginLeft: '100%' }}
                                />
                              )}
                            </div>
                            <div className="collection-plan-analytics-item-footer">
                              <div className={`collection-plan-analytics-item-value ${isOverTarget ? 'collection-plan-analytics-item-value-over' : ''}`}>
                                {data.targetAchieved.toFixed(2)}%
                              </div>
                              {isOverTarget && (
                                <div className="collection-plan-analytics-item-badge">
                                  Over Target!
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="collection-plan-analytics-empty">
                    <p>No person-wise target data available. Collection plans need to be created and assigned to persons.</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Overdue vs Not Due - Enhanced Pie/Doughnut Chart */}
            <div className="collection-plan-analytics-card">
              <h3 className="collection-plan-analytics-card-title">Overdue vs Not Due Distribution</h3>
              <div className="collection-plan-analytics-chart-container">
                {analytics.overdueVsNotDue.overdue > 0 || analytics.overdueVsNotDue.notDue > 0 ? (
                  <>
                    <div className="collection-plan-analytics-doughnut">
                      <svg viewBox="0 0 200 200" className="collection-plan-analytics-doughnut-svg">
                        <circle
                          cx="100"
                          cy="100"
                          r="80"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="40"
                        />
                        {(() => {
                          const total = parseFloat(analytics.overdueVsNotDue.overdue || 0) + parseFloat(analytics.overdueVsNotDue.notDue || 0);
                          const overduePercent = total > 0 ? (parseFloat(analytics.overdueVsNotDue.overdue || 0) / total) : 0;
                          const notDuePercent = total > 0 ? (parseFloat(analytics.overdueVsNotDue.notDue || 0) / total) : 0;
                          const circumference = 2 * Math.PI * 80;
                          const overdueOffset = circumference - (overduePercent * circumference);
                          const notDueOffset = circumference - (notDuePercent * circumference);
                          
                          return (
                            <>
                              <circle
                                cx="100"
                                cy="100"
                                r="80"
                                fill="none"
                                stroke="#991b1b"
                                strokeWidth="40"
                                strokeDasharray={circumference}
                                strokeDashoffset={overdueOffset}
                                transform="rotate(-90 100 100)"
                                className="collection-plan-analytics-doughnut-segment"
                              />
                              {notDuePercent > 0 && (
                                <circle
                                  cx="100"
                                  cy="100"
                                  r="80"
                                  fill="none"
                                  stroke="#10b981"
                                  strokeWidth="40"
                                  strokeDasharray={circumference}
                                  strokeDashoffset={notDueOffset}
                                  transform={`rotate(${-90 + (overduePercent * 360)} 100 100)`}
                                  className="collection-plan-analytics-doughnut-segment"
                                />
                              )}
                            </>
                          );
                        })()}
                        <text
                          x="100"
                          y="95"
                          textAnchor="middle"
                          className="collection-plan-analytics-doughnut-center-text"
                          fontSize="24"
                          fontWeight="700"
                          fill="var(--color-text-primary)"
                        >
                          Total
                        </text>
                        <text
                          x="100"
                          y="115"
                          textAnchor="middle"
                          className="collection-plan-analytics-doughnut-center-value"
                          fontSize="18"
                          fontWeight="600"
                          fill="var(--color-text-secondary)"
                        >
                          ₹{((parseFloat(analytics.overdueVsNotDue.overdue || 0) + parseFloat(analytics.overdueVsNotDue.notDue || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}
                        </text>
                      </svg>
                    </div>
                    <div className="collection-plan-analytics-legend">
                      <div className="collection-plan-analytics-legend-item">
                        <div className="collection-plan-analytics-legend-color" style={{ background: '#991b1b' }} />
                        <div className="collection-plan-analytics-legend-content">
                          <div className="collection-plan-analytics-legend-label">Overdue</div>
                          <div className="collection-plan-analytics-legend-value">
                            ₹{parseFloat(analytics.overdueVsNotDue.overdue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className="collection-plan-analytics-legend-percentage">
                            {(() => {
                              const total = parseFloat(analytics.overdueVsNotDue.overdue || 0) + parseFloat(analytics.overdueVsNotDue.notDue || 0);
                              return total > 0 
                                ? ((parseFloat(analytics.overdueVsNotDue.overdue || 0) / total * 100).toFixed(2))
                                : '0.00';
                            })()}%
                          </div>
                        </div>
                      </div>
                      <div className="collection-plan-analytics-legend-item">
                        <div className="collection-plan-analytics-legend-color" style={{ background: '#10b981' }} />
                        <div className="collection-plan-analytics-legend-content">
                          <div className="collection-plan-analytics-legend-label">Not Due</div>
                          <div className="collection-plan-analytics-legend-value">
                            ₹{parseFloat(analytics.overdueVsNotDue.notDue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className="collection-plan-analytics-legend-percentage">
                            {(() => {
                              const total = parseFloat(analytics.overdueVsNotDue.overdue || 0) + parseFloat(analytics.overdueVsNotDue.notDue || 0);
                              return total > 0 
                                ? ((parseFloat(analytics.overdueVsNotDue.notDue || 0) / total * 100).toFixed(2))
                                : '0.00';
                            })()}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="collection-plan-analytics-empty">
                    <p>No outstanding amounts to display.</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Detailed Collection Summary - Enterprise KPI Panel */}
            <div className="collection-plan-analytics-card collection-plan-analytics-card-full">
              <h3 className="collection-plan-analytics-card-title">Detailed Collection Summary</h3>
              <div className="collection-summary-kpi-grid">
                {/* Total Outstanding - Neutral */}
                <div 
                  className="collection-summary-kpi-card collection-summary-kpi-neutral"
                  data-tooltip="Total amount outstanding across all invoices and receivables. Includes both due and not-due amounts."
                >
                  <div className="collection-summary-kpi-card-header">
                    <div className="collection-summary-kpi-icon-wrapper">
                      <svg className="collection-summary-kpi-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    </div>
                    <div className="collection-summary-kpi-label">Total Outstanding</div>
                  </div>
                  <div className="collection-summary-kpi-value">
                    ₹{(totals.totalOutstanding || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="collection-summary-kpi-trend">
                    <span className="collection-summary-kpi-trend-label">All receivables</span>
                  </div>
                </div>

                {/* Total Collected - Green */}
                <div 
                  className="collection-summary-kpi-card collection-summary-kpi-success"
                  data-tooltip="Total amount collected from customers. Includes payments received and statutory deductions applied."
                >
                  <div className="collection-summary-kpi-card-header">
                    <div className="collection-summary-kpi-icon-wrapper">
                      <svg className="collection-summary-kpi-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                    <div className="collection-summary-kpi-label">Total Collected</div>
                  </div>
                  <div className="collection-summary-kpi-value">
                    ₹{(totals.received || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="collection-summary-kpi-trend">
                    {totals.totalOutstanding > 0 && (
                      <span className="collection-summary-kpi-trend-positive">
                        {((totals.received / totals.totalOutstanding) * 100).toFixed(1)}% of outstanding
                      </span>
                    )}
                  </div>
                </div>

                {/* Total Overdue - Red */}
                <div 
                  className="collection-summary-kpi-card collection-summary-kpi-danger"
                  data-tooltip="Total amount that is past its due date. Requires immediate attention for collection follow-up."
                >
                  <div className="collection-summary-kpi-card-header">
                    <div className="collection-summary-kpi-icon-wrapper">
                      <svg className="collection-summary-kpi-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </div>
                    <div className="collection-summary-kpi-label">Total Overdue</div>
                  </div>
                  <div className="collection-summary-kpi-value">
                    ₹{(totals.overdue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="collection-summary-kpi-trend">
                    {totals.totalOutstanding > 0 && (
                      <span className="collection-summary-kpi-trend-negative">
                        {((totals.overdue / totals.totalOutstanding) * 100).toFixed(1)}% of outstanding
                      </span>
                    )}
                  </div>
                </div>

                {/* Overall Target Achieved - Blue */}
                <div 
                  className="collection-summary-kpi-card collection-summary-kpi-info"
                  data-tooltip="Percentage of collection target achieved. Calculated as (Collected + Statutory Deductions) / Plan Finalised × 100."
                >
                  <div className="collection-summary-kpi-card-header">
                    <div className="collection-summary-kpi-icon-wrapper">
                      <svg className="collection-summary-kpi-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    </div>
                    <div className="collection-summary-kpi-label">Overall Target Achieved</div>
                  </div>
                  <div className="collection-summary-kpi-value">
                    {overallTargetAchieved}%
                  </div>
                  <div className="collection-summary-kpi-trend">
                    <span className={`collection-summary-kpi-trend-${parseFloat(overallTargetAchieved) >= 100 ? 'positive' : parseFloat(overallTargetAchieved) >= 75 ? 'neutral' : 'negative'}`}>
                      {parseFloat(overallTargetAchieved) >= 100 ? 'Target exceeded' : parseFloat(overallTargetAchieved) >= 75 ? 'On track' : 'Below target'}
                    </span>
                  </div>
                </div>

                {/* Due This Month - Amber */}
                <div 
                  className="collection-summary-kpi-card collection-summary-kpi-warning"
                  data-tooltip="Total amount due for collection in the current month. Includes invoices with due dates falling within this month."
                >
                  <div className="collection-summary-kpi-card-header">
                    <div className="collection-summary-kpi-icon-wrapper">
                      <svg className="collection-summary-kpi-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                    <div className="collection-summary-kpi-label">Due This Month</div>
                  </div>
                  <div className="collection-summary-kpi-value">
                    ₹{(totals.dueThisMonth || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="collection-summary-kpi-trend">
                    <span className="collection-summary-kpi-trend-label">Current month focus</span>
                  </div>
                </div>

                {/* Total Balance - Neutral */}
                <div 
                  className="collection-summary-kpi-card collection-summary-kpi-neutral"
                  data-tooltip="Remaining balance after collections. Calculated as Plan Finalised - (Received + Statutory Deductions)."
                >
                  <div className="collection-summary-kpi-card-header">
                    <div className="collection-summary-kpi-icon-wrapper">
                      <svg className="collection-summary-kpi-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="1" x2="12" y2="23" />
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    </div>
                    <div className="collection-summary-kpi-label">Total Balance</div>
                  </div>
                  <div className="collection-summary-kpi-value">
                    ₹{(totals.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="collection-summary-kpi-trend">
                    <span className="collection-summary-kpi-trend-label">Pending collection</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CollectionPlan

