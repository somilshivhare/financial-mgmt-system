import { Link } from 'react-router-dom'
import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    document.title = 'NB Aurum – Enterprise Finance & Collections Platform'
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', 'NB Aurum is a focused SaaS platform for finance teams. Manage invoices, track receivables, and run disciplined collections with enterprise-grade controls, audit trails, and role-based access.')
    }
  }, [])

  return (
    <>
      {/* Hero Section */}
      <section className="mkt-hero">
        <div className="mkt-container">
          <div className="mkt-hero-grid">
            <div className="mkt-hero-copy">
              <div className="mkt-eyebrow">Enterprise receivables & enterprise-grade controls</div>
              <h1>A single workspace for invoices, dues, and collections.</h1>
              <p className="mkt-lead">
                NB Aurum is a focused SaaS platform for finance and operations teams that need structured invoicing, live
                receivables, and disciplined collections—without losing auditability or control.
              </p>

              <div className="mkt-hero-actions">
                <Link to="/register" className="mkt-btn mkt-btn-primary mkt-btn-lg">
                  Get started
                </Link>
                <Link to="/contact" className="mkt-btn mkt-btn-ghost mkt-btn-lg">
                  Request a demo
                </Link>
              </div>

              <div className="mkt-trust">
                <div className="mkt-trust-item">
                  <span className="mkt-dot" aria-hidden="true" />
                  <span>Strong role-based access</span>
                </div>
                <div className="mkt-trust-item">
                  <span className="mkt-dot" aria-hidden="true" />
                  <span>Full audit trail of invoices & payments</span>
                </div>
                <div className="mkt-trust-item">
                  <span className="mkt-dot" aria-hidden="true" />
                  <span>Ready for finance & collections teams</span>
                </div>
              </div>
            </div>

            <div className="mkt-hero-visual">
              <div className="mkt-visual-card">
                <div className="mkt-visual-top">
                  <div className="mkt-visual-title">Collections Snapshot</div>
                  <div className="mkt-pill">Live data</div>
                </div>
                <div className="mkt-kpi-grid">
                  <div className="mkt-kpi">
                    <div className="mkt-kpi-label">Outstanding</div>
                    <div className="mkt-kpi-value">₹24.2L</div>
                  </div>
                  <div className="mkt-kpi">
                    <div className="mkt-kpi-label">On-time</div>
                    <div className="mkt-kpi-value">92%</div>
                  </div>
                </div>
                <div className="mkt-mini-chart" />
                <div className="mkt-mini-table">
                  <div className="mkt-mini-row mkt-mini-head">
                    <span>Account</span>
                    <span>Due</span>
                    <span>Status</span>
                  </div>
                  <div className="mkt-mini-row">
                    <span>Acme Corp.</span>
                    <span>₹4.8L</span>
                    <span className="mkt-status mkt-status-warn">Due soon</span>
                  </div>
                  <div className="mkt-mini-row">
                    <span>Northwind</span>
                    <span>₹2.1L</span>
                    <span className="mkt-status mkt-status-ok">Paid</span>
                  </div>
                  <div className="mkt-mini-row">
                    <span>Globex</span>
                    <span>₹3.4L</span>
                    <span className="mkt-status">Planned</span>
                  </div>
                </div>

                <button type="button" className="mkt-video-thumb" aria-label="Play product overview video">
                  <div className="mkt-video-thumb-inner">
                    <span className="mkt-video-ring" />
                    <span className="mkt-video-play" />
                  </div>
                  <span className="mkt-video-caption">2 min overview · Product walkthrough</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Modules Overview with Visuals */}
      <section className="mkt-section-full">
        <div className="mkt-container">
          <div className="mkt-page-head">
            <h2 className="mkt-section-heading">Platform modules aligned with finance reality</h2>
            <p className="mkt-lead">
              Every module is wired to a single source of truth in the database, so Master Data, PO, Invoices, Payments,
              and Collections always stay in sync.
            </p>
          </div>

          <div className="mkt-grid-3" style={{ marginTop: 48 }}>
            <div className="mkt-card">
              <div className="mkt-image-placeholder" style={{ marginBottom: 16, aspectRatio: '4/3' }}>
                <span>Master Data Management</span>
              </div>
              <div className="mkt-feature-title">Master Data</div>
              <p className="mkt-feature-body">
                Normalize customers, products, business units, segments, regions, and zones. Keep profiles structured
                for downstream reporting.
              </p>
            </div>
            <div className="mkt-card">
              <div className="mkt-image-placeholder" style={{ marginBottom: 16, aspectRatio: '4/3' }}>
                <span>PO & Invoice Workflow</span>
              </div>
              <div className="mkt-feature-title">PO & Invoices</div>
              <p className="mkt-feature-body">
                Create POs, control approvals, and generate invoices with balances and due stages directly tied to the
                underlying orders.
              </p>
            </div>
            <div className="mkt-card">
              <div className="mkt-image-placeholder" style={{ marginBottom: 16, aspectRatio: '4/3' }}>
                <span>Payments & Collections</span>
              </div>
              <div className="mkt-feature-title">Payments & Collections</div>
              <p className="mkt-feature-body">
                Record payments with deductions, track balances, plan collections, and see live dashboards for risk and
                coverage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="mkt-section-full muted">
        <div className="mkt-container">
          <div className="mkt-page-head">
            <h2 className="mkt-section-heading">Live dashboards for finance leaders</h2>
            <p className="mkt-lead">
              Real-time insights, visual analytics, and executive-ready reports—all in one unified dashboard.
            </p>
          </div>
          <div className="mkt-illustration-block">
            <div>
              <p className="mkt-body">
                See real-time receivables, overdue trends, payment patterns, and collection effectiveness—all in one
                unified view. No more piecing together spreadsheets or waiting for end-of-month reports.
              </p>
              <ul className="mkt-benefit-list" style={{ marginTop: 20 }}>
                <li>Aggregated KPIs: total outstanding, overdue count, collection rate</li>
                <li>Invoice status breakdowns and payment timeline visualizations</li>
                <li>Customer-level insights and risk indicators</li>
                <li>Export-ready reports for executive presentations</li>
              </ul>
            </div>
            <div className="mkt-image-placeholder caption">
              <span>Dashboard Preview</span>
              <div className="mkt-image-caption">Finance Dashboard – Collections Overview</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits + Use Cases */}
      <section className="mkt-section-full">
        <div className="mkt-container">
          <div className="mkt-page-head">
            <h2 className="mkt-section-heading">Why teams trust NB Aurum</h2>
            <p className="mkt-lead">
              Built for finance professionals who need clarity, control, and confidence in their operations.
            </p>
          </div>
          <div className="mkt-grid-2" style={{ marginTop: 48 }}>
            <div className="mkt-card">
              <h3>Why finance teams choose NB Aurum</h3>
              <ul className="mkt-benefit-list">
                <li>Reduce receivables surprises with live balances and overdue views.</li>
                <li>Move out of spreadsheets without losing auditability or controls.</li>
                <li>Give sales, finance, and collections the same source of truth.</li>
                <li>Go from “where is this invoice?” to “one click and you know”.</li>
                <li>Scale operations without adding manual reconciliation overhead.</li>
                <li>Meet compliance requirements with built-in audit trails.</li>
              </ul>
            </div>
            <div className="mkt-card">
              <h3>Real-world use cases</h3>
              <div className="mkt-usecases">
                <div className="mkt-usecase">
                  <h4>Shared services finance</h4>
                  <p>
                    Centralize invoice and payment operations for multiple business units while preserving segregation of
                    duties and role-based access.
                  </p>
                </div>
                <div className="mkt-usecase">
                  <h4>Project-based organizations</h4>
                  <p>
                    Tie receivables to projects and milestones, track due stages, and ensure every PO and invoice is
                    visible in one workspace.
                  </p>
                </div>
                <div className="mkt-usecase">
                  <h4>Collections teams</h4>
                  <p>
                    Plan follow-ups, log actions, and see impact on balances in the same place—no more stitched-together
                    trackers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Diagram */}
      <section className="mkt-section-full muted">
        <div className="mkt-container">
          <div className="mkt-page-head">
            <h2 className="mkt-section-heading">From PO to payment—designed as one workflow</h2>
            <p className="mkt-lead">
              Each stage connects seamlessly, ensuring data integrity and eliminating manual reconciliation.
            </p>
          </div>
          <div className="mkt-illustration-block">
            <div className="mkt-workflow-diagram">
              <div className="mkt-workflow-step">
                <div className="mkt-workflow-step-number">1</div>
                <div className="mkt-workflow-step-content">
                  <h4>PO captured</h4>
                  <p>Master data drives a clean PO structure with customers, products, and terms.</p>
                </div>
              </div>
              <div className="mkt-workflow-step">
                <div className="mkt-workflow-step-number">2</div>
                <div className="mkt-workflow-step-content">
                  <h4>Invoice issued</h4>
                  <p>
                    Invoice data, tax amounts, and due stages are computed from the PO and stored for reporting.
                  </p>
                </div>
              </div>
              <div className="mkt-workflow-step">
                <div className="mkt-workflow-step-number">3</div>
                <div className="mkt-workflow-step-content">
                  <h4>Payment & collections</h4>
                  <p>
                    Payments update balances via controlled rules; collection plans and actions read from live data.
                  </p>
                </div>
              </div>
            </div>
            <div className="mkt-image-placeholder caption">
              <span>Workflow Diagram</span>
              <div className="mkt-image-caption">End-to-End Finance Workflow</div>
            </div>
          </div>

          <div className="mkt-trust-logos" style={{ marginTop: 32 }}>
            <span className="mkt-trust-label">Built for teams that care about:</span>
            <div className="mkt-trust-chips">
              <span className="mkt-chip">Audit readiness</span>
              <span className="mkt-chip">Role-based security</span>
              <span className="mkt-chip">Data residency & control</span>
              <span className="mkt-chip">Reliable reporting</span>
            </div>
          </div>
        </div>
      </section>

      {/* AI-Powered Finance (Upcoming) */}
      <section className="mkt-section-full primary">
        <div className="mkt-container">
          <div className="mkt-page-head">
            <div className="mkt-eyebrow">
              Upcoming capability
            </div>
            <h2 className="mkt-section-heading">AI-Powered Finance Intelligence</h2>
            <p className="mkt-lead">
              We're building intelligent features that will help finance teams predict payments, forecast cash flow,
              identify collection risks early, and automate routine insights—all while maintaining the transparency and
              control you need.
            </p>
          </div>

          <div className="mkt-grid-2" style={{ marginTop: 48 }}>
            <div className="mkt-card">
              <h3 style={{ color: 'var(--mkt-text)' }}>Intelligent collections</h3>
              <p className="mkt-body">
                AI will analyze payment history, invoice patterns, and customer behavior to suggest optimal follow-up
                timing and prioritize high-risk accounts. You'll get actionable recommendations, not black-box
                predictions.
              </p>
            </div>
            <div className="mkt-card">
              <h3 style={{ color: 'var(--mkt-text)' }}>Payment predictions</h3>
              <p className="mkt-body">
                Forecast when invoices are likely to be paid based on historical data, seasonal trends, and customer
                payment velocity. Improve cash-flow planning with confidence intervals and scenario modeling.
              </p>
            </div>
            <div className="mkt-card">
              <h3 style={{ color: 'var(--mkt-text)' }}>Cash-flow forecasting</h3>
              <p className="mkt-body">
                Generate forward-looking cash-flow projections that account for expected payments, seasonal variations,
                and business cycles. See confidence bands and adjust assumptions on the fly.
              </p>
            </div>
            <div className="mkt-card">
              <h3 style={{ color: 'var(--mkt-text)' }}>Risk alerts & insights</h3>
              <p className="mkt-body">
                Automatically flag unusual patterns—late payments from historically on-time customers, concentration
                risks, or invoice disputes—so you can act before they become problems.
              </p>
            </div>
          </div>

          <div style={{ marginTop: 48, textAlign: 'center' }}>
            <p className="mkt-body">
              AI features will be built on top of our existing platform foundation, ensuring they respect your data controls,
              audit requirements, and business rules. No shortcuts, no compromise on transparency.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="mkt-section-full">
        <div className="mkt-container">
          <div className="mkt-cta-footer">
            <div>
              <h2>Ready to structure your finance operations?</h2>
              <p className="mkt-body">
                Start with a trial space or schedule a guided walkthrough with our team. No noisy UI, no half-finished
                workflows—just enterprise-grade clarity.
              </p>
            </div>
            <div className="mkt-cta-actions">
              <Link to="/register" className="mkt-btn mkt-btn-primary mkt-btn-lg">
                Get started in minutes
              </Link>
              <Link to="/contact" className="mkt-btn mkt-btn-ghost mkt-btn-lg">
                Talk to us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
