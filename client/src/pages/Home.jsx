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

  /* Showcase images: using high-quality stock images from Unsplash */
  const showcaseItems = [
    { id: 1, image: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800&h=520&fit=crop', title: 'Power & Utilities', caption: 'State Electricity Boards & utilities' },
    { id: 2, image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=520&fit=crop', title: 'Solar Projects', caption: 'Renewable energy & solar sector' },
    { id: 3, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=520&fit=crop', title: 'Telecom', caption: 'Telecom & infrastructure' },
    { id: 4, image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=520&fit=crop', title: 'Railways', caption: 'Railway projects & PSUs' },
    { id: 5, image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=520&fit=crop', title: 'PSU & Government', caption: 'PSU & government projects' },
    { id: 6, image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=520&fit=crop', title: 'Consultancy', caption: 'Documentation & liaison' },
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
            <p className="mkt-lead" style={{ marginTop: 20, textAlign: 'left', maxWidth: '100%' }}>
              Our comprehensive suite of services addresses every stage of the B2G payment lifecycle, from initial documentation to final fund realization. We act as your strategic partner, navigating the complex bureaucratic landscape so your team can focus on core business operations.
            </p>
          </div>
          <div className="mkt-services-grid" style={{ marginTop: 48 }}>
            <Link to="/services/strategic-liaison-documentation" className="mkt-service-card mkt-animate-in" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="mkt-service-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                  <path d="M9 12h6"></path>
                  <path d="M9 16h6"></path>
                  <path d="M9 8h6"></path>
                  <circle cx="12" cy="20" r="1"></circle>
                  <path d="M12 19v-3"></path>
                </svg>
              </div>
              <h3 className="mkt-service-title">Strategic Liaison & Documentation</h3>
              <ul className="mkt-service-list">
                <li><strong>Utility & Authority Coordination:</strong> Acts as the primary interface with State Electricity Boards, Railways, Solar, PSU and Telecom customers.</li>
                <li><strong>Technical Submission:</strong> Management of tender documents, Bank Guarantees (BGs), technical drawings and documentation compliance.</li>
                <li><strong>Operational Streamlining:</strong> Oversight of inspection report submission and issuance of Delivery Instructions (DI) to prevent project delays.</li>
              </ul>
            </Link>
            <Link to="/services/aggressive-payment-realization" className="mkt-service-card mkt-animate-in mkt-animate-in-delay-1" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="mkt-service-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  <path d="M12 11h.01"></path>
                  <path d="M8 11h.01"></path>
                  <path d="M16 11h.01"></path>
                </svg>
              </div>
              <h3 className="mkt-service-title">Aggressive Payment Realization</h3>
              <ul className="mkt-service-list">
                <li><strong>Lifecycle Billing:</strong> Persistent follow-up for progressive payments and final bills.</li>
                <li><strong>Asset Recovery:</strong> Dedicated focus on release of retention money, EMD, Advance Bank Guarantees and Performance Bank Guarantees.</li>
                <li><strong>Risk-Free Collection:</strong> Specialized overdue payment recovery provided on a "No Collection, No Fee" basis.</li>
              </ul>
            </Link>
            <Link to="/services/dispute-claim-management" className="mkt-service-card mkt-animate-in mkt-animate-in-delay-2" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="mkt-service-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  <path d="M22 22l-5-5"></path>
                  <path d="M17 22l5-5"></path>
                </svg>
              </div>
              <h3 className="mkt-service-title">Dispute & Claim Management</h3>
              <ul className="mkt-service-list">
                <li><strong>Resolution Expert:</strong> Handling contractual disputes, penalties and late delivery (L.D.) charges to avoid costly arbitration or legal intervention.</li>
                <li><strong>Case Assessment:</strong> Comprehensive analysis of debtor history to distinguish cash-flow issues and deliberate stalling.</li>
                <li><strong>Diplomatic Negotiation:</strong> Firm yet courteous negotiation to recover funds while preserving long-term business relationships.</li>
              </ul>
            </Link>
            <Link to="/services/mis-reporting-compliance" className="mkt-service-card mkt-animate-in mkt-animate-in-delay-3" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="mkt-service-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                  <rect x="2" y="2" width="20" height="20" rx="2"></rect>
                </svg>
              </div>
              <h3 className="mkt-service-title">MIS, Reporting & Compliance</h3>
              <ul className="mkt-service-list">
                <li><strong>Data Transparency:</strong> Regular MIS reports including invoice trackers, aging analysis and reconciliation statements.</li>
                <li><strong>Full Compliance:</strong> Activities adhere strictly to policy, documentation standards and ethical recovery practices.</li>
                <li><strong>Single Point of Contact:</strong> Dedicated team managing stakeholders while internal resources focus on growth.</li>
              </ul>
            </Link>
            <Link to="/services/ai-integrated-saas-platform" className="mkt-service-card mkt-animate-in mkt-animate-in-delay-4" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="mkt-service-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                  <path d="M7 8h10"></path>
                  <path d="M7 12h10"></path>
                  <circle cx="12" cy="15" r="1"></circle>
                </svg>
              </div>
              <h3 className="mkt-service-title">AI Integrated SaaS Platform for AR Management</h3>
              <ul className="mkt-service-list">
                <li><strong>Intelligent Automation:</strong> AI-powered workflows for invoice processing, aging analysis, and automated follow-up reminders to accelerate collections.</li>
                <li><strong>Predictive Analytics:</strong> Machine learning models to predict payment delays, identify high-risk accounts, and optimize collection strategies.</li>
                <li><strong>Real-Time Dashboards:</strong> Comprehensive AR management dashboards with real-time visibility into receivables, DSO metrics, and collection performance.</li>
                <li><strong>Seamless Integration:</strong> Cloud-based SaaS platform that integrates with existing ERP systems, enabling end-to-end accounts receivable management.</li>
              </ul>
            </Link>
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
                    alt={`${item.title} - ${item.caption}`}
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

      {/* Our Strategic Strengths */}
      <section className="mkt-section-full" aria-labelledby="strengths-heading">
        <div className="mkt-container mkt-container-wide">
          <div className="mkt-page-head" style={{ textAlign: 'left', marginBottom: 48 }}>
            <h2 id="strengths-heading" className="mkt-section-heading" style={{ textAlign: 'left', marginBottom: 20 }}>Our Strategic Strengths</h2>
            <p className="mkt-lead" style={{ textAlign: 'left', maxWidth: '100%', marginTop: 0 }}>
              What sets NB Aurum Solutions apart is not just our service offerings, but the depth of expertise and strategic approach we bring to every engagement. With decades of specialized experience in the B2G sector, we've developed proprietary methodologies that consistently deliver superior results for our clients.
            </p>
          </div>
          <div className="mkt-strengths-grid" style={{ marginTop: 48 }}>
            <div className="mkt-strength-card">
              <div className="mkt-strength-number">1</div>
              <h3 className="mkt-strength-title">Unmatched Domain Expertise</h3>
              <div className="mkt-strength-content">
                <div className="mkt-strength-item">
                  <strong className="mkt-strength-subtitle">Targeted Sector Experience:</strong>
                  <p className="mkt-strength-text">We possess decades of hands-on experience navigating the specific payment cycles, bureaucratic processes, and operational nuances of Government Companies, Railways, and Public Sector Units across India.</p>
                </div>
                <div className="mkt-strength-item">
                  <strong className="mkt-strength-subtitle">Deep Process Knowledge:</strong>
                  <p className="mkt-strength-text">We go far beyond simple follow-ups by establishing comprehensive internal reporting processes that dramatically improve overall MIS accuracy, financial forecasting, and corporate performance metrics.</p>
                </div>
              </div>
            </div>
            <div className="mkt-strength-card">
              <div className="mkt-strength-number">2</div>
              <h3 className="mkt-strength-title">Nationwide Operational Capability</h3>
              <div className="mkt-strength-content">
                <div className="mkt-strength-item">
                  <strong className="mkt-strength-subtitle">PAN India Network:</strong>
                  <p className="mkt-strength-text">Our operational reach extends across every state in India, supported by an extensive network of expert professionals who understand regional nuances, local protocols, and state-specific administrative procedures.</p>
                </div>
                <div className="mkt-strength-item">
                  <strong className="mkt-strength-subtitle">Effective Relationship Management:</strong>
                  <p className="mkt-strength-text">We focus on developing strong, professional relationships with key decision-makers at every level, enabling us to find a "way out" for even the most complex payment bottlenecks and bureaucratic deadlocks.</p>
                </div>
              </div>
            </div>
            <div className="mkt-strength-card">
              <div className="mkt-strength-number">3</div>
              <h3 className="mkt-strength-title">Integrity-First Philosophy</h3>
              <div className="mkt-strength-content">
                <div className="mkt-strength-item">
                  <strong className="mkt-strength-subtitle">Process-Driven Success:</strong>
                  <p className="mkt-strength-text">We believe in setting processes right the first time to ensure full policy compliance, complete documentation, and ethical recovery practices that protect your reputation and build trust with government entities.</p>
                </div>
                <div className="mkt-strength-item">
                  <strong className="mkt-strength-subtitle">Resilient Attitude:</strong>
                  <p className="mkt-strength-text">Our signature "Never Say No" approach ensures we thrive in the most complex environments, persistently working through challenges to achieve 100% realization for our clients without compromising professional standards.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mkt-strengths-metrics" style={{ marginTop: 64 }}>
            <div className="mkt-metric-item">
              <div className="mkt-metric-number">20+</div>
              <div className="mkt-metric-title">Years of Experience</div>
              <div className="mkt-metric-desc">Two decades navigating B2G payment landscapes</div>
            </div>
            <div className="mkt-metric-item">
              <div className="mkt-metric-number">100%</div>
              <div className="mkt-metric-title">Realization Goal</div>
              <div className="mkt-metric-desc">Committed to complete payment recovery</div>
            </div>
            <div className="mkt-metric-item">
              <div className="mkt-metric-number">0</div>
              <div className="mkt-metric-title">Upfront Costs</div>
              <div className="mkt-metric-desc">Risk-free "No Collection, No Fee" model</div>
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
          <div className="mkt-card" style={{ marginTop: 48 }}>
            <p className="mkt-body" style={{ fontSize: '1.0625rem', lineHeight: 1.8, margin: 0 }}>
              Partnering with NB Aurum Solutions delivers significant financial and operational advantages. We minimize operating costs through performance-based pricing, reduce bad debt with specialized expertise, and accelerate collections by 30-45% to improve cash flow. Our services eliminate travel and manpower expenses while ensuring complete data confidentiality. With recovery rates of 90-100% compared to typical 60-70% in-house rates, you benefit from increased recoveries and comprehensive support until full contract closure.
            </p>
          </div>
          <div className="mkt-grid-2" style={{ marginTop: 48 }}>
            <div className="mkt-card">
              <h3><b>Risk-Free Performance Model</b></h3> 
              <ul className="mkt-benefit-list">
                <li>Outcome-based pricing</li>
                <li>Zero upfront cost</li>
                <li>Performance-driven recovery</li>
              </ul>
            </div>
            <div className="mkt-card">
              <h3><b>Diplomatic & Ethical Approach</b></h3>
              <ul className="mkt-benefit-list">
                <li>Relationship preservation</li>
                <li>Ethical standards and legal compliance</li>
                <li>Conflict resolution through negotiation</li>
              </ul>
            </div>
            <div className="mkt-card">
              <h3><b>Operational Excellence</b></h3>
              <ul className="mkt-benefit-list">
                <li>Data-driven categorization of delays</li>
                <li>Full transparency through MIS</li>
                <li>Compliance assurance</li>
              </ul>
            </div>
            <div className="mkt-card">
              <h3><b>Financial Impact</b></h3>
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
              Regulatory compliance complexity, focus on core competencies, and specialized expertise drive outsourcing decisions.
            </p>
          </div>
          <div className="mkt-page-head" style={{ marginTop: 48 }}>
            <h3 className="mkt-section-heading" style={{ fontSize: '1.5rem' }}>In-House vs. Outsourced: A Detailed Comparison</h3>
            <p className="mkt-lead" style={{ marginTop: 16 }}>
              Compare total cost of ownership, success rates, and strategic impact.
            </p>
          </div>
          <div className="mkt-card" style={{ marginTop: 48 }}>
            <div className="mkt-pricing-table-wrapper">
              <table className="mkt-pricing-table" role="table" aria-label="In-House vs Outsourced comparison">
                <thead>
                  <tr>
                    <th scope="col">Feature</th>
                    <th scope="col">In-House Team</th>
                    <th scope="col">NB Aurum Solutions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Cost Structure</strong></td>
                    <td>High fixed costs: Salaries, benefits, office space, travel expenses</td>
                    <td>Variable costs: Performance-based 'No Collection, No Fee' model</td>
                  </tr>
                  <tr>
                    <td><strong>Expertise Level</strong></td>
                    <td>Generalists good at accounting but lack on-ground liaison skills</td>
                    <td>Specialists with deep-rooted knowledge of PSU/Utility protocols</td>
                  </tr>
                  <tr>
                    <td><strong>Scalability</strong></td>
                    <td>Difficult: Hiring staff for project surges is slow and costly</td>
                    <td>Instant: Handle multiple states and high volumes immediately</td>
                  </tr>
                  <tr>
                    <td><strong>Team Focus</strong></td>
                    <td>Divided: Busy with new billings, payroll, and internal audits</td>
                    <td>Dedicated: 100% focus on moving your file and realizing payment</td>
                  </tr>
                  <tr>
                    <td><strong>Relationship Risk</strong></td>
                    <td>High: Direct follow-ups can create friction with clients</td>
                    <td>Low: Acts as professional mediator/buffer, preserving brand image</td>
                  </tr>
                  <tr>
                    <td><strong>Success Rate</strong></td>
                    <td>Often stalls at follow-up stage due to lack of local presence</td>
                    <td>High success via 'Pole-to-Pole' on-ground persistence</td>
                  </tr>
                  <tr>
                    <td><strong>Recovery Rate</strong></td>
                    <td>60-70% with manual follow-ups</td>
                    <td>90-100% with expert liaison and specialized tracking</td>
                  </tr>
                  <tr>
                    <td><strong>DSO (Days Sales Outstanding)</strong></td>
                    <td>120+ days typical cycle time</td>
                    <td>60-90 days accelerated realization</td>
                  </tr>
                  <tr>
                    <td><strong>Bad Debt Risk</strong></td>
                    <td>High: Files often get 'forgotten' in routine workflows</td>
                    <td>Minimal: Persistent tracking prevents aging into write-offs</td>
                  </tr>
                  <tr>
                    <td><strong>Legal/Arbitration Cost</strong></td>
                    <td>High if disputes aren't mediated effectively</td>
                    <td>Low: Pre-legal mediation expertise resolves most issues</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 48 }}>
              <h3 style={{ marginTop: 0, marginBottom: 16 }}>Time-Value of Money Analysis</h3>
              <p className="mkt-body">
                In the Solar and Power sectors, where capital costs are high, delayed collections have a real financial impact. If ₹5 Crores is stuck with a DISCOM for an extra 6 months, the cost of capital at 10% interest equals ₹25 Lakhs in lost interest and working capital alone. NB Aurum Solutions' 'Pole-to-Pole' persistence reduces collection cycles by 30-45%, saving clients lakhs in interest costs that often exceed our success fee—making the partnership cashflow positive from day one.
              </p>
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

      {/* Ready to Secure Your Cash Flow - feature cards */}
      <section className="mkt-section-full home-cashflow" aria-labelledby="cashflow-heading">
        <div className="mkt-container mkt-container-wide home-cashflow-inner">
          <h2 id="cashflow-heading" className="home-cashflow-title">Ready to Secure Your Cash Flow?</h2>
          <p className="home-cashflow-desc">
            Don't let customer delays and complex documentation stall your company's growth trajectory. Partner with NB Aurum Solutions to transform your pending receivables into liquid working capital that fuels expansion, innovation, and competitive advantage.
          </p>
          
          <div className="home-cashflow-cards">
            <div className="home-cashflow-card">
              <div className="home-cashflow-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  <path d="M9 12l2 2 4-4"></path>
                </svg>
              </div>
              <h3>Zero Risk Model</h3>
              <p>"No Collection, No Fee" for all overdue recoveries</p>
            </div>
            
            <div className="home-cashflow-card">
              <div className="home-cashflow-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h3>Sector Experts</h3>
              <p>20+ years in Power, Solar, Telecom, Railways, and PSUs</p>
            </div>
            
            <div className="home-cashflow-card">
              <div className="home-cashflow-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 11l-6-6"></path>
                  <path d="M17 11h6v6"></path>
                </svg>
              </div>
              <h3>End-to-End Service</h3>
              <p>From tender documentation to final PBG release</p>
            </div>
            
            <div className="home-cashflow-card">
              <div className="home-cashflow-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 11v-1a6 6 0 0 0-12 0v1"></path>
                  <path d="M17 16h2a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2h-2"></path>
                  <path d="M7 16H5a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h2"></path>
                  <rect x="7" y="8" width="10" height="8" rx="1"></rect>
                </svg>
              </div>
              <h3>Reputation First</h3>
              <p>Diplomatic approach preserving client relationships</p>
            </div>
          </div>
          
          <div className="home-cashflow-actions">
            <Link to="/register" className="mkt-btn mkt-btn-primary mkt-btn-lg">
              Get started
            </Link>
            <Link to="/contact" className="mkt-btn mkt-btn-ghost mkt-btn-lg">
              Get in touch
            </Link>
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

      {/* Our Seamless Onboarding Process */}
      <section className="mkt-section-full" aria-labelledby="onboarding-heading">
        <div className="mkt-container mkt-container-wide">
          <div className="mkt-page-head">
            <h2 id="onboarding-heading" className="mkt-section-heading">Our Seamless Onboarding Process</h2>
          </div>
          <div style={{ marginTop: 48, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <img
              src="/upscaled_4k_image.png"
              alt="Our Seamless Onboarding Process - Consultation, Sign & Authorize, Activate Service"
              style={{
                maxWidth: '100%',
                height: 'auto',
                borderRadius: 'var(--mkt-radius-md)',
                boxShadow: 'var(--mkt-shadow-md)'
              }}
              loading="lazy"
            />
          </div>
          <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center', gap: 16 }}>
            <Link to="/register" className="mkt-btn mkt-btn-primary mkt-btn-lg">
              Get started
            </Link>
            <Link to="/contact" className="mkt-btn mkt-btn-ghost mkt-btn-lg">
              Talk to us
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
