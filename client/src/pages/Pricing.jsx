import { Link } from 'react-router-dom'
import { useEffect } from 'react'

const tiers = [
  {
    name: 'Trial',
    price: '₹0',
    period: '/month',
    note: 'Evaluate the platform with core modules',
    features: ['Up to 3 users', 'Master Data, PO, Invoice, Payments', 'Basic collections & dashboards', 'Email support'],
    cta: 'Start trial',
    href: '/register',
    featured: false,
  },
  {
    name: 'Starter',
    price: '₹4,999',
    period: '/month',
    note: 'For small teams managing receivables and collections',
    features: ['Up to 10 users', 'Full platform modules', 'Collections planning & reporting', 'MIS & aging analysis'],
    cta: 'Start trial',
    href: '/register',
    featured: false,
  },
  {
    name: 'Growth',
    price: '₹14,999',
    period: '/month',
    note: 'For growing organizations with multiple units and compliance needs',
    features: ['Up to 30 users', 'Advanced workflows & approvals', 'Priority support', 'Dedicated liaison support options'],
    cta: 'Get started',
    href: '/register',
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    note: 'Collections consultancy + platform for large deployments',
    features: ['Unlimited users', 'Custom security & SSO', 'Performance-based collection engagement', 'Dedicated success & SLAs'],
    cta: 'Contact us',
    href: '/contact',
    featured: false,
  },
]

export default function Pricing() {
  useEffect(() => {
    document.title = 'Pricing & Engagement – NB Aurum Solutions'
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', 'NB Aurum Solutions: Platform plans and engagement options. Payment collections & consultancy—performance-based, No Collection No Fee. Trial, Starter, Growth, Enterprise.')
    }
  }, [])

  return (
    <>
      <section className="mkt-section-full" aria-labelledby="pricing-heading">
        <div className="mkt-container mkt-container-wide">
          <div className="mkt-page-head">
            <h1 id="pricing-heading" className="mkt-section-heading">Pricing & engagement</h1>
            <p className="mkt-lead">
              Choose a platform plan for your team, or engage us for performance-based collections and consultancy. Start small, scale as you grow—with zero upfront risk where it matters.
            </p>
          </div>

          <div className="mkt-pricing-grid" style={{ marginTop: 48 }} role="list">
            {tiers.map((t) => (
              <article
                key={t.name}
                className={`mkt-pricing-card ${t.featured ? 'is-featured' : ''}`}
                role="listitem"
                aria-labelledby={`plan-${t.name.toLowerCase().replace(/\s/g, '-')}`}
              >
                <div className="mkt-pricing-name" id={`plan-${t.name.toLowerCase().replace(/\s/g, '-')}`}>
                  {t.name}
                </div>
                <div className="mkt-pricing-price">
                  {t.price}
                  {t.period && <span style={{ fontSize: '0.6em', fontWeight: 600, color: 'var(--mkt-muted)' }}>{t.period}</span>}
                </div>
                <div className="mkt-pricing-note">{t.note}</div>
                <ul className="mkt-pricing-list">
                  {t.features.map((f) => (
                    <li key={f} className="mkt-pricing-item">
                      <span className="mkt-check" aria-hidden="true" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={t.href}
                  className={`mkt-btn ${t.featured ? 'mkt-btn-primary' : 'mkt-btn-ghost'}`}
                  aria-label={`Choose ${t.name} plan`}
                >
                  {t.cta}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mkt-section-full muted" aria-labelledby="compare-heading">
        <div className="mkt-container mkt-container-wide">
          <div className="mkt-page-head">
            <h2 id="compare-heading" className="mkt-section-heading">Compare plans</h2>
            <p className="mkt-lead">
              Platform capabilities and engagement options to match your scale.
            </p>
          </div>
          <div className="mkt-card" style={{ marginTop: 48 }}>
            <h3 style={{ marginTop: 0, marginBottom: 20 }}>Feature breakdown</h3>
            <div className="mkt-pricing-table-wrapper">
              <table className="mkt-pricing-table" role="table" aria-label="Plan comparison">
                <thead>
                  <tr>
                    <th scope="col">Capability</th>
                    <th scope="col">Trial</th>
                    <th scope="col">Starter</th>
                    <th scope="col">Growth</th>
                    <th scope="col">Enterprise</th>
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
                    <td>Collections planning & MIS</td>
                    <td>Basic</td>
                    <td>Full</td>
                    <td>Advanced</td>
                    <td>Advanced + consultancy</td>
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
                    <td>Priority</td>
                    <td>Dedicated success</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="mkt-section-full" aria-labelledby="faq-heading">
        <div className="mkt-container mkt-container-wide">
          <div className="mkt-page-head">
            <h2 id="faq-heading" className="mkt-section-heading">Questions? We're here to help</h2>
            <p className="mkt-lead">
              Platform plans, collection engagement, and custom enterprise solutions.
            </p>
          </div>
          <div className="mkt-grid-2" style={{ marginTop: 48 }}>
            <div className="mkt-card">
              <h3>Frequently asked</h3>
              <ul className="mkt-benefit-list">
                <li>
                  <strong>Can we start in Trial and move to Growth?</strong>
                  <br />
                  Yes. Your data, users, and workflows stay intact; we apply the new limits and capabilities.
                </li>
                <li>
                  <strong>How does "No Collection, No Fee" work for consultancy?</strong>
                  <br />
                  Payment only upon successful recovery. Zero upfront cost, outcome-based pricing.
                </li>
                <li>
                  <strong>Where is my data stored?</strong>
                  <br />
                  Data is stored in a dedicated database for your environment. Access is governed by roles; we maintain full confidentiality.
                </li>
              </ul>
            </div>
            <div className="mkt-card">
              <h3>Custom enterprise & consultancy</h3>
              <p className="mkt-body">
                For large deployments, performance-based collection engagement, or strict compliance environments, we work with you to define a plan—platform, liaison, recovery, and support—tailored to your sector and geography.
              </p>
              <p className="mkt-body" style={{ marginTop: 12 }}>
                Share your requirements, regions, and timeline—we'll respond with a detailed proposal.
              </p>
              <Link to="/contact" className="mkt-btn mkt-btn-primary" style={{ marginTop: 20 }}>
                Contact us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
