import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'

const servicesData = {
  'strategic-liaison-documentation': {
    title: 'Strategic Liaison & Documentation',
    slug: 'strategic-liaison-documentation',
    description: 'Comprehensive coordination and documentation management for seamless project execution in government and PSU sectors.',
    icon: (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
        <path d="M9 12h6"></path>
        <path d="M9 16h6"></path>
        <path d="M9 8h6"></path>
        <circle cx="12" cy="20" r="1"></circle>
        <path d="M12 19v-3"></path>
      </svg>
    ),
    overview: 'Our Strategic Liaison & Documentation service acts as your primary interface with State Electricity Boards, Railways, Solar, PSU, and Telecom customers. We ensure all technical submissions, documentation compliance, and operational processes are streamlined to prevent project delays.',
    features: [
      {
        title: 'Utility & Authority Coordination',
        description: 'Acts as the primary interface with State Electricity Boards, Railways, Solar, PSU and Telecom customers. We maintain strong relationships with key decision-makers and ensure smooth communication channels.',
        details: [
          'Direct liaison with government authorities and PSUs',
          'Regular follow-ups with key stakeholders',
          'Coordination across multiple departments',
          'Status updates and progress tracking'
        ]
      },
      {
        title: 'Technical Submission Management',
        description: 'Comprehensive management of tender documents, Bank Guarantees (BGs), technical drawings, and documentation compliance to ensure all submissions meet regulatory requirements.',
        details: [
          'Tender document preparation and submission',
          'Bank Guarantee (BG) management and tracking',
          'Technical drawing compilation and verification',
          'Documentation compliance verification',
          'Submission deadline management'
        ]
      },
      {
        title: 'Operational Streamlining',
        description: 'Oversight of inspection report submission and issuance of Delivery Instructions (DI) to prevent project delays and ensure timely project completion.',
        details: [
          'Inspection report coordination',
          'Delivery Instruction (DI) management',
          'Project milestone tracking',
          'Delay prevention strategies',
          'Timeline optimization'
        ]
      }
    ],
    benefits: [
      'Reduced project delays through proactive coordination: Our dedicated liaison team maintains constant communication with utilities, PSUs, and government authorities, ensuring timely submissions and preventing bottlenecks that could delay your projects by weeks or months.',
      'Improved documentation accuracy and compliance: With 20+ years of expertise in government and PSU sectors, we ensure all technical submissions, Bank Guarantees, and documentation meet exact regulatory requirements, reducing rejection rates and rework costs significantly.',
      'Single point of contact for all stakeholder communication: Instead of managing multiple touchpoints across different departments and authorities, you get one dedicated team that handles all coordination, updates, and follow-ups, freeing your internal resources for core business activities.',
      'Faster approval processes: Our established relationships and deep understanding of bureaucratic processes enable us to navigate approval workflows efficiently, reducing typical approval cycles by 30-40% compared to in-house efforts.',
      'Risk mitigation through proper documentation: Comprehensive documentation management ensures audit readiness, protects against contractual disputes, and provides legal safeguards while maintaining full compliance with policy standards.'
    ]
  },
  'aggressive-payment-realization': {
    title: 'Aggressive Payment Realization',
    slug: 'aggressive-payment-realization',
    description: 'Proactive and persistent payment collection strategies to accelerate cash flow and reduce Days Sales Outstanding (DSO).',
    icon: (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
        <path d="M12 11h.01"></path>
        <path d="M8 11h.01"></path>
        <path d="M16 11h.01"></path>
      </svg>
    ),
    overview: 'Our Aggressive Payment Realization service focuses on accelerating cash flow through persistent follow-ups, lifecycle billing management, and specialized asset recovery. We operate on a "No Collection, No Fee" model, ensuring zero risk for your organization.',
    features: [
      {
        title: 'Lifecycle Billing',
        description: 'Persistent follow-up for progressive payments and final bills throughout the entire project lifecycle.',
        details: [
          'Progressive payment tracking and follow-up',
          'Final bill preparation and submission',
          'Payment milestone monitoring',
          'Automated reminder systems',
          'Payment status reporting'
        ]
      },
      {
        title: 'Asset Recovery',
        description: 'Dedicated focus on release of retention money, EMD, Advance Bank Guarantees, and Performance Bank Guarantees.',
        details: [
          'Retention money release coordination',
          'EMD (Earnest Money Deposit) recovery',
          'Advance Bank Guarantee release',
          'Performance Bank Guarantee management',
          'Asset recovery tracking and reporting'
        ]
      },
      {
        title: 'Risk-Free Collection',
        description: 'Specialized overdue payment recovery provided on a "No Collection, No Fee" basis, ensuring zero financial risk.',
        details: [
          'Overdue payment identification and prioritization',
          'Customized collection strategies',
          'Performance-based fee structure',
          'Comprehensive collection reporting',
          'Legal escalation support when needed'
        ]
      }
    ],
    benefits: [
      'Improved cash flow and working capital: Accelerated payment collections directly enhance your working capital, enabling you to invest in growth opportunities, meet operational expenses, and reduce dependency on expensive credit facilities or working capital loans.',
      'Reduced Days Sales Outstanding (DSO) by 30-45%: Our persistent "Pole-to-Pole" follow-up approach and specialized expertise in PSU/utility payment processes typically reduce DSO from 120+ days to 60-90 days, significantly improving your cash conversion cycle and financial health.',
      'Zero upfront costs with performance-based pricing: Our "No Collection, No Fee" model means you only pay when we successfully recover payments, eliminating fixed salary costs, infrastructure expenses, and travel overheads while converting them to variable, outcome-based fees.',
      'Higher recovery rates through specialized expertise: With 90-95% recovery rates compared to typical 60-70% in-house rates, our deep sector knowledge, on-ground presence, and relationship management capabilities ensure maximum payment realization and minimal bad debt write-offs.',
      'Faster payment realization across lifecycle: From progressive billings to final payments, retention money, and Bank Guarantee releases, our dedicated focus ensures timely follow-ups at every stage, preventing delays that could otherwise stretch payment cycles by months.'
    ]
  },
  'dispute-claim-management': {
    title: 'Dispute & Claim Management',
    slug: 'dispute-claim-management',
    description: 'Expert resolution of contractual disputes, penalties, and claims through diplomatic negotiation and strategic mediation.',
    icon: (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        <path d="M22 22l-5-5"></path>
        <path d="M17 22l5-5"></path>
      </svg>
    ),
    overview: 'Our Dispute & Claim Management service handles contractual disputes, penalties, and late delivery charges through expert case assessment and diplomatic negotiation, avoiding costly arbitration or legal intervention.',
    features: [
      {
        title: 'Resolution Expert',
        description: 'Handling contractual disputes, penalties, and late delivery (L.D.) charges to avoid costly arbitration or legal intervention.',
        details: [
          'Contract dispute analysis and resolution',
          'Penalty negotiation and reduction',
          'Late delivery charge management',
          'Arbitration avoidance strategies',
          'Legal cost reduction'
        ]
      },
      {
        title: 'Case Assessment',
        description: 'Comprehensive analysis of debtor history to distinguish cash-flow issues from deliberate stalling.',
        details: [
          'Debtor financial analysis',
          'Payment pattern assessment',
          'Risk categorization',
          'Root cause identification',
          'Strategic resolution planning'
        ]
      },
      {
        title: 'Diplomatic Negotiation',
        description: 'Firm yet courteous negotiation to recover funds while preserving long-term business relationships.',
        details: [
          'Relationship-preserving negotiation',
          'Multi-party mediation',
          'Win-win solution development',
          'Long-term partnership maintenance',
          'Professional conflict resolution'
        ]
      }
    ],
    benefits: [
      'Reduced legal costs and arbitration expenses by up to 70%: Our expert mediation and diplomatic negotiation resolve most disputes before they escalate to costly arbitration or litigation, saving significant legal fees, court costs, and time while maintaining business continuity.',
      'Preserved business relationships through diplomatic approach: Unlike aggressive legal actions that can damage long-term partnerships, our firm yet courteous negotiation style preserves client relationships, enabling future business opportunities and maintaining your reputation in the market.',
      'Faster dispute resolution with 60-90 day turnaround: Our comprehensive case assessment and strategic mediation typically resolve disputes within 60-90 days compared to 12-24 months for arbitration or litigation, allowing you to recover funds quickly and move forward.',
      'Higher settlement success rates through expert analysis: By distinguishing genuine cash-flow issues from deliberate stalling through detailed debtor analysis, we develop targeted resolution strategies that achieve 85-95% settlement success rates versus 40-50% for standard approaches.',
      'Improved contract closure rates and reduced penalties: Effective dispute management prevents penalties from accumulating, negotiates reductions in late delivery charges, and ensures smooth contract closure, protecting your margins and project profitability.'
    ]
  },
  'mis-reporting-compliance': {
    title: 'MIS, Reporting & Compliance',
    slug: 'mis-reporting-compliance',
    description: 'Comprehensive management information systems, transparent reporting, and full compliance with policy and documentation standards.',
    icon: (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"></line>
        <line x1="12" y1="20" x2="12" y2="4"></line>
        <line x1="6" y1="20" x2="6" y2="14"></line>
        <rect x="2" y="2" width="20" height="20" rx="2"></rect>
      </svg>
    ),
    overview: 'Our MIS, Reporting & Compliance service provides complete transparency through regular reports, ensures full compliance with policy and documentation standards, and offers a single point of contact for all stakeholder management.',
    features: [
      {
        title: 'Data Transparency',
        description: 'Regular MIS reports including invoice trackers, aging analysis, and reconciliation statements.',
        details: [
          'Real-time invoice tracking',
          'Aging analysis reports',
          'Reconciliation statements',
          'Payment status dashboards',
          'Custom report generation'
        ]
      },
      {
        title: 'Full Compliance',
        description: 'Activities adhere strictly to policy, documentation standards, and ethical recovery practices.',
        details: [
          'Policy compliance verification',
          'Documentation standard adherence',
          'Ethical recovery practices',
          'Regulatory compliance monitoring',
          'Audit-ready documentation'
        ]
      },
      {
        title: 'Single Point of Contact',
        description: 'Dedicated team managing stakeholders while internal resources focus on growth.',
        details: [
          'Dedicated account management',
          'Centralized communication',
          'Stakeholder coordination',
          'Progress reporting',
          'Issue escalation management'
        ]
      }
    ],
    benefits: [
      'Complete visibility into collection activities: Real-time MIS reports, invoice trackers, aging analysis, and reconciliation statements provide comprehensive visibility into payment status, collection progress, and potential bottlenecks, enabling proactive management and strategic decision-making.',
      'Audit-ready documentation and reporting: All activities adhere strictly to policy and documentation standards, with comprehensive audit trails, compliance verification, and regulatory-ready reports that simplify internal audits, external audits, and regulatory inspections while reducing compliance risks.',
      'Reduced internal resource allocation by 60-70%: With a dedicated single point of contact managing all stakeholder communication, follow-ups, and reporting, your internal teams can redirect focus from administrative tasks to high-value growth activities, improving overall productivity and business outcomes.',
      'Improved decision-making through data insights: Regular aging analysis, payment pattern identification, and trend reporting provide actionable insights that help optimize collection strategies, identify high-risk accounts early, and make informed decisions about credit terms and customer relationships.',
      'Enhanced stakeholder communication and transparency: Centralized communication channels, regular progress updates, and transparent reporting ensure all stakeholders—from management to finance teams—stay informed, reducing miscommunication and enabling better coordination across departments.'
    ]
  },
  'ai-integrated-saas-platform': {
    title: 'AI Integrated SaaS Platform',
    slug: 'ai-integrated-saas-platform',
    description: 'Advanced AI-powered platform for automated accounts receivable management, predictive analytics, and intelligent workflow optimization.',
    icon: (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
        <line x1="8" y1="21" x2="16" y2="21"></line>
        <line x1="12" y1="17" x2="12" y2="21"></line>
        <path d="M7 8h10"></path>
        <path d="M7 12h10"></path>
        <circle cx="12" cy="15" r="1"></circle>
      </svg>
    ),
    overview: 'Our AI Integrated SaaS Platform leverages machine learning and automation to transform accounts receivable management. With intelligent workflows, predictive analytics, and seamless integration capabilities, we accelerate collections and optimize your cash flow.',
    features: [
      {
        title: 'Intelligent Automation',
        description: 'AI-powered workflows for invoice processing, aging analysis, and automated follow-up reminders to accelerate collections.',
        details: [
          'Automated invoice processing',
          'Smart aging analysis',
          'Automated follow-up reminders',
          'Workflow optimization',
          'Task automation and scheduling'
        ]
      },
      {
        title: 'Predictive Analytics',
        description: 'Machine learning models to predict payment delays, identify high-risk accounts, and optimize collection strategies.',
        details: [
          'Payment delay prediction',
          'Risk scoring and identification',
          'Collection strategy optimization',
          'Trend analysis and forecasting',
          'Data-driven decision support'
        ]
      },
      {
        title: 'Seamless Integration',
        description: 'API integrations with ERP systems, accounting software, and banking platforms for unified data management.',
        details: [
          'ERP system integration',
          'Accounting software connectivity',
          'Banking platform integration',
          'Real-time data synchronization',
          'Custom integration support'
        ]
      }
    ],
    benefits: [
      'Faster collection cycles through intelligent automation: AI-powered workflows automatically process invoices, send follow-up reminders at optimal times, and prioritize high-value accounts, reducing collection cycles by 40-50% compared to manual processes while ensuring no payment opportunity is missed.',
      'Improved accuracy with AI-powered insights and predictive analytics: Machine learning models analyze payment patterns, predict delays before they occur, identify high-risk accounts, and recommend optimal collection strategies, improving recovery rates by 25-35% and reducing bad debt provisioning significantly.',
      'Reduced manual effort and human error by 70-80%: Automated invoice processing, aging calculations, reconciliation, and report generation eliminate time-consuming manual data entry and reduce human errors, freeing your team to focus on strategic activities while ensuring data accuracy and consistency.',
      'Enhanced visibility and control through real-time dashboards: Comprehensive dashboards provide instant visibility into invoiced amounts, collections, outstanding balances, DSO trends, and aging analysis, enabling real-time decision-making and proactive cash flow management with drill-down capabilities for detailed analysis.',
      'Scalable solution for growing businesses without proportional cost increases: Cloud-based architecture and automated workflows allow you to handle 10x more invoices and customers without proportional increases in staff or infrastructure costs, making it ideal for businesses experiencing rapid growth or seasonal fluctuations.'
    ]
  }
}

