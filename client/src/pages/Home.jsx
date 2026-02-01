import { Link } from 'react-router-dom'
import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    document.title = 'NB Aurum Solutions – Enterprise Finance, Invoicing & Collections Platform'
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', 'NB Aurum Solutions is an enterprise SaaS platform for finance teams. Manage invoices, track receivables, run collections, PO management, and payments with audit trails, RBAC, and compliance-ready controls. Your Dues. Our Duty.')
    }
  }, [])

  return (
    <>
      {/* Hero Section */}
      <section className="mkt-hero" aria-labelledby="hero-heading">
        <div className="mkt-container mkt-container-wide">
          <div className="mkt-hero-grid">
            <div className="mkt-hero-copy mkt-animate-in">
              <div className="mkt-eyebrow" aria-hidden="true">
                Enterprise receivables & controls
              </div>
              <h1 id="hero-heading">
                One platform for invoices, receivables, and collections.
              </h1>
              <p className="mkt-lead">
                NB Aurum Solutions gives finance and operations teams a single source of truth: structured invoicing, live receivables visibility, and disciplined collections—with full auditability and enterprise-grade controls.
              </p>

              <div className="mkt-hero-actions">
                <Link to="/register" className="mkt-btn mkt-btn-primary mkt-btn-lg">
                  Get started
                </Link>
                <Link to="/contact" className="mkt-btn mkt-btn-ghost mkt-btn-lg">
                  Request a demo
                </Link>
              </div>

              <div className="mkt-trust" role="list">
                <div className="mkt-trust-item" role="listitem">
                  <span className="mkt-dot" aria-hidden="true" />
                  <span>Role-based access & security</span>
                </div>
                <div className="mkt-trust-item" role="listitem">
                  <span className="mkt-dot" aria-hidden="true" />
                  <span>Full audit trail</span>
                </div>
                <div className="mkt-trust-item" role="listitem">
                  <span className="mkt-dot" aria-hidden="true" />
                  <span>Built for finance teams</span>
                </div>
              </div>
            </div>

            <div className="mkt-hero-visual mkt-animate-in mkt-animate-in-delay-2">
              <div className="mkt-visual-card">
                <div className="mkt-visual-top">
                  <div className="mkt-visual-title">Collections snapshot</div>
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
                <div className="mkt-mini-chart" aria-hidden="true" />
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
                    <span className="mkt-video-ring" aria-hidden="true" />
                    <span className="mkt-video-play" aria-hidden="true" />
                  </div>
                  <span className="mkt-video-caption">2 min overview · Product walkthrough</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform modules */}
      <section className="mkt-section-full muted" aria-labelledby="platform-heading">
        <div className="mkt-container mkt-container-wide">
          <div className="mkt-page-head">
            <h2 id="platform-heading" className="mkt-section-heading">Platform built for finance reality</h2>
            <p className="mkt-lead">
              Every module connects to a single source of truth. Master Data, POs, Invoices, Payments, and Collections stay in sync—no spreadsheets, no guesswork.
            </p>
          </div>

          <div className="mkt-grid-3" style={{ marginTop: 48 }}>
            <div className="mkt-card mkt-animate-in">
              <div className="mkt-image-placeholder" style={{ marginBottom: 20, aspectRatio: '4/3' }} aria-hidden="true">
                <span>Master Data</span>
              </div>
              <div className="mkt-feature-title">Master Data</div>
              <p className="mkt-feature-body">
                Normalize customers, products, business units, segments, and regions. Keep profiles structured for reporting and workflows.
              </p>
            </div>
            <div className="mkt-card mkt-animate-in mkt-animate-in-delay-1">
              <div className="mkt-image-placeholder" style={{ marginBottom: 20, aspectRatio: '4/3' }} aria-hidden="true">
                <span>PO & Invoices</span>
              </div>
              <div className="mkt-feature-title">PO & Invoices</div>
              <p className="mkt-feature-body">
                Create POs, control approvals, and generate invoices. Balances and due stages tie directly to orders—one workflow, one truth.
              </p>
            </div>
            <div className="mkt-card mkt-animate-in mkt-animate-in-delay-2">
              <div className="mkt-image-placeholder" style={{ marginBottom: 20, aspectRatio: '4/3' }} aria-hidden="true">
                <span>Payments & Collections</span>
              </div>
              <div className="mkt-feature-title">Payments & Collections</div>
              <p className="mkt-feature-body">
                Record payments, track balances, plan collections, and see live dashboards for risk and coverage—all in one place.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboards */}
      <section className="mkt-section-full" aria-labelledby="dashboards-heading">
        <div className="mkt-container mkt-container-wide">
          <div className="mkt-page-head">
            <h2 id="dashboards-heading" className="mkt-section-heading">Live dashboards for finance leaders</h2>
            <p className="mkt-lead">
              Real-time insights, visual analytics, and executive-ready reports—unified in one dashboard.
            </p>
          </div>
          <div className="mkt-illustration-block">
            <div>
              <p className="mkt-body">
                See real-time receivables, overdue trends, payment patterns, and collection effectiveness in a single view. No more piecing together spreadsheets or waiting for month-end.
              </p>
              <ul className="mkt-benefit-list" style={{ marginTop: 24 }}>
                <li>Aggregated KPIs: total outstanding, overdue count, collection rate</li>
                <li>Invoice status breakdowns and payment timeline visualizations</li>
                <li>Customer-level insights and risk indicators</li>
                <li>Export-ready reports for executive presentations</li>
              </ul>
            </div>
            <div className="mkt-image-placeholder caption" aria-hidden="true">
              <span>Dashboard</span>
              <div className="mkt-image-caption">Finance dashboard – collections overview</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why NB Aurum Solutions */}
      <section className="mkt-section-full muted" aria-labelledby="why-heading">
        <div className="mkt-container mkt-container-wide">
          <div className="mkt-page-head">
            <h2 id="why-heading" className="mkt-section-heading">Why teams trust NB Aurum Solutions</h2>
            <p className="mkt-lead">
              Built for finance professionals who need clarity, control, and confidence.
            </p>
          </div>
          <div className="mkt-grid-2" style={{ marginTop: 48 }}>
            <div className="mkt-card">
              <h3>Why finance teams choose us</h3>
              <ul className="mkt-benefit-list">
                <li>Reduce receivables surprises with live balances and overdue views.</li>
                <li>Move out of spreadsheets without losing auditability or controls.</li>
                <li>Give sales, finance, and collections the same source of truth.</li>
                <li>Go from “where is this invoice?” to “one click and you know”.</li>
                <li>Scale operations without manual reconciliation overhead.</li>
                <li>Meet compliance requirements with built-in audit trails.</li>
              </ul>
            </div>
            <div className="mkt-card">
              <h3>Real-world use cases</h3>
              <div className="mkt-usecases">
                <div className="mkt-usecase">
                  <h4>Shared services finance</h4>
                  <p>
                    Centralize invoice and payment operations for multiple business units with segregation of duties and role-based access.
                  </p>
                </div>
                <div className="mkt-usecase">
                  <h4>Project-based organizations</h4>
                  <p>
                    Tie receivables to projects and milestones. Every PO and invoice visible in one workspace.
                  </p>
                </div>
                <div className="mkt-usecase">
                  <h4>Collections teams</h4>
                  <p>
                    Plan follow-ups, log actions, and see impact on balances in the same place—no stitched trackers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="mkt-section-full" aria-labelledby="workflow-heading">
        <div className="mkt-container mkt-container-wide">
          <div className="mkt-page-head">
            <h2 id="workflow-heading" className="mkt-section-heading">From PO to payment—one workflow</h2>
            <p className="mkt-lead">
              Each stage connects seamlessly. Data integrity and no manual reconciliation.
            </p>
          </div>
          <div className="mkt-illustration-block">
            <div className="mkt-workflow-diagram">
              <div className="mkt-workflow-step">
                <div className="mkt-workflow-step-number" aria-hidden="true">1</div>
                <div className="mkt-workflow-step-content">
                  <h4>PO captured</h4>
                  <p>Master data drives a clean PO structure with customers, products, and terms.</p>
                </div>
              </div>
              <div className="mkt-workflow-step">
                <div className="mkt-workflow-step-number" aria-hidden="true">2</div>
                <div className="mkt-workflow-step-content">
                  <h4>Invoice issued</h4>
                  <p>Invoice data, tax amounts, and due stages are computed from the PO and stored for reporting.</p>
                </div>
              </div>
              <div className="mkt-workflow-step">
                <div className="mkt-workflow-step-number" aria-hidden="true">3</div>
                <div className="mkt-workflow-step-content">
                  <h4>Payment & collections</h4>
                  <p>Payments update balances via controlled rules; collection plans read from live data.</p>
                </div>
              </div>
            </div>
            <div className="mkt-image-placeholder caption" aria-hidden="true">
              <span>Workflow</span>
              <div className="mkt-image-caption">End-to-end finance workflow</div>
            </div>
          </div>

          <div className="mkt-trust-logos" style={{ marginTop: 32 }}>
            <span className="mkt-trust-label">Built for teams that care about:</span>
            <div className="mkt-trust-chips">
              <span className="mkt-chip">Audit readiness</span>
              <span className="mkt-chip">Role-based security</span>
              <span className="mkt-chip">Data control</span>
              <span className="mkt-chip">Reliable reporting</span>
            </div>
          </div>
        </div>
      </section>

      {/* AI (upcoming) */}
      <section className="mkt-section-full primary" aria-labelledby="ai-heading">
        <div className="mkt-container mkt-container-wide">
          <div className="mkt-page-head">
            <div className="mkt-eyebrow" style={{ background: 'rgba(255,255,255,0.15)', color: '#e2e8f0' }}>
              Coming soon
            </div>
            <h2 id="ai-heading" className="mkt-section-heading">AI-powered finance intelligence</h2>
            <p className="mkt-lead">
              We're building intelligent features to help finance teams predict payments, forecast cash flow, identify collection risks early, and automate routine insights—with the transparency and control you need.
            </p>
          </div>

          <div className="mkt-grid-2" style={{ marginTop: 48 }}>
            <div className="mkt-card">
              <h3>Intelligent collections</h3>
              <p className="mkt-body">
                AI will analyze payment history and customer behavior to suggest optimal follow-up timing and prioritize high-risk accounts—actionable recommendations, not black-box predictions.
              </p>
            </div>
            <div className="mkt-card">
              <h3>Payment predictions & forecasting</h3>
              <p className="mkt-body">
                Forecast when invoices are likely to be paid. Improve cash-flow planning with confidence intervals and scenario modeling.
              </p>
            </div>
            <div className="mkt-card">
              <h3>Cash-flow forecasting</h3>
              <p className="mkt-body">
                Forward-looking projections that account for expected payments, seasonal variations, and business cycles.
              </p>
            </div>
            <div className="mkt-card">
              <h3>Risk alerts & insights</h3>
              <p className="mkt-body">
                Automatically flag unusual patterns—late payments, concentration risks, or disputes—so you can act before they become problems.
              </p>
            </div>
          </div>

          <p className="mkt-body" style={{ marginTop: 48, textAlign: 'center', maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' }}>
            AI features will sit on top of our existing platform, respecting your data controls, audit requirements, and business rules.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="mkt-section-full muted" aria-labelledby="cta-heading">
        <div className="mkt-container mkt-container-wide">
          <div className="mkt-cta-footer">
            <div>
              <h2 id="cta-heading">Ready to structure your finance operations?</h2>
              <p className="mkt-body">
                Start with a trial or schedule a guided walkthrough. Enterprise-grade clarity—no noisy UI, no half-finished workflows.
              </p>
            </div>
            <div className="mkt-cta-actions">
              <Link to="/register" className="mkt-btn mkt-btn-primary mkt-btn-lg">
                Get started
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
