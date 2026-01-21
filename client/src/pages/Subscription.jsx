import { useState } from 'react'
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
  Shield
} from 'lucide-react'
import '../styles/Subscription.css'

// Mock subscription data
const mockSubscription = {
  planName: 'Professional',
  billingCycle: 'Monthly',
  amount: 4999,
  nextBillingDate: '2024-02-15',
  status: 'Active', // Active, Trial, Expired
  trialDaysRemaining: null,
}

const mockPlans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 0,
    billingCycle: '/month',
    features: [
      { label: 'Up to 3 users', icon: Users },
      { label: 'Up to 100 invoices/month', icon: FileText },
      { label: '5 GB storage', icon: HardDrive },
      { label: 'Basic support', icon: Shield },
      { label: 'Standard features', icon: Check },
    ],
    limits: {
      users: 3,
      invoices: 100,
      storage: 5,
    },
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 4999,
    billingCycle: '/month',
    featured: true,
    current: true,
    features: [
      { label: 'Up to 25 users', icon: Users },
      { label: 'Unlimited invoices', icon: FileText },
      { label: '50 GB storage', icon: HardDrive },
      { label: 'Priority support', icon: Shield },
      { label: 'Advanced workflows', icon: Check },
      { label: 'Master data controls', icon: Check },
      { label: 'Reporting & analytics', icon: Check },
    ],
    limits: {
      users: 25,
      invoices: 'Unlimited',
      storage: 50,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    billingCycle: '',
    features: [
      { label: 'Unlimited users', icon: Users },
      { label: 'Unlimited invoices', icon: FileText },
      { label: '500 GB storage', icon: HardDrive },
      { label: 'Dedicated support', icon: Shield },
      { label: 'Custom integrations', icon: Check },
      { label: 'SSO & advanced security', icon: Check },
      { label: 'SLA guarantees', icon: Check },
    ],
    limits: {
      users: 'Unlimited',
      invoices: 'Unlimited',
      storage: 500,
    },
  },
]

const mockBillingInfo = {
  paymentMethod: {
    type: 'Card',
    last4: '4242',
    brand: 'Visa',
    expiryMonth: 12,
    expiryYear: 2025,
  },
  billingAddress: {
    company: 'Acme Corporation',
    address: '123 Business Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    zip: '400001',
    country: 'India',
  },
}

const mockInvoices = [
  {
    id: 'INV-2024-001',
    date: '2024-01-15',
    amount: 4999,
    status: 'Paid',
    plan: 'Professional',
    period: 'Jan 15 - Feb 14, 2024',
  },
  {
    id: 'INV-2023-045',
    date: '2023-12-15',
    amount: 4999,
    status: 'Paid',
    plan: 'Professional',
    period: 'Dec 15 - Jan 14, 2024',
  },
  {
    id: 'INV-2023-044',
    date: '2023-11-15',
    amount: 2999,
    status: 'Paid',
    plan: 'Starter',
    period: 'Nov 15 - Dec 14, 2023',
  },
]

const mockHistory = [
  {
    id: 1,
    date: '2024-01-15',
    action: 'Upgraded to Professional',
    from: 'Starter',
    to: 'Professional',
    amount: 4999,
  },
  {
    id: 2,
    date: '2023-11-15',
    action: 'Subscription renewed',
    from: 'Starter',
    to: 'Starter',
    amount: 2999,
  },
  {
    id: 3,
    date: '2023-10-15',
    action: 'Subscription started',
    from: null,
    to: 'Starter',
    amount: 0,
  },
]

