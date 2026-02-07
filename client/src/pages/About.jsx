import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function About() {
  useEffect(() => {
    document.title = 'About NB Aurum Solutions – Payment Collections & Consultancy'
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Your trusted partner in payment collections & consultancy. Specialization in Power, Solar, Telecom, Railways, PSU\'s & Government Projects – PAN India. 20+ years expertise, integrity first.')
    }
  }, [])

  return (
    <>
      <section className="mkt-section-full" aria-labelledby="about-heading">
        <div className="mkt-container mkt-container-wide">
          <div className="mkt-page-head">
            <h1 id="about-heading" className="mkt-section-heading">About NB Aurum Solutions</h1>
            <p className="mkt-lead">
              Your trusted partner in payment collections and consultancy—specializing in Power, Solar, Telecom, Railways, PSU's and Government projects across India.
            </p>
          </div>

          <div className="mkt-illustration-block">
            <div>
              <h2 style={{ marginTop: 0 }}>Our mission</h2>
              <p className="mkt-body">
                We bring discipline, transparency, and results to payment realization and collections. We believe in set processes right the first time, strong customer relationships, full policy and document compliance, and a "Never say No" attitude—so your cash flow is secure and your contracts close cleanly.
              </p>
              <h3 style={{ marginTop: 32 }}>What we stand for</h3>
              <p className="mkt-body">
                NB Aurum Solutions is built on 20+ years of expertise. We focus on strategic liaison, aggressive payment realization, dispute management, and MIS-led compliance—so you get end-to-end service from a single point of contact while your team focuses on growth.
              </p>
              <Link to="/who-we-are" className="mkt-btn mkt-btn-ghost" style={{ marginTop: 24 }}>
                Who we are
              </Link>
            </div>
            <div className="mkt-image-placeholder caption" aria-hidden="true">
              <span>Mission</span>
              <div className="mkt-image-caption">Integrity first · Proven results</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mkt-section-full muted" aria-labelledby="compliance-heading">
        <div className="mkt-container mkt-container-wide">
          <div className="mkt-page-head">
            <h2 id="compliance-heading" className="mkt-section-heading">Compliance, security & transparency</h2>
            <p className="mkt-lead">
              Full policy and document compliance, ethical recovery practices, and data transparency—so you can trust every step.
            </p>
          </div>
          <div className="mkt-grid-3" style={{ marginTop: 48 }}>
            <div className="mkt-card">
              <h3>Compliance & controls</h3>
              <p className="mkt-body">
                Activities adhere strictly to policy, documentation standards, and ethical recovery practices. Regular MIS reports, invoice trackers, aging analysis, and reconciliation statements keep everything audit-ready.
              </p>
            </div>
            <div className="mkt-card">
              <h3>Data & confidentiality</h3>
              <p className="mkt-body">
                Your business data stays confidential. We use hardened processes, clear authorization, and a single point of contact so internal resources can focus on growth while we manage liaison and recovery.
              </p>
            </div>
            <div className="mkt-card">
              <h3>Scalability</h3>
              <p className="mkt-body">
                PAN-India capability with a nationwide network of professionals. We scale with your project footprint—Power, Solar, Telecom, Railways, PSUs and Government—without compromising on relationship management or compliance.
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
              From foundation to today—how we work and what we stand for.
            </p>
          </div>
          <div className="mkt-grid-2" style={{ marginTop: 48 }}>
            <div className="mkt-card">
              <h3>How we deliver</h3>
              <ul className="mkt-timeline">
                <li>
                  <span className="mkt-timeline-dot" aria-hidden="true" />
                  <div>
                    <strong>Strategic liaison</strong>
                    <p>Utility and authority coordination, technical submission, and operational streamlining so projects don't delay.</p>
                  </div>
                </li>
                <li>
                  <span className="mkt-timeline-dot" aria-hidden="true" />
                  <div>
                    <strong>Payment realization</strong>
                    <p>Lifecycle billing, asset recovery (retention, EMD, BGs), and risk-free collection on a No Collection, No Fee basis.</p>
                  </div>
                </li>
                <li>
                  <span className="mkt-timeline-dot" aria-hidden="true" />
                  <div>
                    <strong>Dispute & closure</strong>
                    <p>Dispute resolution, diplomatic negotiation, and support until full contract closure with reconciliation and certification.</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="mkt-card">
              <h3>Core values</h3>
              <ul className="mkt-benefit-list">
                <li>Integrity first—process-driven compliance and ethical recovery.</li>
                <li>Set processes right the first time; no shortcuts.</li>
                <li>Diplomatic yet firm negotiation to preserve long-term relationships.</li>
                <li>Full transparency through MIS and regular reporting.</li>
              </ul>
              <div className="mkt-image-placeholder" style={{ marginTop: 24, aspectRatio: '16/9' }} aria-hidden="true">
                <span>Values</span>
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
              Unmatched domain expertise, nationwide capability, and a reputation-preserving approach.
            </p>
          </div>
          <div className="mkt-grid-3" style={{ marginTop: 48 }}>
            <div className="mkt-card">
              <h3>Domain expertise</h3>
              <p className="mkt-body">
                Targeted sector experience in government companies, railways and PSUs. Deep process knowledge that improves internal reporting and MIS accuracy.
              </p>
            </div>
            <div className="mkt-card">
              <h3>PAN-India capability</h3>
              <p className="mkt-body">
                Nationwide network of professionals and strong relationship management to resolve complex payment bottlenecks—wherever your projects are.
              </p>
            </div>
            <div className="mkt-card">
              <h3>Risk-free model</h3>
              <p className="mkt-body">
                Outcome-based pricing, zero upfront cost, and performance-driven recovery. You pay when we deliver—so adoption is seamless and low-risk.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
