import { Link } from 'react-router-dom'

const tiers = [
  {
    name: 'Starter',
    price: '₹0',
    note: 'For evaluation and small teams',
    features: ['Invoice & payment tracking', 'Collections overview', 'Basic roles'],
  },
  {
    name: 'Professional',
    price: 'Custom',
    note: 'For growing finance operations',
    features: ['Advanced workflows', 'Master data controls', 'Reporting-ready records'],
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    note: 'For large organizations',
    features: ['Security & governance', 'Operational analytics', 'Priority support'],
  },
]

export default function Pricing() {
  return (
    <section className="mkt-section">
      <div className="mkt-container">
        <div className="mkt-page-head">
          <h1 className="mkt-h1">Pricing</h1>
          <p className="mkt-lead">
            Choose a plan aligned with your finance workflows. Upgrade when you’re ready—no UI changes, no disruption.
          </p>
        </div>

        <div className="mkt-pricing-grid">
          {tiers.map((t) => (
            <div key={t.name} className={`mkt-pricing-card ${t.featured ? 'is-featured' : ''}`}>
              <div className="mkt-pricing-name">{t.name}</div>
              <div className="mkt-pricing-price">{t.price}</div>
              <div className="mkt-pricing-note">{t.note}</div>
              <ul className="mkt-pricing-list">
                {t.features.map((f) => (
                  <li key={f} className="mkt-pricing-item">
                    <span className="mkt-check" aria-hidden="true" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register" className={`mkt-btn ${t.featured ? 'mkt-btn-primary' : 'mkt-btn-ghost'}`}>
                Start
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}


