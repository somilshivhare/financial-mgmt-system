import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <section className="mkt-hero">
      <div className="mkt-container">
        <div className="mkt-hero-grid">
          <div className="mkt-hero-copy">
            <div className="mkt-eyebrow">Enterprise receivables & collections</div>
            <h1 className="mkt-h1">Finance operations, structured for scale.</h1>
            <p className="mkt-lead">
              Nbaurum helps teams invoice faster, track dues confidently, and run collections with clear workflows—built for ERP-grade control.
            </p>

            <div className="mkt-hero-actions">
              <Link to="/register" className="mkt-btn mkt-btn-primary mkt-btn-lg">
                Start
              </Link>
              <Link to="/login" className="mkt-btn mkt-btn-ghost mkt-btn-lg">
                Login
              </Link>
            </div>

            <div className="mkt-trust">
              <div className="mkt-trust-item">
                <span className="mkt-dot" aria-hidden="true" />
                <span>Audit-friendly records</span>
              </div>
              <div className="mkt-trust-item">
                <span className="mkt-dot" aria-hidden="true" />
                <span>Role-based access</span>
              </div>
              <div className="mkt-trust-item">
                <span className="mkt-dot" aria-hidden="true" />
                <span>Operational visibility</span>
              </div>
            </div>
          </div>

          <div className="mkt-hero-visual" aria-hidden="true">
            <div className="mkt-visual-card">
              <div className="mkt-visual-top">
                <div className="mkt-visual-title">Collections Snapshot</div>
                <div className="mkt-pill">Live</div>
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
            </div>
          </div>
        </div>

        <div className="mkt-section">
          <h2 className="mkt-h2">Built for invoices, dues, and collections workflows</h2>
          <div className="mkt-grid-3">
            <div className="mkt-feature">
              <div className="mkt-feature-title">Invoicing</div>
              <div className="mkt-feature-body">Create and manage invoices with consistent entries, history, and tracking.</div>
            </div>
            <div className="mkt-feature">
              <div className="mkt-feature-title">Collections</div>
              <div className="mkt-feature-body">Plan follow-ups, track payments, and keep receivables visible across teams.</div>
            </div>
            <div className="mkt-feature">
              <div className="mkt-feature-title">Controls</div>
              <div className="mkt-feature-body">A clean access portal and ERP-ready structure designed for secure operations.</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}


