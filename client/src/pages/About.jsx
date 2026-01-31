import { useEffect } from 'react'

export default function About() {
  useEffect(() => {
    document.title = 'About NB Aurum – Mission, Vision & Product Philosophy'
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Learn about NB Aurum: our mission to bring discipline and transparency to finance operations, our product philosophy, compliance focus, data security standards, and commitment to enterprise reliability.')
    }
  }, [])

  return (
    <>
      <section className="mkt-section-full">
        <div className="mkt-container">
          <div className="mkt-page-head">
            <h1 className="mkt-section-heading">About NB Aurum</h1>
            <p className="mkt-lead">
              We build a focused SaaS platform for finance and operations teams that need their receivables, payments, and
              collections to behave like one system—not scattered spreadsheets.
            </p>
          </div>

          <div className="mkt-illustration-block">
            <div>
              <h2 style={{ marginTop: 0 }}>Our mission</h2>
              <p className="mkt-body">
                Our mission is to bring discipline, transparency, and calm to day-to-day finance operations. We believe
                teams should see exactly where every rupee is in the PO → Invoice → Payment → Collection journey.
              </p>
              <h3 style={{ marginTop: 32 }}>Product philosophy</h3>
              <p className="mkt-body">
                NB Aurum is intentionally narrow. We focus on receivables, collections, and operational reporting—so the
                product stays opinionated, reliable, and easy to adopt across finance and operations.
              </p>
            </div>
            <div className="mkt-image-placeholder caption">
              <span>Company Mission</span>
              <div className="mkt-image-caption">Building focused solutions for finance teams</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mkt-section-full muted">
        <div className="mkt-container">
          <div className="mkt-page-head">
            <h2 className="mkt-section-heading">Compliance, security, and scalability</h2>
            <p className="mkt-lead">
              Enterprise-grade infrastructure built for reliability, security, and growth.
            </p>
          </div>
          <div className="mkt-grid-3" style={{ marginTop: 48 }}>
            <div className="mkt-card">
              <h3>Compliance & controls</h3>
              <p className="mkt-body">
                The platform is designed to keep a clear audit trail: who created which PO, who approved which invoice,
                and which payments affected which balances. Every critical action writes to MySQL with timestamps.
              </p>
            </div>
            <div className="mkt-card">
              <h3>Data security</h3>
              <p className="mkt-body">
                We use hardened authentication, hashed credentials, and role-based access. Separation between auth,
                business logic, and database layers keeps the system maintainable as you scale.
              </p>
            </div>
            <div className="mkt-card">
              <h3>Scalability</h3>
              <p className="mkt-body">
                The architecture scales linearly: stateless Node.js API, MySQL with normalized schema and indexes, and a
                frontend that talks only through versioned REST APIs.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mkt-section-full">
        <div className="mkt-container">
          <div className="mkt-page-head">
            <h2 className="mkt-section-heading">Our journey and values</h2>
            <p className="mkt-lead">
              From foundation to future—how we build and what we stand for.
            </p>
          </div>
          <div className="mkt-grid-2" style={{ marginTop: 48 }}>
            <div className="mkt-card">
              <h2>Our timeline & roadmap</h2>
              <ul className="mkt-timeline">
                <li>
                  <span className="mkt-timeline-dot" />
                  <div>
                    <strong>Foundation</strong>
                    <p>
                      We started by mapping real-world finance workflows—how POs, invoices, payments, and collections are
                      actually managed in teams.
                    </p>
                  </div>
                </li>
                <li>
                  <span className="mkt-timeline-dot" />
                  <div>
                    <strong>Core platform modules</strong>
                    <p>We then built Master Data, PO, Invoice, Payments, and Collection modules on a single schema.</p>
                  </div>
                </li>
                <li>
                  <span className="mkt-timeline-dot" />
                  <div>
                    <strong>Next</strong>
                    <p>
                      Expanding advanced reporting, configurable approval flows, and deeper integrations with your
                      existing financial stack.
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="mkt-card">
              <h2>Core values</h2>
              <ul className="mkt-benefit-list">
                <li>Respect for finance and operations work—no gimmicks, no noisy dashboards.</li>
                <li>Opinionated defaults that work out of the box for growing organizations.</li>
                <li>Honest, transparent communication with customers and partners.</li>
                <li>Reliability over vanity features: stable APIs, predictable behavior.</li>
              </ul>
              <div className="mkt-image-placeholder" style={{ marginTop: 20, aspectRatio: '16/9' }}>
                <span>Product Reliability</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
