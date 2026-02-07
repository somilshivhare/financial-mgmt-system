import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

export default function Home() {
  const [openFaq, setOpenFaq] = useState(null)

  useEffect(() => {
    document.title = 'NB Aurum Solutions – Your Trusted Partner in Payment Collections & Consultancy'
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Specialization in Power, Solar, Telecom, Railways, PSU\'s & Government Projects – PAN India. 20+ Years Expertise. Strategic liaison, aggressive payment realization, dispute management, MIS & compliance.')
    }
  }, [])

  /* Showcase images: use /showcase/your-image.jpg when you add files in public/showcase/ */
  const showcaseItems = [
    { id: 1, image: 'https://placehold.co/800x520/0f172a/cbd5e1?text=Power+%26+Utilities', title: 'Power & Utilities', caption: 'State Electricity Boards & utilities' },
    { id: 2, image: 'https://placehold.co/800x520/1e3a5f/cbd5e1?text=Solar+Projects', title: 'Solar Projects', caption: 'Renewable energy & solar sector' },
    { id: 3, image: 'https://placehold.co/800x520/0f172a/cbd5e1?text=Telecom', title: 'Telecom', caption: 'Telecom & infrastructure' },
    { id: 4, image: 'https://placehold.co/800x520/1e3a5f/cbd5e1?text=Railways', title: 'Railways', caption: 'Railway projects & PSUs' },
    { id: 5, image: 'https://placehold.co/800x520/0f172a/cbd5e1?text=PSU+%26+Government', title: 'PSU & Government', caption: 'PSU & government projects' },
    { id: 6, image: 'https://placehold.co/800x520/1e3a5f/cbd5e1?text=Consultancy', title: 'Consultancy', caption: 'Documentation & liaison' },
  ]

  const faqs = [
    { q: 'Will recovery damage relationships?', a: 'Diplomatic negotiation preserves long-term partnerships.' },
    { q: 'How does "No Collection, No Fee" work?', a: 'Payment only upon successful recovery.' },
    { q: 'Why outsource with an internal accounts team?', a: 'Outsourcing provides on-ground expertise and converts fixed costs.' },
    { q: 'How is DSO improved?', a: 'Aggressive compliant follow-ups on progressive and final bills.' },
    { q: 'How are disputes handled?', a: 'Contract deep-dive and neutral mediation.' },
    { q: 'Assistance with retention and guarantees?', a: 'Specialized tracking and release support.' },
    { q: 'Status updates?', a: 'Regular MIS reporting.' },
    { q: 'What is the pole-to-pole model?', a: 'End-to-end lifecycle management.' },
    { q: 'Categorizing delays?', a: 'Intelligence-based classification.' },
    { q: 'Geographic coverage?', a: 'PAN-India capability.' },
    { q: 'Budget-related delays?', a: 'Compliance readiness and prioritization support.' },
    { q: 'Technology use?', a: 'Hybrid tracking and personal liaison.' },
    { q: 'Contract closure support?', a: 'Reconciliation and certification.' },
    { q: 'GST/tax reconciliation?', a: 'Documentation alignment and audit readiness.' },
    { q: 'Key outsourcing benefits?', a: 'Faster collections, systematic tracking, ethical recovery.' },
    { q: 'Loss of control concerns?', a: 'Full transparency and partnership oversight.' },
  ]

  return (
    <>
      {/* Hero */}
      <section className="mkt-hero" aria-labelledby="hero-heading">
        <div className="mkt-container mkt-container-wide">
          <div className="mkt-hero-grid">
            <div className="mkt-hero-copy mkt-animate-in">
              <div className="mkt-eyebrow" aria-hidden="true">
                Payment Collections & Consultancy
              </div>
              <h1 id="hero-heading">
                Your Trusted Partner in Payment Collections & Consultancy
              </h1>
              <p className="mkt-lead">
                Specialization in Power, Solar, Telecom, Railways, PSU's & Government Projects – PAN India
              </p>
              <p className="mkt-lead" style={{ marginTop: 8, fontWeight: 600 }}>
                20+ Years Expertise | Proven Results | Integrity First
              </p>
              <div className="mkt-hero-actions">
                <Link to="/contact" className="mkt-btn mkt-btn-primary mkt-btn-lg">
                  Get in touch
                </Link>
                <Link to="/register" className="mkt-btn mkt-btn-ghost mkt-btn-lg">
                  Get started
                </Link>
              </div>
              <div className="mkt-trust" role="list">
                <div className="mkt-trust-item" role="listitem"><span className="mkt-dot" aria-hidden="true" /><span>Set processes right the first time</span></div>
                <div className="mkt-trust-item" role="listitem"><span className="mkt-dot" aria-hidden="true" /><span>Full policy & document compliance</span></div>
                <div className="mkt-trust-item" role="listitem"><span className="mkt-dot" aria-hidden="true" /><span>"Never say No" attitude</span></div>
              </div>
            </div>
            <div className="mkt-hero-visual mkt-animate-in mkt-animate-in-delay-2">
              <div className="mkt-visual-card">
                <div className="mkt-visual-top">
                  <div className="mkt-visual-title">Our Philosophy</div>
                </div>
                <ul className="mkt-benefit-list" style={{ margin: 0, paddingLeft: '1.25rem' }}>
                  <li>Set processes right the first time</li>
                  <li>Build strong customer relationships</li>
                  <li>Ensure full policy & document compliance</li>
                  <li>Deliver end-to-end service</li>
                  <li>"Never say No" attitude</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Services */}
      <section className="mkt-section-full muted" aria-labelledby="services-heading">
        <div className="mkt-container mkt-container-wide">
          <div className="mkt-page-head">
            <h2 id="services-heading" className="mkt-section-heading">Core Services We Provide</h2>
          </div>
          <div className="mkt-grid-2" style={{ marginTop: 48, gap: 32 }}>
            <div className="mkt-card mkt-animate-in">
              <h3 className="mkt-feature-title">Strategic Liaison & Documentation</h3>
              <ul className="mkt-benefit-list">
                <li><strong>Utility & Authority Coordination:</strong> Acts as the primary interface with State Electricity Boards, Railways, Solar, PSU and Telecom customers.</li>
                <li><strong>Technical Submission:</strong> Management of tender documents, Bank Guarantees (BGs), technical drawings and documentation compliance.</li>
                <li><strong>Operational Streamlining:</strong> Oversight of inspection report submission and issuance of Delivery Instructions (DI) to prevent project delays.</li>
              </ul>
            </div>
            <div className="mkt-card mkt-animate-in mkt-animate-in-delay-1">
              <h3 className="mkt-feature-title">Aggressive Payment Realization</h3>
              <ul className="mkt-benefit-list">
                <li><strong>Lifecycle Billing:</strong> Persistent follow-up for progressive payments and final bills.</li>
                <li><strong>Asset Recovery:</strong> Dedicated focus on release of retention money, EMD, Advance Bank Guarantees and Performance Bank Guarantees.</li>
                <li><strong>Risk-Free Collection:</strong> Specialized overdue payment recovery provided on a "No Collection, No Fee" basis.</li>
              </ul>
            </div>
            <div className="mkt-card mkt-animate-in mkt-animate-in-delay-2">
              <h3 className="mkt-feature-title">Dispute & Claim Management</h3>
              <ul className="mkt-benefit-list">
                <li><strong>Resolution Expert:</strong> Handling contractual disputes, penalties and late delivery (L.D.) charges to avoid costly arbitration or legal intervention.</li>
                <li><strong>Case Assessment:</strong> Comprehensive analysis of debtor history to distinguish cash-flow issues and deliberate stalling.</li>
                <li><strong>Diplomatic Negotiation:</strong> Firm yet courteous negotiation to recover funds while preserving long-term business relationships.</li>
              </ul>
            </div>
            <div className="mkt-card mkt-animate-in">
              <h3 className="mkt-feature-title">MIS, Reporting & Compliance</h3>
              <ul className="mkt-benefit-list">
                <li><strong>Data Transparency:</strong> Regular MIS reports including invoice trackers, aging analysis and reconciliation statements.</li>
                <li><strong>Full Compliance:</strong> Activities adhere strictly to policy, documentation standards and ethical recovery practices.</li>
                <li><strong>Single Point of Contact:</strong> Dedicated team managing stakeholders while internal resources focus on growth.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Our Work in Action – showcase images */}
      <section className="mkt-section-full home-showcase" aria-labelledby="showcase-heading">
        <div className="mkt-container mkt-container-wide">
          <div className="mkt-page-head">
            <h2 id="showcase-heading" className="mkt-section-heading">Our Work in Action</h2>
            <p className="mkt-lead">Sectors and projects we serve across PAN India</p>
          </div>
          <div className="home-showcase-grid">
            {showcaseItems.map((item, i) => (
              <figure key={item.id} className="home-showcase-item mkt-animate-in" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="home-showcase-image-wrap">
                  <img
                    src={item.image}
                    alt=""
                    className="home-showcase-image"
                    loading="lazy"
                    onError={(e) => { e.target.src = `https://placehold.co/800x520/0f172a/cbd5e1?text=${encodeURIComponent(item.title)}` }}
                  />
                </div>
                <figcaption className="home-showcase-caption">
                  <strong>{item.title}</strong>
                  <span>{item.caption}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Strategic Strengths */}
      <section className="mkt-section-full" aria-labelledby="strengths-heading">
        <div className="mkt-container mkt-container-wide">
          <div className="mkt-page-head">
            <h2 id="strengths-heading" className="mkt-section-heading">Strategic Strengths</h2>
          </div>
          <div className="mkt-grid-3" style={{ marginTop: 48 }}>
            <div className="mkt-card">
              <h3>Unmatched Domain Expertise</h3>
              <ul className="mkt-benefit-list">
                <li>Targeted sector experience in government companies, railways and PSUs</li>
                <li>Deep process knowledge improving internal reporting and MIS accuracy</li>
              </ul>
            </div>
            <div className="mkt-card">
              <h3>Nationwide Operational Capability</h3>
              <ul className="mkt-benefit-list">
                <li>PAN-India network of professionals</li>
                <li>Strong relationship management to resolve complex payment bottlenecks</li>
              </ul>
            </div>
            <div className="mkt-card">
              <h3>Integrity-First Philosophy</h3>
              <ul className="mkt-benefit-list">
                <li>Process-driven compliance</li>
                <li>Resilient "Never Say No" execution approach</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits + Model */}
      <section className="mkt-section-full muted" aria-labelledby="benefits-heading">
        <div className="mkt-container mkt-container-wide">
          <div className="mkt-page-head">
            <h2 id="benefits-heading" className="mkt-section-heading">Key Benefits</h2>
          </div>
          <div className="mkt-trust-logos" style={{ marginTop: 24 }}>
            <div className="mkt-trust-chips" style={{ flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
              {['Operating cost minimization', 'Bad debt reduction', 'Improved DSO & cash flow', 'Confidentiality of business data', 'Savings on travel and manpower', 'Increased recoveries', 'Support until full contract closure'].map((b) => (
                <span key={b} className="mkt-chip">{b}</span>
              ))}
            </div>
          </div>
          <div className="mkt-grid-2" style={{ marginTop: 48 }}>
            <div className="mkt-card">
              <h3>Risk-Free Performance Model</h3>
              <ul className="mkt-benefit-list">
                <li>Outcome-based pricing</li>
                <li>Zero upfront cost</li>
                <li>Performance-driven recovery</li>
              </ul>
            </div>
            <div className="mkt-card">
              <h3>Diplomatic & Ethical Approach</h3>
              <ul className="mkt-benefit-list">
                <li>Relationship preservation</li>
                <li>Ethical standards and legal compliance</li>
                <li>Conflict resolution through negotiation</li>
              </ul>
            </div>
            <div className="mkt-card">
              <h3>Operational Excellence</h3>
              <ul className="mkt-benefit-list">
                <li>Data-driven categorization of delays</li>
                <li>Full transparency through MIS</li>
                <li>Compliance assurance</li>
              </ul>
            </div>
            <div className="mkt-card">
              <h3>Financial Impact</h3>
              <ul className="mkt-benefit-list">
                <li>Improved DSO</li>
                <li>Operational savings</li>
                <li>Resource reallocation to core growth</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Why Outsource + Comparison */}
      <section className="mkt-section-full" aria-labelledby="outsource-heading">
        <div className="mkt-container mkt-container-wide">
          <div className="mkt-page-head">
            <h2 id="outsource-heading" className="mkt-section-heading">Why Companies Are Outsourcing</h2>
            <p className="mkt-lead">
              Complexity of regulatory compliance, focus on core competencies, liquidity priority in rising capital cost environments, and technological advantages of specialized agencies.
            </p>
          </div>
          <p className="mkt-body" style={{ marginTop: 24 }}>
            <strong>Hidden Cost of In-House Collections:</strong> Senior staff time spent chasing payments leads to direct productivity loss. Outsourcing reallocates focus toward high-value tasks.
          </p>
          <div className="mkt-page-head" style={{ marginTop: 40 }}>
            <h3 className="mkt-section-heading" style={{ fontSize: '1.25rem' }}>In-House vs Outsourced Collections</h3>
          </div>
          <div className="mkt-grid-2" style={{ marginTop: 24, alignItems: 'start' }}>
            <div className="mkt-card">
              <h4 style={{ marginTop: 0 }}>In-House</h4>
              <ul className="mkt-benefit-list" style={{ marginBottom: 0 }}>
                <li>High fixed cost</li>
                <li>Generalist expertise</li>
                <li>Limited scalability</li>
                <li>Divided focus</li>
                <li>Higher relationship friction risk</li>
                <li>Lower success rate</li>
              </ul>
            </div>
            <div className="mkt-card" style={{ borderColor: 'var(--mkt-primary)', background: 'var(--mkt-primary-soft)' }}>
              <h4 style={{ marginTop: 0 }}>Outsourced</h4>
              <ul className="mkt-benefit-list" style={{ marginBottom: 0 }}>
                <li>Variable performance-based cost</li>
                <li>Specialist expertise</li>
                <li>Instant scalability</li>
                <li>Dedicated focus</li>
                <li>Professional buffer for relationships</li>
                <li>Higher success rate</li>
              </ul>
            </div>
          </div>
          <div className="mkt-card" style={{ marginTop: 32 }}>
            <h3>Cost–Benefit Analysis</h3>
            <ul className="mkt-benefit-list">
              <li><strong>Time-Value of Money:</strong> Faster recovery reduces interest loss and improves working capital velocity.</li>
              <li><strong>Opportunity Cost:</strong> Engineering teams focus on growth instead of administrative follow-ups.</li>
              <li><strong>Fixed vs Variable Cost:</strong> Outsourcing eliminates salary liabilities, infrastructure costs, travel expenses, and payment risk when recovery fails.</li>
            </ul>
            <p className="mkt-body" style={{ marginTop: 16 }}>
              <strong>Comparative ROI:</strong> Higher recovery rates, reduced DSO, lower bad-debt risk, reduced legal costs, improved working capital.
            </p>
          </div>
          <div className="mkt-trust-logos" style={{ marginTop: 32 }}>
            <span className="mkt-trust-label">Strategic necessity of third-party collection:</span>
            <div className="mkt-trust-chips" style={{ flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {['Professional neutrality', 'Conversion of fixed to variable costs', 'Specialized liaison intelligence', 'Focus on core competencies', 'Improved cash-flow velocity', 'Reduced bad debt provisioning', 'Advanced dispute mediation', 'Data-driven aging analysis', 'Business continuity', 'Regulatory and audit compliance'].map((s) => (
                <span key={s} className="mkt-chip">{s}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Video placeholder – express your project / story */}
      <section className="mkt-section-full home-video-section" aria-labelledby="video-heading">
        <div className="mkt-container mkt-container-wide">
          <div className="mkt-page-head">
            <h2 id="video-heading" className="mkt-section-heading">See Our Project</h2>
            <p className="mkt-lead">How we work with clients and deliver results</p>
          </div>
          <div className="home-video-wrapper">
            <div className="home-video-placeholder">
              {/* Replace the content below with your video: use <iframe> for YouTube/Vimeo or <video> for file */}
              <div className="home-video-placeholder-inner" aria-hidden="true">
                <div className="home-video-play-icon" aria-hidden="true">
                  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="40" cy="40" r="40" fill="rgba(15, 72, 129, 0.9)" />
                    <path d="M32 26v28l22-14L32 26z" fill="#fff" />
                  </svg>
                </div>
                <p className="home-video-placeholder-text">Add your project or story video here</p>
                <p className="home-video-placeholder-hint">Replace this block with a YouTube/Vimeo iframe or &lt;video&gt; source</p>
              </div>
              {/* Example for when you add a video (uncomment and set src):
              <iframe
                title="Our project video"
                src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              */}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ - modern centered */}
      <section className="mkt-section-full muted home-faq" aria-labelledby="faq-heading">
        <div className="mkt-container mkt-container-wide home-faq-inner">
          <div className="home-faq-head">
            <h2 id="faq-heading" className="home-faq-title">Frequently Asked Questions</h2>
            <p className="home-faq-subtitle">Quick answers about our collections, consultancy, and engagement model.</p>
          </div>
          <div className="home-faq-list">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className={`home-faq-item ${openFaq === i ? 'is-open' : ''}`}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setOpenFaq(openFaq === i ? null : i)}
                aria-expanded={openFaq === i}
              >
                <div className="home-faq-question">
                  <span className="home-faq-q-label">Q{i + 1}</span>
                  <span className="home-faq-q-text">{faq.q}</span>
                  <span className="home-faq-icon" aria-hidden="true">{openFaq === i ? '−' : '+'}</span>
                </div>
                <div className="home-faq-answer">
                  <p>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mkt-section-full primary" aria-labelledby="cta-heading">
        <div className="mkt-container mkt-container-wide">
          <div className="mkt-page-head">
            <h2 id="cta-heading" className="mkt-section-heading">Ready to Secure Your Cash Flow?</h2>
            <p className="mkt-lead" style={{ color: 'rgba(255,255,255,0.9)' }}>
              Zero risk performance model · Sector expertise · End-to-end lifecycle coverage · Reputation-preserving approach
            </p>
          </div>
          <div className="mkt-cta-actions" style={{ marginTop: 32, justifyContent: 'center' }}>
            <Link to="/contact" className="mkt-btn mkt-btn-primary mkt-btn-lg" style={{ background: '#fff', color: 'var(--mkt-primary)' }}>
              Get in touch
            </Link>
            <Link to="/register" className="mkt-btn mkt-btn-ghost mkt-btn-lg" style={{ borderColor: 'rgba(255,255,255,0.5)', color: '#fff' }}>
              Get started
            </Link>
          </div>
        </div>
      </section>

      {/* Our Seamless Onboarding Process - flow design */}
      <section className="mkt-section-full home-onboarding" aria-labelledby="onboarding-heading">
        <div className="mkt-container mkt-container-wide home-onboarding-inner">
          <h2 id="onboarding-heading" className="home-onboarding-title">Our Seamless Onboarding Process</h2>

          <div className="home-onboarding-flow">
            <svg className="home-onboarding-svg" viewBox="0 0 800 200" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
              <defs>
                <marker id="flow-arrow" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
                  <polygon points="0 0, 10 4, 0 8" fill="#0f4c81" />
                </marker>
              </defs>
              {/* Start → Consultation → Sign & Authorize → Activate Service → End */}
              <path
                className="home-onboarding-path"
                d="M 40 100 L 40 158 L 175 158 L 175 108 L 398 108 L 398 52 L 622 52 L 622 108 L 760 108"
                fill="none"
                stroke="#0f4c81"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                markerEnd="url(#flow-arrow)"
              />
              <circle cx="40" cy="100" r="6" fill="#0f4c81" />
              <circle cx="760" cy="108" r="6" fill="#0f4c81" />
            </svg>
            <div className="home-onboarding-flow-steps">
              <div className="home-onboarding-flow-box home-onboarding-flow-box--1">
                <h3>Consultation</h3>
                <p>Review invoices, spot bottlenecks</p>
              </div>
              <div className="home-onboarding-flow-box home-onboarding-flow-box--2">
                <h3>Sign & Authorize</h3>
                <p>Formalize agreement and letters</p>
              </div>
              <div className="home-onboarding-flow-box home-onboarding-flow-box--3">
                <h3>Activate Service</h3>
                <p>Immediate follow-up; MIS in 30 days</p>
              </div>
            </div>
          </div>

          <p className="home-onboarding-desc">
            Getting started is simple and fast. We follow a structured 3-phase transition to ensure we hit the ground running and deliver results quickly.
          </p>

          <div className="home-onboarding-cta">
            <div className="home-onboarding-cta-btns">
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