function Subscription() {
  const [subscription] = useState(mockSubscription)
  const [showChangeModal, setShowChangeModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [changeType, setChangeType] = useState(null) // 'upgrade' or 'downgrade'

  const formatCurrency = (amount) => {
    if (typeof amount === 'string') return amount
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getStatusClass = (status) => {
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
  }

  const confirmPlanChange = () => {
    // TODO: Integrate with subscription API
    console.log(`${changeType} to ${selectedPlan.name}`)
    setShowChangeModal(false)
    setSelectedPlan(null)
    setChangeType(null)
    // Show success message
    alert(`Subscription ${changeType === 'upgrade' ? 'upgraded' : 'downgraded'} to ${selectedPlan.name}. Changes will take effect on your next billing cycle.`)
  }

  const handleDownloadInvoice = (invoiceId) => {
    // TODO: Integrate with invoice download API
    console.log('Download invoice:', invoiceId)
    alert(`Downloading invoice ${invoiceId}...`)
  }

  const isCurrentPlan = (planId) => {
    return subscription.planName.toLowerCase() === planId
  }

  const canUpgrade = (planId) => {
    const order = { starter: 1, professional: 2, enterprise: 3 }
    const currentOrder = order[subscription.planName.toLowerCase()] || 0
    const planOrder = order[planId] || 0
    return planOrder > currentOrder
  }

  const canDowngrade = (planId) => {
    const order = { starter: 1, professional: 2, enterprise: 3 }
    const currentOrder = order[subscription.planName.toLowerCase()] || 0
    const planOrder = order[planId] || 0
    return planOrder < currentOrder && planId !== 'enterprise'
  }

  return (
    <div className="subscription-page">
      {/* Current Subscription Status */}
      <div className="subscription-header">
        <div className="subscription-header-content">
          <h1 className="subscription-title">Subscription Management</h1>
          <p className="subscription-subtitle">
            Manage your subscription, billing, and plan preferences
          </p>
        </div>
      </div>

      <div className="subscription-status-card">
        <div className="subscription-status-header">
          <div className="subscription-status-main">
            <div className="subscription-status-plan">{subscription.planName}</div>
            <div className={`subscription-status-badge ${getStatusClass(subscription.status)}`}>
              {subscription.status}
            </div>
          </div>
          {subscription.trialDaysRemaining && (
            <div className="subscription-trial-notice">
              {subscription.trialDaysRemaining} days remaining in trial
            </div>
          )}
        </div>

        <div className="subscription-status-details">
          <div className="subscription-status-item">
            <div className="subscription-status-label">Billing Cycle</div>
            <div className="subscription-status-value">{subscription.billingCycle}</div>
          </div>
          <div className="subscription-status-item">
            <div className="subscription-status-label">Amount</div>
            <div className="subscription-status-value">{formatCurrency(subscription.amount)}</div>
          </div>
          <div className="subscription-status-item">
            <div className="subscription-status-label">Next Billing Date</div>
            <div className="subscription-status-value">{formatDate(subscription.nextBillingDate)}</div>
          </div>
        </div>
      </div>

      {/* Available Plans */}
      <div className="subscription-section">
        <div className="subscription-section-header">
          <h2 className="subscription-section-title">Available Plans</h2>
          <p className="subscription-section-subtitle">
            Change your plan at any time. Changes take effect on your next billing cycle.
          </p>
        </div>

        <div className="subscription-plans-grid">
          {mockPlans.map((plan) => {
            const FeatureIcon = ({ icon: Icon }) => (
              Icon ? <Icon className="subscription-feature-icon" /> : <Check className="subscription-feature-icon" />
            )

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
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="subscription-feature">
                      <FeatureIcon icon={feature.icon} />
                      <span>{feature.label}</span>
                    </div>
                  ))}
                </div>

                <div className="subscription-plan-limits">
                  <div className="subscription-limit">
                    <Users className="subscription-limit-icon" />
                    <span>{plan.limits.users} {typeof plan.limits.users === 'number' ? 'users' : ''}</span>
                  </div>
                  <div className="subscription-limit">
                    <FileText className="subscription-limit-icon" />
                    <span>{plan.limits.invoices} invoices</span>
                  </div>
                  <div className="subscription-limit">
                    <HardDrive className="subscription-limit-icon" />
                    <span>{plan.limits.storage} GB</span>
                  </div>
                </div>

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
                  ) : plan.id === 'enterprise' ? (
                    <button className="subscription-btn subscription-btn-ghost">
                      Contact Sales
                    </button>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Billing Information */}
      <div className="subscription-section">
        <div className="subscription-section-header">
          <h2 className="subscription-section-title">Billing Information</h2>
        </div>

        <div className="subscription-billing-grid">
          <div className="subscription-billing-card">
            <div className="subscription-billing-card-header">
              <CreditCard className="subscription-billing-icon" />
              <h3 className="subscription-billing-card-title">Payment Method</h3>
            </div>
            <div className="subscription-billing-card-content">
              <div className="subscription-billing-item">
                <div className="subscription-billing-label">Card</div>
                <div className="subscription-billing-value">
                  {mockBillingInfo.paymentMethod.brand} •••• {mockBillingInfo.paymentMethod.last4}
                </div>
              </div>
              <div className="subscription-billing-item">
                <div className="subscription-billing-label">Expires</div>
                <div className="subscription-billing-value">
                  {mockBillingInfo.paymentMethod.expiryMonth}/{mockBillingInfo.paymentMethod.expiryYear}
                </div>
              </div>
              <button className="subscription-link-btn">Update Payment Method</button>
            </div>
          </div>

          <div className="subscription-billing-card">
            <div className="subscription-billing-card-header">
              <Building2 className="subscription-billing-icon" />
              <h3 className="subscription-billing-card-title">Billing Address</h3>
            </div>
            <div className="subscription-billing-card-content">
              <div className="subscription-billing-address">
                <div>{mockBillingInfo.billingAddress.company}</div>
                <div>{mockBillingInfo.billingAddress.address}</div>
                <div>
                  {mockBillingInfo.billingAddress.city}, {mockBillingInfo.billingAddress.state}{' '}
                  {mockBillingInfo.billingAddress.zip}
                </div>
                <div>{mockBillingInfo.billingAddress.country}</div>
              </div>
              <button className="subscription-link-btn">Update Address</button>
            </div>
          </div>
        </div>
      </div>

      {/* Past Invoices */}
      <div className="subscription-section">
        <div className="subscription-section-header">
          <h2 className="subscription-section-title">Past Invoices</h2>
        </div>

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
              {mockInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="subscription-invoice-id">{invoice.id}</td>
                  <td>{formatDate(invoice.date)}</td>
                  <td>{invoice.plan}</td>
                  <td className="subscription-invoice-period">{invoice.period}</td>
                  <td className="subscription-invoice-amount">{formatCurrency(invoice.amount)}</td>
                  <td>
                    <span className={`subscription-invoice-status subscription-invoice-status-${invoice.status.toLowerCase()}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="subscription-download-btn"
                      onClick={() => handleDownloadInvoice(invoice.id)}
                      aria-label={`Download ${invoice.id}`}
                    >
                      <Download className="subscription-download-icon" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscription History */}
      <div className="subscription-section">
        <div className="subscription-section-header">
          <h2 className="subscription-section-title">Subscription History</h2>
        </div>

        <div className="subscription-history-card">
          <div className="subscription-history-list">
            {mockHistory.map((item) => (
              <div key={item.id} className="subscription-history-item">
                <div className="subscription-history-date">{formatDate(item.date)}</div>
                <div className="subscription-history-content">
                  <div className="subscription-history-action">{item.action}</div>
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
      </div>

      {/* Plan Change Confirmation Modal */}
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
              <div className="subscription-modal-plan">
                <div className="subscription-modal-plan-from">
                  <div className="subscription-modal-plan-label">Current</div>
                  <div className="subscription-modal-plan-name">{subscription.planName}</div>
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
              >
                Cancel
              </button>
              <button
                className="subscription-btn subscription-btn-primary"
                onClick={confirmPlanChange}
              >
                Confirm {changeType === 'upgrade' ? 'Upgrade' : 'Downgrade'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Subscription

