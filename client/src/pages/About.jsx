import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function About() {
  useEffect(() => {
    document.title = 'About NB Aurum Solutions – Mission, Vision & Values'
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Learn about NB Aurum Solutions: mission to bring discipline and transparency to finance operations, product philosophy, compliance, and enterprise reliability. Invoicing, receivables, collections software.')
    }
  }, [])

  return (
    <>
      <section className="mkt-section-full" aria-labelledby="about-heading">
        <div className="mkt-container mkt-container-wide">
          <div className="mkt-page-head">
            <h1 id="about-heading" className="mkt-section-heading">About NB Aurum Solutions</h1>
            <p className="mkt-lead">
              We build an enterprise SaaS platform for finance and operations teams—so receivables, payments, and collections behave like one system, not scattered spreadsheets.
            </p>
          </div>

          <div className="mkt-illustration-block">
            <div>
              <h2 style={{ marginTop: 0 }}>Our mission</h2>
              <p className="mkt-body">
                Our mission is to bring discipline, transparency, and calm to day-to-day finance operations. We believe teams should see exactly where every rupee is in the journey from PO to invoice to payment to collection.
              </p>
              <h3 style={{ marginTop: 32 }}>Product philosophy</h3>
              <p className="mkt-body">
                NB Aurum Solutions is intentionally focused. We concentrate on receivables, collections, and operational reporting—so the product stays opinionated, reliable, and easy to adopt across finance and operations.
              </p>
              <Link to="/who-we-are" className="mkt-btn mkt-btn-ghost" style={{ marginTop: 24 }}>
                Who we are
              </Link>
            </div>
            <div className="mkt-image-placeholder caption" aria-hidden="true">
              <span>Mission</span>
              <div className="mkt-image-caption">Focused solutions for finance teams</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mkt-section-full muted" aria-labelledby="compliance-heading">
        <div className="mkt-container mkt-container-wide">
          <div className="mkt-page-head">
            <h2 id="compliance-heading" className="mkt-section-heading">Compliance, security & scalability</h2>
            <p className="mkt-lead">
              Enterprise-grade infrastructure built for reliability, security, and growth.
            </p>
          </div>
          <div className="mkt-grid-3" style={{ marginTop: 48 }}>
            <div className="mkt-card">
              <h3>Compliance & controls</h3>
              <p className="mkt-body">
                The platform keeps a clear audit trail: who created which PO, who approved which invoice, and which payments affected which balances. Every critical action is timestamped and traceable.
              </p>
            </div>
            <div className="mkt-card">
              <h3>Data security</h3>
              <p className="mkt-body">
                Hardened authentication, hashed credentials, and role-based access. Separation between auth, business logic, and data layers keeps the system maintainable as you scale.
              </p>
            </div>
            <div className="mkt-card">
              <h3>Scalability</h3>
              <p className="mkt-body">
                Stateless API, normalized schema and indexes, and a frontend that talks only through versioned REST APIs—built to grow with you.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mkt-section-full" aria-labelledby="values-heading">
        <div className="mkt-container mkt-container-wide">
          <div className="mkt-page-head">
            <h2 id="values-heading" className="mkt-section-heading">Our journey and values</h2>
            <p className="mkt-lead">
              From foundation to future—how we build and what we stand for.
            </p>
          </div>
          <div className="mkt-grid-2" style={{ marginTop: 48 }}>
            <div className="mkt-card">
              <h3>Timeline & roadmap</h3>
              <ul className="mkt-timeline">
                <li>
                  <span className="mkt-timeline-dot" aria-hidden="true" />
                  <div>
                    <strong>Foundation</strong>
                    <p>
                      We started by mapping real-world finance workflows—how POs, invoices, payments, and collections are actually managed in teams.
                    </p>
                  </div>
                </li>
                <li>
                  <span className="mkt-timeline-dot" aria-hidden="true" />
                  <div>
                    <strong>Core platform</strong>
                    <p>We built Master Data, PO, Invoice, Payments, and Collection modules on a single schema.</p>
                  </div>
                </li>
                <li>
                  <span className="mkt-timeline-dot" aria-hidden="true" />
                  <div>
                    <strong>Next</strong>
                    <p>
                      Expanding advanced reporting, configurable approval flows, and deeper integrations with your financial stack.
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="mkt-card">
              <h3>Core values</h3>
              <ul className="mkt-benefit-list">
                <li>Respect for finance and operations work—no gimmicks, no noisy dashboards.</li>
                <li>Opinionated defaults that work out of the box for growing organizations.</li>
                <li>Honest, transparent communication with customers and partners.</li>
                <li>Reliability over vanity features: stable APIs, predictable behavior.</li>
              </ul>
              <div className="mkt-image-placeholder" style={{ marginTop: 24, aspectRatio: '16/9' }} aria-hidden="true">
                <span>Reliability</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mkt-section-full muted">
        <div className="mkt-container mkt-container-wide">
          <div className="mkt-page-head">
            <h2 className="mkt-section-heading">What differentiates NB Aurum Solutions</h2>
            <p className="mkt-lead">
              We focus on a few things and do them well—so you get clarity, not complexity.
            </p>
          </div>
          <div className="mkt-grid-3" style={{ marginTop: 48 }}>
            <div className="mkt-card">
              <h3>Focused scope</h3>
              <p className="mkt-body">
                We don’t try to be an ERP. We solve receivables, invoicing, and collections with depth—so the product stays understandable and maintainable.
              </p>
            </div>
            <div className="mkt-card">
              <h3>Single source of truth</h3>
              <p className="mkt-body">
                One database, one workflow. Master Data, POs, Invoices, and Payments are connected—no sync issues, no duplicate data.
              </p>
            </div>
            <div className="mkt-card">
              <h3>Enterprise-ready from day one</h3>
              <p className="mkt-body">
                Audit trails, role-based access, and clear ownership are built in—so you can adopt with confidence at any scale.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
