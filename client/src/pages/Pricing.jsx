import { Link } from 'react-router-dom'
import { useEffect } from 'react'

const tiers = [
  {
    name: 'Trial',
    price: '₹0',
    note: 'Evaluate with a limited but complete workflow',
    features: ['Up to 3 users', 'Core platform modules', 'Email support'],
  },
  {
    name: 'Starter',
    price: '₹4,999',
    note: 'For small teams formalizing finance operations',
    features: ['Up to 10 users', 'Master Data, PO, Invoice', 'Basic collections & dashboards'],
  },
  {
    name: 'Growth',
    price: '₹14,999',
    note: 'For growing organizations with multiple units',
    features: ['Up to 30 users', 'Advanced workflows & approvals', 'Collections planning & reporting'],
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    note: 'For large organizations',
    features: ['Unlimited users', 'Custom security & SSO', 'Dedicated success & SLAs'],
  },
]

export default function Pricing() {
  useEffect(() => {
    document.title = 'Pricing – Nbaurum Plans & Features'
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Choose a Nbaurum plan aligned with your finance workflows. Start with Trial, scale to Growth, or customize Enterprise. Transparent pricing, no hidden fees.')
    }
  }, [])

  return (
    <>
      <section className="mkt-section-full">
        <div className="mkt-container">
          <div className="mkt-page-head">
            <h1 className="mkt-section-heading">Pricing</h1>
            <p className="mkt-lead">
              Choose a plan aligned with your finance workflows. Start small, then scale into more advanced controls and
              reporting as your platform usage grows.
            </p>
          </div>

          <div className="mkt-pricing-grid" style={{ marginTop: 48 }}>
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
                  {t.price === 'Custom' ? 'Talk to sales' : 'Start trial'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature comparison */}
      <section className="mkt-section-full muted">
        <div className="mkt-container">
          <div className="mkt-page-head">
            <h2 className="mkt-section-heading">Compare plans</h2>
            <p className="mkt-lead">
              Detailed feature comparison to help you choose the right plan for your organization.
            </p>
          </div>
          <div className="mkt-card" style={{ marginTop: 48 }}>
            <h3 style={{ marginTop: 0 }}>Feature breakdown</h3>
            <div className="mkt-pricing-table-wrapper">
              <table className="mkt-pricing-table">
                <thead>
                  <tr>
                    <th>Capability</th>
                    <th>Trial</th>
                    <th>Starter</th>
                    <th>Growth</th>
                    <th>Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Users</td>
                    <td>3</td>
                    <td>10</td>
                    <td>30</td>
                    <td>Unlimited</td>
                  </tr>
                  <tr>
                    <td>Core modules (Master Data, PO, Invoice, Payments)</td>
                    <td>✓</td>
                    <td>✓</td>
                    <td>✓</td>
                    <td>✓</td>
                  </tr>
                  <tr>
                    <td>Collections planning & dashboards</td>
                    <td>Basic</td>
                    <td>Basic</td>
                    <td>Advanced</td>
                    <td>Advanced</td>
                  </tr>
                  <tr>
                    <td>Security & RBAC</td>
                    <td>Standard</td>
                    <td>Standard</td>
                    <td>Extended roles</td>
                    <td>Custom roles & SSO</td>
                  </tr>
                  <tr>
                    <td>Support</td>
                    <td>Email</td>
                    <td>Email</td>
                    <td>Priority email & calls</td>
                    <td>Dedicated success</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs and enterprise note */}
      <section className="mkt-section-full">
        <div className="mkt-container">
          <div className="mkt-page-head">
            <h2 className="mkt-section-heading">Questions? We're here to help</h2>
            <p className="mkt-lead">
              Common questions and custom enterprise solutions.
            </p>
          </div>
          <div className="mkt-grid-2" style={{ marginTop: 48 }}>
            <div className="mkt-card">
              <h2>Frequently asked questions</h2>
              <ul className="mkt-benefit-list">
                <li>
                  <strong>Can we start in Trial and move to Growth?</strong>
                  <br />
                  Yes. Your data, users, and workflows remain intact; we simply apply the new limits and capabilities.
                </li>
                <li>
                  <strong>Where is my data stored?</strong>
                  <br />
                  Data is stored in a MySQL database dedicated to your environment. Access is governed by roles.
                </li>
                <li>
                  <strong>Do you support on-premise or private cloud?</strong>
                  <br />
                  Enterprise plans can be deployed to your preferred environment. Talk to us about your requirements.
                </li>
              </ul>
            </div>
            <div className="mkt-card">
              <h2>Custom enterprise pricing</h2>
              <p className="mkt-body">
                For large deployments, complex approvals, or strict compliance environments, we work with you to define
                a plan that covers security, SLAs, and roll-out support.
              </p>
              <p className="mkt-body" style={{ marginTop: 10 }}>
                Contact us with your architecture, regions, and rollout timeline—we'll respond with a detailed proposal.
              </p>
              <Link to="/contact" className="mkt-btn mkt-btn-primary" style={{ marginTop: 14 }}>
                Contact sales
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
