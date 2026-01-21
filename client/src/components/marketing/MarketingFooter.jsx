import { Link } from 'react-router-dom'

export default function MarketingFooter() {
  return (
    <footer className="mkt-footer">
      <div className="mkt-footer-inner">
        <div className="mkt-footer-brand-section">
          <div className="mkt-footer-logo" aria-hidden="true">
            <img className="mkt-footer-logo-img" src="/logo.png" alt="Nbaurum ERP" />
          </div>
          <p>
            Nbaurum is a focused ERP SaaS platform for finance and operations teams. We help organizations
            structure invoicing, track receivables, and run disciplined collections—with full auditability
            and enterprise-grade controls.
          </p>
          <div className="mkt-footer-social">
            <a href="#" aria-label="LinkedIn" title="LinkedIn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                <rect x="2" y="9" width="4" height="12"></rect>
                <circle cx="4" cy="4" r="2"></circle>
              </svg>
            </a>
            <a href="#" aria-label="Twitter" title="Twitter">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
              </svg>
            </a>
            <a href="#" aria-label="GitHub" title="GitHub">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
              </svg>
            </a>
          </div>
        </div>

        <div className="mkt-footer-section">
          <h3>ERP Modules</h3>
          <ul>
            <li><Link to="/">Master Data</Link></li>
            <li><Link to="/">Purchase Orders</Link></li>
            <li><Link to="/">Invoices</Link></li>
            <li><Link to="/">Payments</Link></li>
            <li><Link to="/">Collections</Link></li>
            <li><Link to="/">Reports & Analytics</Link></li>
          </ul>
        </div>

        <div className="mkt-footer-section">
          <h3>Solutions</h3>
          <ul>
            <li><Link to="/">For Finance Teams</Link></li>
            <li><Link to="/">For Sales Operations</Link></li>
            <li><Link to="/">For Operations Leaders</Link></li>
            <li><Link to="/">Enterprise Collections</Link></li>
            <li><Link to="/">Shared Services</Link></li>
          </ul>
        </div>

        <div className="mkt-footer-section">
          <h3>Resources</h3>
          <ul>
            <li><Link to="/">Documentation</Link></li>
            <li><Link to="/">Blog</Link></li>
            <li><Link to="/">Help Center</Link></li>
            <li><Link to="/">FAQs</Link></li>
            <li><Link to="/">API Reference</Link></li>
            <li><Link to="/contact">Contact Support</Link></li>
          </ul>
        </div>

        <div className="mkt-footer-section">
          <h3>Company</h3>
          <ul>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/who-we-are">Who We Are</Link></li>
            <li><Link to="/pricing">Pricing</Link></li>
            <li><Link to="/">Privacy Policy</Link></li>
            <li><Link to="/">Terms of Service</Link></li>
            <li><Link to="/">Security</Link></li>
          </ul>
        </div>
      </div>

      <div className="mkt-footer-bottom">
        <div className="mkt-footer-meta">
          <span>© {new Date().getFullYear()} Nbaurum ERP Pvt. Ltd. All rights reserved.</span>
        </div>
        <div className="mkt-footer-trust">
          <div className="mkt-footer-trust-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            <span>Enterprise Security</span>
          </div>
          <div className="mkt-footer-trust-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4"></path>
              <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"></path>
              <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"></path>
            </svg>
            <span>Compliance Ready</span>
          </div>
          <div className="mkt-footer-trust-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>99.9% Uptime</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
