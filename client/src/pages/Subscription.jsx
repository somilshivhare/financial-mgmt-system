import { useState, useEffect } from 'react'
import { 
  CreditCard, 
  Calendar, 
  Download, 
  Check, 
  X, 
  AlertCircle, 
  ChevronRight,
  Building2,
  Users,
  FileText,
  HardDrive,
  Shield,
  Loader2
} from 'lucide-react'
import { 
  getSubscription, 
  getSubscriptionPlans, 
  upgradeSubscription,
  getBillingHistory,
  downloadInvoice
} from '../api/subscription'
import '../styles/Subscription.css'

const DEFAULT_SUBSCRIPTION = {
  planName: '',
  billingCycle: '',
  amount: 0,
  nextBillingDate: null,
  status: '',
  trialDaysRemaining: null,
}

const DEFAULT_BILLING_INFO = {
  paymentMethod: {
    type: '',
    last4: '',
    brand: '',
    expiryMonth: null,
    expiryYear: null,
  },
  billingAddress: {
    company: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: '',
  },
}

function Subscription() {
  const [subscription, setSubscription] = useState(DEFAULT_SUBSCRIPTION)
  const [plans, setPlans] = useState([])
  const [billingInfo, setBillingInfo] = useState(DEFAULT_BILLING_INFO)
  const [invoices, setInvoices] = useState([])
  const [history, setHistory] = useState([])
  
  const [loading, setLoading] = useState(true)
  const [plansLoading, setPlansLoading] = useState(true)
  const [billingLoading, setBillingLoading] = useState(true)
  const [invoicesLoading, setInvoicesLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(true)
  
  const [error, setError] = useState('')
  const [plansError, setPlansError] = useState('')
  const [billingError, setBillingError] = useState('')
  const [invoicesError, setInvoicesError] = useState('')
  const [historyError, setHistoryError] = useState('')
  
  const [showChangeModal, setShowChangeModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [changeType, setChangeType] = useState(null)
  const [changingPlan, setChangingPlan] = useState(false)
  const [changeError, setChangeError] = useState('')
  const [changeSuccess, setChangeSuccess] = useState('')
  const [downloadingInvoice, setDownloadingInvoice] = useState(null)

  useEffect(() => {
    loadSubscription()
  }, [])

  useEffect(() => {
    loadPlans()
  }, [])

  useEffect(() => {
    loadBillingInfo()
  }, [])

  useEffect(() => {
    loadInvoices()
  }, [])

  useEffect(() => {
    loadHistory()
  }, [])

  useEffect(() => {
    if (changeSuccess) {
      const timer = setTimeout(() => {
        setChangeSuccess('')
        loadSubscription()
        loadPlans()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [changeSuccess])

  const loadSubscription = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await getSubscription()
      
      if (response && response.success && response.data) {
        const data = response.data
        setSubscription({
          planName: data.planName || data.plan_name || '',
          billingCycle: data.billingCycle || data.billing_cycle || '',
          amount: data.amount || 0,
          nextBillingDate: data.nextBillingDate || data.next_billing_date || null,
          status: data.status || '',
          trialDaysRemaining: data.trialDaysRemaining || data.trial_days_remaining || null,
        })
      } else {
        setSubscription(DEFAULT_SUBSCRIPTION)
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to load subscription information'
      setError(errorMessage)
      setSubscription(DEFAULT_SUBSCRIPTION)
    } finally {
      setLoading(false)
    }
  }

  const loadPlans = async () => {
    try {
      setPlansLoading(true)
      setPlansError('')
      const response = await getSubscriptionPlans()
      
      if (response && response.success && response.data) {
        const plansData = Array.isArray(response.data) ? response.data : []
        setPlans(plansData.map(plan => ({
          id: plan.id || plan.planId || '',
          name: plan.name || '',
          price: plan.price !== undefined ? plan.price : 'Custom',
          billingCycle: plan.billingCycle || plan.billing_cycle || '/month',
          featured: plan.featured || false,
          features: plan.features || [],
          limits: plan.limits || {},
        })))
      } else {
        setPlans([])
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to load subscription plans'
      setPlansError(errorMessage)
      setPlans([])
    } finally {
      setPlansLoading(false)
    }
  }

  const loadBillingInfo = async () => {
    try {
      setBillingLoading(true)
      setBillingError('')
      const response = await getBillingHistory()
      
      if (response && response.success && response.data) {
        const data = response.data
        if (data.billingInfo || data.billing_info) {
          const billing = data.billingInfo || data.billing_info
          setBillingInfo({
            paymentMethod: {
              type: billing.paymentMethod?.type || billing.payment_method?.type || '',
              last4: billing.paymentMethod?.last4 || billing.payment_method?.last4 || '',
              brand: billing.paymentMethod?.brand || billing.payment_method?.brand || '',
              expiryMonth: billing.paymentMethod?.expiryMonth || billing.payment_method?.expiry_month || null,
              expiryYear: billing.paymentMethod?.expiryYear || billing.payment_method?.expiry_year || null,
            },
            billingAddress: {
              company: billing.billingAddress?.company || billing.billing_address?.company || '',
              address: billing.billingAddress?.address || billing.billing_address?.address || '',
              city: billing.billingAddress?.city || billing.billing_address?.city || '',
              state: billing.billingAddress?.state || billing.billing_address?.state || '',
              zip: billing.billingAddress?.zip || billing.billing_address?.zip || '',
              country: billing.billingAddress?.country || billing.billing_address?.country || '',
            },
          })
        }
      }
    } catch (err) {
      setBillingError(err.message || 'Failed to load billing information')
    } finally {
      setBillingLoading(false)
    }
  }

  const loadInvoices = async () => {
    try {
      setInvoicesLoading(true)
      setInvoicesError('')
      const response = await getBillingHistory()
      
      if (response && response.success && response.data) {
        const invoicesData = response.data.invoices || response.data.invoiceHistory || []
        setInvoices(Array.isArray(invoicesData) ? invoicesData.map(inv => ({
          id: inv.id || inv.invoiceId || inv.invoice_id || '',
          date: inv.date || inv.invoiceDate || inv.invoice_date || '',
          amount: inv.amount || 0,
          status: inv.status || '',
          plan: inv.plan || inv.planName || inv.plan_name || '',
          period: inv.period || inv.billingPeriod || inv.billing_period || '',
        })) : [])
      } else {
        setInvoices([])
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to load invoices'
      setInvoicesError(errorMessage)
      setInvoices([])
    } finally {
      setInvoicesLoading(false)
    }
  }

  const loadHistory = async () => {
    try {
      setHistoryLoading(true)
      setHistoryError('')
      const response = await getBillingHistory()
      
      if (response && response.success && response.data) {
        const historyData = response.data.history || response.data.subscriptionHistory || []
        setHistory(Array.isArray(historyData) ? historyData.map(item => ({
          id: item.id || '',
          date: item.date || item.createdAt || item.created_at || '',
          action: item.action || '',
          from: item.from || item.fromPlan || item.from_plan || null,
          to: item.to || item.toPlan || item.to_plan || '',
          amount: item.amount || 0,
        })) : [])
      } else {
        setHistory([])
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to load subscription history'
      setHistoryError(errorMessage)
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    if (typeof amount === 'string') return amount
    if (!amount && amount !== 0) return 'N/A'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  const getStatusClass = (status) => {
    if (!status) return ''
    switch (status.toLowerCase()) {
      case 'active':
        return 'status-active'
      case 'trial':
        return 'status-trial'
      case 'expired':
        return 'status-expired'
      default:
        return ''
    }
  }

  const handlePlanChange = (plan, type) => {
    setSelectedPlan(plan)
    setChangeType(type)
    setShowChangeModal(true)
    setChangeError('')
    setChangeSuccess('')
  }

  const confirmPlanChange = async () => {
    if (!selectedPlan || !selectedPlan.id) return
    
    try {
      setChangingPlan(true)
      setChangeError('')
      setChangeSuccess('')
      
      const response = await upgradeSubscription(selectedPlan.id)
      
      if (response && response.success) {
        setChangeSuccess(`Subscription ${changeType === 'upgrade' ? 'upgraded' : 'downgraded'} to ${selectedPlan.name}. Changes will take effect on your next billing cycle.`)
        setShowChangeModal(false)
        setSelectedPlan(null)
        setChangeType(null)
      } else {
        throw new Error(response?.message || 'Failed to update subscription')
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to update subscription. Please try again.'
      setChangeError(errorMessage)
    } finally {
      setChangingPlan(false)
    }
  }

  const handleDownloadInvoice = async (invoiceId) => {
    if (!invoiceId) return
    
    try {
      setDownloadingInvoice(invoiceId)
      const response = await downloadInvoice(invoiceId)
      
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `invoice-${invoiceId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert(err.message || 'Failed to download invoice. Please try again.')
    } finally {
      setDownloadingInvoice(null)
    }
  }

  const isCurrentPlan = (planId) => {
    if (!subscription.planName || !planId) return false
    return subscription.planName.toLowerCase() === planId.toLowerCase()
  }

  const canUpgrade = (planId) => {
    if (!subscription.planName) return false
    const order = { starter: 1, professional: 2, enterprise: 3 }
    const currentOrder = order[subscription.planName.toLowerCase()] || 0
    const planOrder = order[planId.toLowerCase()] || 0
    return planOrder > currentOrder
  }

  const canDowngrade = (planId) => {
    if (!subscription.planName) return false
    const order = { starter: 1, professional: 2, enterprise: 3 }
    const currentOrder = order[subscription.planName.toLowerCase()] || 0
    const planOrder = order[planId.toLowerCase()] || 0
    return planOrder < currentOrder && planId.toLowerCase() !== 'enterprise'
  }

  const getFeatureIcon = (iconName) => {
    const iconMap = {
      Users,
      FileText,
      HardDrive,
      Shield,
      Check,
    }
    return iconMap[iconName] || Check
  }

  return (
    <div className="subscription-page">
      <div className="subscription-header">
        <div className="subscription-header-content">
          <h1 className="subscription-title">Subscription Management</h1>
          <p className="subscription-subtitle">
            Manage your subscription, billing, and plan preferences
          </p>
        </div>
      </div>

      {error && (
        <div className="subscription-error" style={{ padding: '1rem', margin: '1rem 0', background: '#fee', color: '#c33', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      <div className="subscription-status-card">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <Loader2 className="subscription-spinner" style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }} />
            <p>Loading subscription information...</p>
          </div>
        ) : (
          <>
            <div className="subscription-status-header">
              <div className="subscription-status-main">
                <div className="subscription-status-plan">
                  {subscription.planName || 'No Plan'}
                </div>
                {subscription.status && (
                  <div className={`subscription-status-badge ${getStatusClass(subscription.status)}`}>
                    {subscription.status}
                  </div>
                )}
              </div>
              {subscription.trialDaysRemaining !== null && subscription.trialDaysRemaining !== undefined && (
                <div className="subscription-trial-notice">
                  {subscription.trialDaysRemaining} days remaining in trial
                </div>
              )}
            </div>

            <div className="subscription-status-details">
              <div className="subscription-status-item">
                <div className="subscription-status-label">Billing Cycle</div>
                <div className="subscription-status-value">
                  {subscription.billingCycle || 'N/A'}
                </div>
              </div>
              <div className="subscription-status-item">
                <div className="subscription-status-label">Amount</div>
                <div className="subscription-status-value">
                  {formatCurrency(subscription.amount)}
                </div>
              </div>
              <div className="subscription-status-item">
                <div className="subscription-status-label">Next Billing Date</div>
                <div className="subscription-status-value">
                  {formatDate(subscription.nextBillingDate)}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="subscription-section">
        <div className="subscription-section-header">
          <h2 className="subscription-section-title">Available Plans</h2>
          <p className="subscription-section-subtitle">
            Change your plan at any time. Changes take effect on your next billing cycle.
          </p>
        </div>

        {plansError && (
          <div className="subscription-error" style={{ padding: '1rem', margin: '1rem 0', background: '#fee', color: '#c33', borderRadius: '4px' }}>
            {plansError}
          </div>
        )}

        {plansLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <Loader2 className="subscription-spinner" style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }} />
            <p>Loading plans...</p>
          </div>
        ) : plans.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
            No subscription plans available.
          </div>
        ) : (
          <div className="subscription-plans-grid">
            {plans.map((plan) => {
              const FeatureIcon = ({ iconName }) => {
                const Icon = getFeatureIcon(iconName)
                return <Icon className="subscription-feature-icon" />
              }

              const isCurrent = isCurrentPlan(plan.id)
              const canUp = canUpgrade(plan.id)
              const canDown = canDowngrade(plan.id)

              return (
                <div
                  key={plan.id}
                  className={`subscription-plan-card ${plan.featured ? 'is-featured' : ''} ${isCurrent ? 'is-current' : ''}`}
                >
                  {isCurrent && (
                    <div className="subscription-plan-badge">Current Plan</div>
                  )}
                  {plan.featured && !isCurrent && (
                    <div className="subscription-plan-featured">Most Popular</div>
                  )}

                  <div className="subscription-plan-header">
                    <div className="subscription-plan-name">{plan.name}</div>
                    <div className="subscription-plan-price">
                      {typeof plan.price === 'string' ? (
                        plan.price
                      ) : (
                        <>
                          {formatCurrency(plan.price)}
                          <span className="subscription-plan-cycle">{plan.billingCycle}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="subscription-plan-features">
                    {Array.isArray(plan.features) && plan.features.length > 0 ? (
                      plan.features.map((feature, idx) => (
                        <div key={idx} className="subscription-feature">
                          {typeof feature === 'string' ? (
                            <>
                              <Check className="subscription-feature-icon" />
                              <span>{feature}</span>
                            </>
                          ) : (
                            <>
                              <FeatureIcon iconName={feature.icon} />
                              <span>{feature.label || feature}</span>
                            </>
                          )}
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '1rem', color: '#666', textAlign: 'center' }}>
                        No features listed
                      </div>
                    )}
                  </div>

                  {plan.limits && Object.keys(plan.limits).length > 0 && (
                    <div className="subscription-plan-limits">
                      {plan.limits.users !== undefined && (
                        <div className="subscription-limit">
                          <Users className="subscription-limit-icon" />
                          <span>
                            {plan.limits.users} {typeof plan.limits.users === 'number' ? 'users' : ''}
                          </span>
                        </div>
                      )}
                      {plan.limits.invoices !== undefined && (
                        <div className="subscription-limit">
                          <FileText className="subscription-limit-icon" />
                          <span>{plan.limits.invoices} invoices</span>
                        </div>
                      )}
                      {plan.limits.storage !== undefined && (
                        <div className="subscription-limit">
                          <HardDrive className="subscription-limit-icon" />
                          <span>{plan.limits.storage} GB</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="subscription-plan-actions">
                    {isCurrent ? (
                      <button className="subscription-btn subscription-btn-disabled" disabled>
                        Current Plan
                      </button>
                    ) : canUp ? (
                      <button
                        className="subscription-btn subscription-btn-primary"
                        onClick={() => handlePlanChange(plan, 'upgrade')}
                      >
                        Upgrade
                      </button>
                    ) : canDown ? (
                      <button
                        className="subscription-btn subscription-btn-secondary"
                        onClick={() => handlePlanChange(plan, 'downgrade')}
                      >
                        Downgrade
                      </button>
                    ) : plan.id === 'enterprise' || plan.id?.toLowerCase() === 'enterprise' ? (
                      <button className="subscription-btn subscription-btn-ghost">
                        Contact Sales
                      </button>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="subscription-section">
        <div className="subscription-section-header">
          <h2 className="subscription-section-title">Billing Information</h2>
        </div>

        {billingError && (
          <div className="subscription-error" style={{ padding: '1rem', margin: '1rem 0', background: '#fee', color: '#c33', borderRadius: '4px' }}>
            {billingError}
          </div>
        )}

        {billingLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <Loader2 className="subscription-spinner" style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }} />
            <p>Loading billing information...</p>
          </div>
        ) : (
          <div className="subscription-billing-grid">
            <div className="subscription-billing-card">
              <div className="subscription-billing-card-header">
                <CreditCard className="subscription-billing-icon" />
                <h3 className="subscription-billing-card-title">Payment Method</h3>
              </div>
              <div className="subscription-billing-card-content">
                {billingInfo.paymentMethod.brand || billingInfo.paymentMethod.last4 ? (
                  <>
                    <div className="subscription-billing-item">
                      <div className="subscription-billing-label">Card</div>
                      <div className="subscription-billing-value">
                        {billingInfo.paymentMethod.brand} •••• {billingInfo.paymentMethod.last4}
                      </div>
                    </div>
                    {billingInfo.paymentMethod.expiryMonth && billingInfo.paymentMethod.expiryYear && (
                      <div className="subscription-billing-item">
                        <div className="subscription-billing-label">Expires</div>
                        <div className="subscription-billing-value">
                          {billingInfo.paymentMethod.expiryMonth}/{billingInfo.paymentMethod.expiryYear}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ padding: '1rem', color: '#666' }}>No payment method on file</div>
                )}
                <button className="subscription-link-btn">Update Payment Method</button>
              </div>
            </div>

            <div className="subscription-billing-card">
              <div className="subscription-billing-card-header">
                <Building2 className="subscription-billing-icon" />
                <h3 className="subscription-billing-card-title">Billing Address</h3>
              </div>
              <div className="subscription-billing-card-content">
                {billingInfo.billingAddress.company || billingInfo.billingAddress.address ? (
                  <div className="subscription-billing-address">
                    {billingInfo.billingAddress.company && <div>{billingInfo.billingAddress.company}</div>}
                    {billingInfo.billingAddress.address && <div>{billingInfo.billingAddress.address}</div>}
                    {(billingInfo.billingAddress.city || billingInfo.billingAddress.state || billingInfo.billingAddress.zip) && (
                      <div>
                        {billingInfo.billingAddress.city}{billingInfo.billingAddress.city && billingInfo.billingAddress.state ? ', ' : ''}
                        {billingInfo.billingAddress.state} {billingInfo.billingAddress.zip}
                      </div>
                    )}
                    {billingInfo.billingAddress.country && <div>{billingInfo.billingAddress.country}</div>}
                  </div>
                ) : (
                  <div style={{ padding: '1rem', color: '#666' }}>No billing address on file</div>
                )}
                <button className="subscription-link-btn">Update Address</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="subscription-section">
        <div className="subscription-section-header">
          <h2 className="subscription-section-title">Past Invoices</h2>
        </div>

        {invoicesError && (
          <div className="subscription-error" style={{ padding: '1rem', margin: '1rem 0', background: '#fee', color: '#c33', borderRadius: '4px' }}>
            {invoicesError}
          </div>
        )}

        {invoicesLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <Loader2 className="subscription-spinner" style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }} />
            <p>Loading invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="subscription-invoices-card">
            <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
              No invoices found.
            </div>
          </div>
        ) : (
          <div className="subscription-invoices-card">
            <table className="subscription-invoices-table">
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Date</th>
                  <th>Plan</th>
                  <th>Period</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="subscription-invoice-id">{invoice.id}</td>
                    <td>{formatDate(invoice.date)}</td>
                    <td>{invoice.plan || 'N/A'}</td>
                    <td className="subscription-invoice-period">{invoice.period || 'N/A'}</td>
                    <td className="subscription-invoice-amount">{formatCurrency(invoice.amount)}</td>
                    <td>
                      <span className={`subscription-invoice-status subscription-invoice-status-${(invoice.status || '').toLowerCase()}`}>
                        {invoice.status || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="subscription-download-btn"
                        onClick={() => handleDownloadInvoice(invoice.id)}
                        disabled={downloadingInvoice === invoice.id}
                        aria-label={`Download ${invoice.id}`}
                      >
                        {downloadingInvoice === invoice.id ? (
                          <Loader2 style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                        ) : (
                          <Download className="subscription-download-icon" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="subscription-section">
        <div className="subscription-section-header">
          <h2 className="subscription-section-title">Subscription History</h2>
        </div>

        {historyError && (
          <div className="subscription-error" style={{ padding: '1rem', margin: '1rem 0', background: '#fee', color: '#c33', borderRadius: '4px' }}>
            {historyError}
          </div>
        )}

        {historyLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <Loader2 className="subscription-spinner" style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }} />
            <p>Loading history...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="subscription-history-card">
            <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
              No subscription history found.
            </div>
          </div>
        ) : (
          <div className="subscription-history-card">
            <div className="subscription-history-list">
              {history.map((item) => (
                <div key={item.id} className="subscription-history-item">
                  <div className="subscription-history-date">{formatDate(item.date)}</div>
                  <div className="subscription-history-content">
                    <div className="subscription-history-action">{item.action || 'N/A'}</div>
                    {item.from && item.to && (
                      <div className="subscription-history-change">
                        {item.from} <ChevronRight className="subscription-history-arrow" /> {item.to}
                      </div>
                    )}
                  </div>
                  {item.amount > 0 && (
                    <div className="subscription-history-amount">{formatCurrency(item.amount)}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showChangeModal && selectedPlan && (
        <div className="subscription-modal-overlay" onClick={() => setShowChangeModal(false)}>
          <div className="subscription-modal" onClick={(e) => e.stopPropagation()}>
            <div className="subscription-modal-header">
              <h3 className="subscription-modal-title">
                Confirm {changeType === 'upgrade' ? 'Upgrade' : 'Downgrade'}
              </h3>
              <button
                className="subscription-modal-close"
                onClick={() => setShowChangeModal(false)}
                aria-label="Close"
              >
                <X />
              </button>
            </div>

            <div className="subscription-modal-content">
              {changeError && (
                <div style={{ padding: '1rem', marginBottom: '1rem', background: '#fee', color: '#c33', borderRadius: '4px' }}>
                  {changeError}
                </div>
              )}
              
              {changeSuccess && (
                <div style={{ padding: '1rem', marginBottom: '1rem', background: '#efe', color: '#3c3', borderRadius: '4px' }}>
                  {changeSuccess}
                </div>
              )}

              <div className="subscription-modal-plan">
                <div className="subscription-modal-plan-from">
                  <div className="subscription-modal-plan-label">Current</div>
                  <div className="subscription-modal-plan-name">{subscription.planName || 'N/A'}</div>
                  <div className="subscription-modal-plan-price">
                    {formatCurrency(subscription.amount)}/{subscription.billingCycle === 'Monthly' ? 'mo' : 'yr'}
                  </div>
                </div>
                <ChevronRight className="subscription-modal-arrow" />
                <div className="subscription-modal-plan-to">
                  <div className="subscription-modal-plan-label">New</div>
                  <div className="subscription-modal-plan-name">{selectedPlan.name}</div>
                  <div className="subscription-modal-plan-price">
                    {typeof selectedPlan.price === 'string' ? (
                      selectedPlan.price
                    ) : (
                      <>
                        {formatCurrency(selectedPlan.price)}
                        <span>/{selectedPlan.billingCycle.replace('/', '')}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="subscription-modal-note">
                <AlertCircle className="subscription-modal-note-icon" />
                <div>
                  <strong>Prorated billing:</strong> You will be charged a prorated amount for the
                  remaining days in your current billing cycle. The new plan will take effect
                  immediately, and your next full billing cycle will start on{' '}
                  {formatDate(subscription.nextBillingDate)}.
                </div>
              </div>
            </div>

            <div className="subscription-modal-actions">
              <button
                className="subscription-btn subscription-btn-ghost"
                onClick={() => setShowChangeModal(false)}
                disabled={changingPlan}
              >
                Cancel
              </button>
              <button
                className="subscription-btn subscription-btn-primary"
                onClick={confirmPlanChange}
                disabled={changingPlan}
              >
                {changingPlan ? (
                  <>
                    <Loader2 style={{ animation: 'spin 1s linear infinite', display: 'inline-block', marginRight: '0.5rem' }} />
                    Processing...
                  </>
                ) : (
                  `Confirm ${changeType === 'upgrade' ? 'Upgrade' : 'Downgrade'}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Subscription
