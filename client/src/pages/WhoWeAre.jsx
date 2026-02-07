import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function WhoWeAre() {
  useEffect(() => {
    document.title = 'Who We Are – NB Aurum Solutions Team & Philosophy'
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Meet the team behind NB Aurum Solutions. Payment collections & consultancy for Power, Solar, Telecom, Railways, PSUs & Government. 20+ years expertise, integrity first, PAN-India.')
    }
  }, [])

  return (
    <>
      <section className="mkt-section-full" aria-labelledby="who-heading">
        <div className="mkt-container mkt-container-wide">
          <div className="mkt-page-head">
            <h1 id="who-heading" className="mkt-section-heading">Who we are</h1>
            <p className="mkt-lead">
              We are your trusted partner in payment collections and consultancy—with 20+ years of expertise in Power, Solar, Telecom, Railways, PSU's and Government projects across India.
            </p>
          </div>

          <div className="mkt-illustration-block">
            <div className="mkt-image-placeholder caption" style={{ aspectRatio: '4/3' }} aria-hidden="true">
              <span>Our team</span>
              <div className="mkt-image-caption">PAN-India · Integrity first</div>
            </div>
            <div>
              <div className="mkt-grid-3" style={{ gap: 24 }}>
                <div className="mkt-card">
                  <h3>Why we do this</h3>
                  <p className="mkt-body">
                    We saw teams struggle with delayed payments, stuck retention money, and complex liaison with utilities and authorities. NB Aurum Solutions exists to set processes right, recover what's due, and close contracts with full compliance—so you can focus on growth.
                  </p>
                </div>
                <div className="mkt-card">
                  <h3>Who we serve</h3>
                  <p className="mkt-body">
                    Companies in Power, Solar, Telecom, Railways, PSUs and Government projects—PAN India. We serve finance leaders, project teams, and operations who need aggressive payment realization, dispute resolution, and end-to-end collection support.
                  </p>
                </div>
                <div className="mkt-card">
                  <h3>How we work</h3>
                  <p className="mkt-body">
                    Dedicated liaison, regular MIS, diplomatic negotiation, and a "Never say No" attitude. We combine on-ground expertise with process-driven compliance so you get faster collections and preserved relationships.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mkt-section-full muted" aria-labelledby="philosophy-heading">
        <div className="mkt-container mkt-container-wide">
          <div className="mkt-page-head">
            <h2 id="philosophy-heading" className="mkt-section-heading">Our philosophy and commitment</h2>
            <p className="mkt-lead">
              Integrity first, full compliance, and reputation-preserving recovery.
            </p>
          </div>
          <div className="mkt-grid-2" style={{ marginTop: 48 }}>
            <div className="mkt-card">
              <h3>Our philosophy</h3>
              <p className="mkt-body">
                Set processes right the first time. Build strong customer relationships. Ensure full policy and document compliance. Deliver end-to-end service. We operate with a "Never say No" attitude—so your cash flow is secured and your contracts close without friction.
              </p>
              <div className="mkt-image-placeholder" style={{ marginTop: 24, aspectRatio: '16/9' }} aria-hidden="true">
                <span>Philosophy</span>
              </div>
            </div>
            <div className="mkt-card">
              <h3>What we commit to</h3>
              <ul className="mkt-benefit-list" style={{ marginTop: 0 }}>
                <li><strong>Diplomatic approach:</strong> Firm yet courteous negotiation to preserve long-term business relationships.</li>
                <li><strong>Ethical recovery:</strong> Full transparency, MIS reporting, and compliance with policy and documentation standards.</li>
                <li><strong>Risk-free model:</strong> No Collection, No Fee—so you only pay when we deliver.</li>
                <li><strong>Single point of contact:</strong> Dedicated team so your internal resources focus on growth.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="mkt-section-full">
        <div className="mkt-container mkt-container-wide">
          <div className="mkt-page-head">
            <h2 className="mkt-section-heading">Ready to secure your cash flow?</h2>
            <p className="mkt-lead">
              Zero risk performance model, sector expertise, and end-to-end lifecycle coverage. Your Dues. Our Duty.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginTop: 32 }}>
            <Link to="/contact" className="mkt-btn mkt-btn-primary mkt-btn-lg">
              Get in touch
            </Link>
            <Link to="/pricing" className="mkt-btn mkt-btn-ghost mkt-btn-lg">
              View engagement options
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
