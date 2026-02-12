import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { useInView } from '../hooks/useInView'
import { useMarketingLanguage } from '../contexts/MarketingLanguageContext'
import {
  FileText,
  DollarSign,
  Shield,
  BarChart3,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'

const servicesConfig = [
  {
    slug: 'strategic-liaison-documentation',
    icon: FileText,
    image: '/coreservices-1.png',
    color: '#0f4c81',
  },
  {
    slug: 'aggressive-payment-realization',
    icon: DollarSign,
    image: '/coreservices-2.png',
    color: '#0d9488',
  },
  {
    slug: 'dispute-claim-management',
    icon: Shield,
    image: '/coreservices-3.png',
    color: '#b8860b',
  },
  {
    slug: 'mis-reporting-compliance',
    icon: BarChart3,
    image: '/coreservices-4.png',
    color: '#b45309',
  },
  {
    slug: 'ai-integrated-saas-platform',
    icon: Sparkles,
    image: '/coreservices-5.png',
    color: '#7c3aed',
  },
]

export default function Services() {
  const { t } = useMarketingLanguage()
  const [heroRef, heroInView] = useInView({ rootMargin: '0px 0px -60px 0px' })
  const [servicesRef, servicesInView] = useInView({ rootMargin: '0px 0px -60px 0px' })
  const [benefitsRef, benefitsInView] = useInView({ rootMargin: '0px 0px -60px 0px' })

  useEffect(() => {
    document.title = 'Our Services – NB Aurum Solutions'
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Comprehensive payment collection and consultancy services: Strategic Liaison & Documentation, Aggressive Payment Realization, Dispute & Claim Management, MIS Reporting & Compliance, and AI Integrated SaaS Platform.')
    }
  }, [])

  const getServiceData = (slug) => {
    const serviceMap = {
      'strategic-liaison-documentation': {
        title: t('service.strategicLiaison'),
        description: t('home.services.strategicLiaison.utilityDesc'),
        features: [
          t('home.services.strategicLiaison.utilityCoordination'),
          t('home.services.strategicLiaison.technicalSubmission'),
          t('home.services.strategicLiaison.operationalStreamlining'),
        ],
      },
      'aggressive-payment-realization': {
        title: t('service.aggressivePayment'),
        description: t('home.services.aggressivePayment.lifecycleDesc'),
        features: [
          t('home.services.aggressivePayment.lifecycleBilling'),
          t('home.services.aggressivePayment.assetRecovery'),
          t('home.services.aggressivePayment.riskFreeCollection'),
        ],
      },
      'dispute-claim-management': {
        title: t('service.disputeClaim'),
        description: t('home.services.disputeClaim.resolutionDesc'),
        features: [
          t('home.services.disputeClaim.resolutionExpert'),
          t('home.services.disputeClaim.caseAssessment'),
          t('home.services.disputeClaim.diplomaticNegotiation'),
        ],
      },
      'mis-reporting-compliance': {
        title: t('service.misReporting'),
        description: t('home.services.misReporting.dataDesc'),
        features: [
          t('home.services.misReporting.dataTransparency'),
          t('home.services.misReporting.fullCompliance'),
          t('home.services.misReporting.singlePoint'),
        ],
      },
      'ai-integrated-saas-platform': {
        title: t('service.aiSaaS'),
        description: t('home.services.aiSaaS.intelligentDesc'),
        features: [
          t('home.services.aiSaaS.intelligentAutomation'),
          t('home.services.aiSaaS.realTimeDashboards'),
        ],
      },
    }
    return serviceMap[slug] || {}
  }

  return (
    <>
      {/* Hero Section */}
      <section className="mkt-section-full services-hero" aria-labelledby="services-hero-heading" ref={heroRef}>
        <div className={`mkt-container mkt-container-wide mkt-reveal ${heroInView ? 'mkt-reveal-visible' : ''}`}>
          <div className="mkt-page-head services-hero-content">
            <div className="services-hero-badge">
              <span>{t('home.services.heading')}</span>
            </div>
            <h1 id="services-hero-heading" className="mkt-section-heading services-hero-title">
              Comprehensive Solutions for Your Payment Collection Needs
            </h1>
            <p className="mkt-lead services-hero-lead">
              {t('home.services.lead')}
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="mkt-section-full" aria-labelledby="services-grid-heading" ref={servicesRef}>
        <div className={`mkt-container mkt-container-wide mkt-reveal ${servicesInView ? 'mkt-reveal-visible' : ''}`}>
          <div className="mkt-page-head" style={{ marginBottom: 64 }}>
            <h2 id="services-grid-heading" className="mkt-section-heading" style={{ textAlign: 'center' }}>
              Our Core Services
            </h2>
            <p className="mkt-lead" style={{ textAlign: 'center', maxWidth: '800px', margin: '20px auto 0' }}>
              Each service is designed to address specific challenges in the B2G payment lifecycle, ensuring comprehensive coverage from documentation to final fund realization.
            </p>
          </div>

          <div className="services-grid">
            {servicesConfig.map((service, index) => {
              const serviceData = getServiceData(service.slug)
              const IconComponent = service.icon
              
              return (
                <div
                  key={service.slug}
                  className="service-card-professional"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <Link to={`/services/${service.slug}`} className="service-card-professional-link">
                    <div className="service-card-professional-header">
                      <div 
                        className="service-card-professional-icon-wrapper"
                        style={{ '--service-color': service.color }}
                      >
                        <div className="service-card-professional-image">
                          <img src={service.image} alt={serviceData.title} />
                        </div>
                        <div className="service-card-professional-icon">
                          <IconComponent size={32} />
                        </div>
                      </div>
                      <div className="service-card-professional-number">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                    </div>
                    
                    <div className="service-card-professional-content">
                      <h3 className="service-card-professional-title">
                        {serviceData.title}
                      </h3>
                      <p className="service-card-professional-description">
                        {serviceData.description}
                      </p>
                      
                      <div className="service-card-professional-features">
                        {serviceData.features && serviceData.features.slice(0, 3).map((feature, idx) => (
                          <div key={idx} className="service-card-professional-feature">
                            <CheckCircle2 size={18} className="service-card-professional-feature-icon" />
                            <span>{feature.replace(':', '').trim()}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="service-card-professional-footer">
                      <span className="service-card-professional-cta">
                        Learn More
                        <ArrowRight size={18} className="service-card-professional-cta-icon" />
                      </span>
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="mkt-section-full muted" aria-labelledby="services-benefits-heading" ref={benefitsRef}>
        <div className={`mkt-container mkt-container-wide mkt-reveal ${benefitsInView ? 'mkt-reveal-visible' : ''}`}>
          <div className="mkt-page-head">
            <h2 id="services-benefits-heading" className="mkt-section-heading" style={{ textAlign: 'center' }}>
              Why Choose Our Services
            </h2>
            <p className="mkt-lead" style={{ textAlign: 'center', maxWidth: '800px', margin: '20px auto 0' }}>
              We combine deep sector expertise with proven processes to deliver measurable results for your organization.
            </p>
          </div>

          <div className="services-benefits-grid">
            <div className="services-benefit-item">
              <div className="services-benefit-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3 className="services-benefit-title">20+ Years Expertise</h3>
              <p className="services-benefit-description">
                Deep understanding of government and PSU payment processes across Power, Solar, Telecom, Railways, and Government sectors.
              </p>
            </div>

            <div className="services-benefit-item">
              <div className="services-benefit-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h3 className="services-benefit-title">Risk-Free Model</h3>
              <p className="services-benefit-description">
                Performance-based pricing with "No Collection, No Fee" options ensures zero upfront costs and alignment with your success.
              </p>
            </div>

            <div className="services-benefit-item">
              <div className="services-benefit-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
              </div>
              <h3 className="services-benefit-title">Proven Results</h3>
              <p className="services-benefit-description">
                90-95% recovery rates, 30-45% DSO reduction, and faster payment cycles compared to in-house efforts.
              </p>
            </div>

            <div className="services-benefit-item">
              <div className="services-benefit-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className="services-benefit-title">Single Point of Contact</h3>
              <p className="services-benefit-description">
                Dedicated team managing all stakeholder communication, follow-ups, and reporting so your team can focus on growth.
              </p>
            </div>

            <div className="services-benefit-item">
              <div className="services-benefit-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h3 className="services-benefit-title">Full Compliance</h3>
              <p className="services-benefit-description">
                All activities adhere strictly to policy, documentation standards, and ethical recovery practices with audit-ready reporting.
              </p>
            </div>

            <div className="services-benefit-item">
              <div className="services-benefit-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <h3 className="services-benefit-title">Complete Transparency</h3>
              <p className="services-benefit-description">
                Regular MIS reports, invoice trackers, aging analysis, and reconciliation statements for full visibility into collection activities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mkt-section-full primary" aria-labelledby="services-cta-heading">
        <div className="mkt-container mkt-container-wide">
          <div className="mkt-page-head">
            <h2 id="services-cta-heading" className="mkt-section-heading" style={{ color: '#fff' }}>
              Ready to Transform Your Payment Collection Process?
            </h2>
            <p className="mkt-lead" style={{ color: 'rgba(255,255,255,0.9)', maxWidth: '700px', margin: '20px auto 0' }}>
              Get in touch with our team to discuss how our comprehensive services can address your specific needs and accelerate your cash flow.
            </p>
          </div>
          <div className="mkt-cta-actions" style={{ marginTop: 48, justifyContent: 'center' }}>
            <Link to="/contact" className="mkt-btn mkt-btn-primary mkt-btn-lg" style={{ background: '#fff', color: 'var(--mkt-primary)' }}>
              Contact Us
            </Link>
            <Link to="/pricing" className="mkt-btn mkt-btn-ghost mkt-btn-lg" style={{ borderColor: 'rgba(255,255,255,0.5)', color: '#fff' }}>
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