export default function ServiceDetail() {
  const { slug } = useParams()
  const service = servicesData[slug]

  useEffect(() => {
    if (service) {
      document.title = `${service.title} – NB Aurum Solutions`
      const metaDescription = document.querySelector('meta[name="description"]')
      if (metaDescription) {
        metaDescription.setAttribute('content', service.description)
      }
    }
  }, [service])

  if (!service) {
    return (
      <section className="mkt-section-full">
        <div className="mkt-container mkt-container-wide">
          <div className="mkt-page-head">
            <h1 className="mkt-section-heading">Service Not Found</h1>
            <p className="mkt-lead">The service you're looking for doesn't exist.</p>
            <Link to="/" className="mkt-btn mkt-btn-primary" style={{ marginTop: 24 }}>
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <>
      {/* Hero Section */}
      <section className="mkt-section-full" aria-labelledby="service-heading">
        <div className="mkt-container mkt-container-wide">
          <div className="mkt-page-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{ 
                width: 80, 
                height: 80, 
                borderRadius: 'var(--mkt-radius-lg)', 
                background: 'var(--mkt-primary-soft)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--mkt-primary)',
                flexShrink: 0
              }}>
                {service.icon}
              </div>
              <div style={{ flex: 1 }}>
                <h1 id="service-heading" className="mkt-section-heading" style={{ marginTop: 0, marginBottom: 8 }}>
                  {service.title}
                </h1>
                <p className="mkt-lead" style={{ marginTop: 0 }}>
                  {service.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Overview Section */}
      <section className="mkt-section-full muted" aria-labelledby="overview-heading">
        <div className="mkt-container mkt-container-wide">
          <div className="mkt-page-head">
            <h2 id="overview-heading" className="mkt-section-heading">Service Overview</h2>
          </div>
          <div className="mkt-card" style={{ marginTop: 48 }}>
            <p className="mkt-body" style={{ fontSize: '1.125rem', lineHeight: 1.7, margin: 0 }}>
              {service.overview}
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mkt-section-full" aria-labelledby="features-heading">
        <div className="mkt-container mkt-container-wide">
          <div className="mkt-page-head">
            <h2 id="features-heading" className="mkt-section-heading">Key Features</h2>
            <p className="mkt-lead">
              Comprehensive capabilities designed to address your specific needs
            </p>
          </div>
          <div className="mkt-grid-2" style={{ marginTop: 48, gap: 32 }}>
            {service.features.map((feature, index) => (
              <div key={index} className="mkt-card">
                <h3 style={{ marginTop: 0, marginBottom: 12, color: 'var(--mkt-primary)' }}>
                  {feature.title}
                </h3>
                <p className="mkt-body" style={{ marginBottom: 20 }}>
                  {feature.description}
                </p>
                <ul className="mkt-benefit-list">
                  {feature.details.map((detail, idx) => (
                    <li key={idx}>{detail}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="mkt-section-full muted" aria-labelledby="benefits-heading">
        <div className="mkt-container mkt-container-wide">
          <div className="mkt-page-head">
            <h2 id="benefits-heading" className="mkt-section-heading">Key Benefits</h2>
            <p className="mkt-lead">
              Why choose this service for your organization
            </p>
          </div>
          <div className="mkt-card" style={{ marginTop: 48 }}>
            <ul className="mkt-benefit-list" style={{ fontSize: '1.0625rem', lineHeight: 1.8 }}>
              {service.benefits.map((benefit, index) => (
                <li key={index} style={{ marginBottom: 12 }}>
                  <strong style={{ color: 'var(--mkt-primary)' }}>✓</strong> {benefit}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mkt-section-full primary" aria-labelledby="cta-heading">
        <div className="mkt-container mkt-container-wide">
          <div className="mkt-page-head">
            <h2 id="cta-heading" className="mkt-section-heading">Ready to Get Started?</h2>
            <p className="mkt-lead" style={{ color: 'rgba(255,255,255,0.9)' }}>
              Contact us today to learn how {service.title} can transform your payment collection process.
            </p>
          </div>
          <div className="mkt-cta-actions" style={{ marginTop: 32, justifyContent: 'center' }}>
            <Link to="/contact" className="mkt-btn mkt-btn-primary mkt-btn-lg" style={{ background: '#fff', color: 'var(--mkt-primary)' }}>
              Get in touch
            </Link>
            <Link to="/pricing" className="mkt-btn mkt-btn-ghost mkt-btn-lg" style={{ borderColor: 'rgba(255,255,255,0.5)', color: '#fff' }}>
              View pricing
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
