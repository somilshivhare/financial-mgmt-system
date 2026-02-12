import { Link } from 'react-router-dom'
import { useEffect, useState, useMemo } from 'react'
import { useInView } from '../hooks/useInView'
import { useMarketingLanguage } from '../contexts/MarketingLanguageContext'

const FAQ_DISPLAY_COUNT = 5

export default function Home() {
  const { t } = useMarketingLanguage()
  /* Hero carousel: slide 1 = local; rest = Unsplash (free high-res images) */
  const HERO_SLIDES = [
    {
      id: 1,
      image: '/hero.png',
      eyebrow: t('home.hero.slide1.eyebrow'),
      title: t('home.hero.slide1.title'),
      lead: t('home.hero.slide1.lead'),
      tagline: t('home.hero.slide1.tagline'),
      ctaPrimary: t('home.hero.slide1.ctaPrimary'),
      ctaPrimaryTo: '/contact',
      ctaSecondary: t('home.hero.slide1.ctaSecondary'),
      ctaSecondaryTo: '/register',
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1920&q=85',
      eyebrow: t('home.hero.slide2.eyebrow'),
      title: t('home.hero.slide2.title'),
      lead: t('home.hero.slide2.lead'),
      tagline: t('home.hero.slide2.tagline'),
      ctaPrimary: t('home.hero.slide2.ctaPrimary'),
      ctaPrimaryTo: '/who-we-are',
      ctaSecondary: t('home.hero.slide2.ctaSecondary'),
      ctaSecondaryTo: '/contact',
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1920&q=85',
      eyebrow: t('home.hero.slide3.eyebrow'),
      title: t('home.hero.slide3.title'),
      lead: t('home.hero.slide3.lead'),
      tagline: t('home.hero.slide3.tagline'),
      ctaPrimary: t('home.hero.slide3.ctaPrimary'),
      ctaPrimaryTo: '/services/strategic-liaison-documentation',
      ctaSecondary: t('home.hero.slide3.ctaSecondary'),
      ctaSecondaryTo: '/contact',
    },
    {
      id: 4,
      image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1920&q=85',
      eyebrow: t('home.hero.slide4.eyebrow'),
      title: t('home.hero.slide4.title'),
      lead: t('home.hero.slide4.lead'),
      tagline: t('home.hero.slide4.tagline'),
      ctaPrimary: t('home.hero.slide4.ctaPrimary'),
      ctaPrimaryTo: '/services/strategic-liaison-documentation',
      ctaSecondary: t('home.hero.slide4.ctaSecondary'),
      ctaSecondaryTo: '/contact',
    },
    {
      id: 5,
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=85',
      eyebrow: t('home.hero.slide5.eyebrow'),
      title: t('home.hero.slide5.title'),
      lead: t('home.hero.slide5.lead'),
      tagline: t('home.hero.slide5.tagline'),
      ctaPrimary: t('home.hero.slide5.ctaPrimary'),
      ctaPrimaryTo: '/who-we-are',
      ctaSecondary: t('home.hero.slide5.ctaSecondary'),
      ctaSecondaryTo: '/contact',
    },
    {
      id: 6,
      image: 'https://assets.upstox.com/content/assets/images/news/ntpc.jpg',
      eyebrow: t('home.hero.slide6.eyebrow'),
      title: t('home.hero.slide6.title'),
      lead: t('home.hero.slide6.lead'),
      tagline: t('home.hero.slide6.tagline'),
      ctaPrimary: t('home.hero.slide6.ctaPrimary'),
      ctaPrimaryTo: '/contact',
      ctaSecondary: t('home.hero.slide6.ctaSecondary'),
      ctaSecondaryTo: '/pricing',
    },
  ]

  const LATEST_UPDATES = [
    t('home.updates.update1'),
    t('home.updates.update2'),
    t('home.updates.update3'),
    t('home.updates.update4'),
    t('home.updates.update5'),
    t('home.updates.update6'),
    t('home.updates.update7'),
    t('home.updates.update8'),
  ]
  const [openFaq, setOpenFaq] = useState(null)
  const [heroIndex, setHeroIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [servicesRef, servicesInView] = useInView({ rootMargin: '0px 0px -60px 0px' })
  const [showcaseRef, showcaseInView] = useInView({ rootMargin: '0px 0px -60px 0px' })
  const [outsourceRef, outsourceInView] = useInView({ rootMargin: '0px 0px -60px 0px' })
  const [faqRef, faqInView] = useInView({ rootMargin: '0px 0px -60px 0px' })
  const [cashflowRef, cashflowInView] = useInView({ rootMargin: '0px 0px -60px 0px' })
  const [arInsightsRef, arInsightsInView] = useInView({ rootMargin: '0px 0px -60px 0px' })

  const comparisonRows = useMemo(() => [
    { key: 'costStructure', feature: t('home.outsource.comparison.costStructure'), inHouse: t('home.outsource.comparison.costStructureInHouse'), nbaurum: t('home.outsource.comparison.costStructureNbaurum') },
    { key: 'expertiseLevel', feature: t('home.outsource.comparison.expertiseLevel'), inHouse: t('home.outsource.comparison.expertiseLevelInHouse'), nbaurum: t('home.outsource.comparison.expertiseLevelNbaurum') },
    { key: 'scalability', feature: t('home.outsource.comparison.scalability'), inHouse: t('home.outsource.comparison.scalabilityInHouse'), nbaurum: t('home.outsource.comparison.scalabilityNbaurum') },
    { key: 'teamFocus', feature: t('home.outsource.comparison.teamFocus'), inHouse: t('home.outsource.comparison.teamFocusInHouse'), nbaurum: t('home.outsource.comparison.teamFocusNbaurum') },
    { key: 'relationshipRisk', feature: t('home.outsource.comparison.relationshipRisk'), inHouse: t('home.outsource.comparison.relationshipRiskInHouse'), nbaurum: t('home.outsource.comparison.relationshipRiskNbaurum') },
    { key: 'successRate', feature: t('home.outsource.comparison.successRate'), inHouse: t('home.outsource.comparison.successRateInHouse'), nbaurum: t('home.outsource.comparison.successRateNbaurum') },
    { key: 'recoveryRate', feature: t('home.outsource.comparison.recoveryRate'), inHouse: t('home.outsource.comparison.recoveryRateInHouse'), nbaurum: t('home.outsource.comparison.recoveryRateNbaurum') },
    { key: 'dso', feature: t('home.outsource.comparison.dso'), inHouse: t('home.outsource.comparison.dsoInHouse'), nbaurum: t('home.outsource.comparison.dsoNbaurum') },
    { key: 'badDebtRisk', feature: t('home.outsource.comparison.badDebtRisk'), inHouse: t('home.outsource.comparison.badDebtRiskInHouse'), nbaurum: t('home.outsource.comparison.badDebtRiskNbaurum') },
    { key: 'legalCost', feature: t('home.outsource.comparison.legalCost'), inHouse: t('home.outsource.comparison.legalCostInHouse'), nbaurum: t('home.outsource.comparison.legalCostNbaurum') },
  ], [t])

  useEffect(() => {
    document.title = 'NB Aurum Solutions – Your Trusted Partner in Payment Collections & Consultancy'
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Specialization in Power, Solar, Telecom, Railways, PSU\'s & Government Projects – PAN India. 20+ Years Expertise. Strategic liaison, aggressive payment realization, dispute management, MIS & compliance.')
    }
  }, [])

  useEffect(() => {
    const t = setInterval(() => {
      setHeroIndex((i) => (i + 1) % HERO_SLIDES.length)
    }, 6000)
    return () => clearInterval(t)
  }, [])

  const goToSlide = (index) => setHeroIndex(Math.max(0, Math.min(index, HERO_SLIDES.length - 1)))

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Navigate to services page with search query or handle search
      window.location.href = `/services?search=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
  }

  /* Showcase images: using high-quality stock images from Unsplash; PSU card uses logos */
  const showcaseItems = [
    { id: 1, image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&h=520&fit=crop', title: t('home.showcase.powerUtilities'), caption: t('home.showcase.powerCaption') },
    { id: 2, image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=520&fit=crop', title: t('home.showcase.solarProjects'), caption: t('home.showcase.solarCaption') },
    { id: 3, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=520&fit=crop', title: t('home.showcase.telecom'), caption: t('home.showcase.telecomCaption') },
    { id: 4, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/DelhiMetroYellowLine2.JPG/500px-DelhiMetroYellowLine2.JPG', title: t('home.showcase.railways'), caption: t('home.showcase.railwaysCaption') },
    { id: 5, image: 'https://assets.upstox.com/content/assets/images/news/ntpc.jpg', title: t('home.showcase.psuGovernment'), caption: t('home.showcase.psuCaption') },
    { id: 6, image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=520&fit=crop', title: t('home.showcase.consultancy'), caption: t('home.showcase.consultancyCaption') },
  ]

  const faqs = [
    { q: t('home.faq.q1'), a: t('home.faq.a1') },
    { q: t('home.faq.q2'), a: t('home.faq.a2') },
    { q: t('home.faq.q3'), a: t('home.faq.a3') },
    { q: t('home.faq.q4'), a: t('home.faq.a4') },
    { q: t('home.faq.q5'), a: t('home.faq.a5') },
    { q: t('home.faq.q6'), a: t('home.faq.a6') },
    { q: t('home.faq.q7'), a: t('home.faq.a7') },
    { q: t('home.faq.q8'), a: t('home.faq.a8') },
    { q: t('home.faq.q9'), a: t('home.faq.a9') },
    { q: t('home.faq.q10'), a: t('home.faq.a10') },
    { q: t('home.faq.q11'), a: t('home.faq.a11') },
    { q: t('home.faq.q12'), a: t('home.faq.a12') },
    { q: t('home.faq.q13'), a: t('home.faq.a13') },
    { q: t('home.faq.q14'), a: t('home.faq.a14') },
    { q: t('home.faq.q15'), a: t('home.faq.a15') },
    { q: t('home.faq.q16'), a: t('home.faq.a16') },
  ]

  return (
    <>
      {/* Hero – modern horizontal carousel with global background images */}
      <section className="mkt-hero-carousel" aria-labelledby="hero-heading">
        <div className="mkt-hero-track" style={{ transform: `translateX(-${heroIndex * 100}%)` }}>
          {HERO_SLIDES.map((slide) => (
            <div
              key={slide.id}
              className="mkt-hero-slide"
              style={{ backgroundImage: `url(${slide.image})` }}
              aria-hidden={slide.id !== HERO_SLIDES[heroIndex].id}
            >
              <div className="mkt-hero-slide-overlay" />
              <div className="mkt-container mkt-container-wide mkt-hero-slide-inner">
                <div className="mkt-hero-slide-content">
                  <div className="mkt-eyebrow mkt-hero-slide-eyebrow" aria-hidden="true">
                    {slide.eyebrow}
                  </div>
                  <h1 id="hero-heading" className="mkt-hero-slide-title">
                    {slide.title}
                  </h1>
                  <p className="mkt-hero-slide-lead">{slide.lead}</p>
                  <p className="mkt-hero-slide-tagline">{slide.tagline}</p>
                  <div className="mkt-hero-actions">
                    <Link to={slide.ctaPrimaryTo} className="mkt-btn mkt-btn-primary mkt-btn-lg">
                      {slide.ctaPrimary}
                    </Link>
                    <Link to={slide.ctaSecondaryTo} className="mkt-btn mkt-btn-ghost mkt-btn-lg">
                      {slide.ctaSecondary}
                    </Link>
                  </div>
                  <div className="mkt-hero-search-bar-below">
                    <form className="hero-search-bar-transparent" onSubmit={handleSearch}>
                      <div className="hero-search-input-wrapper">
                        <svg className="hero-search-icon-left" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="11" cy="11" r="8"></circle>
                          <path d="m21 21-4.35-4.35"></path>
                        </svg>
                        <input 
                          type="text" 
                          className="hero-search-input" 
                          placeholder="Search for services, sectors, or locations..."
                          aria-label="Search"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                          <button type="button" className="hero-search-clear" onClick={clearSearch} aria-label="Clear search">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        )}
                      </div>
                      <button type="submit" className="hero-search-submit">
                        <span>Search</span>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="mkt-hero-arrow mkt-hero-arrow-prev"
          onClick={() => goToSlide(heroIndex - 1)}
          aria-label="Previous slide"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <button
          type="button"
          className="mkt-hero-arrow mkt-hero-arrow-next"
          onClick={() => goToSlide(heroIndex + 1)}
          aria-label="Next slide"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
        <div className="mkt-hero-dots" role="tablist" aria-label="Hero slides">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === heroIndex}
              aria-label={`Slide ${i + 1}`}
              className={`mkt-hero-dot ${i === heroIndex ? 'is-active' : ''}`}
              onClick={() => goToSlide(i)}
            />
          ))}
        </div>
      </section>

      {/* Latest updates – horizontal moving bar */}
      <section className="mkt-updates-bar" aria-label="Latest updates">
        <div className="mkt-updates-bar-inner">
          <span className="mkt-updates-bar-label">{t('home.updates.latest')}</span>
          <div className="mkt-updates-bar-wrap">
            <div className="mkt-updates-bar-track">
              {[...LATEST_UPDATES, ...LATEST_UPDATES].map((item, i) => (
                <span key={i} className="mkt-updates-bar-item">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Core Services – horizontal scrolling row (right to left) */}
      <section className="mkt-section-full muted mkt-services-scroll-section" aria-labelledby="services-heading" ref={servicesRef}>
        <div className={`mkt-container mkt-container-wide mkt-reveal ${servicesInView ? 'mkt-reveal-visible' : ''}`}>
          <div className="mkt-page-head">
            <h2 id="services-heading" className="mkt-section-heading">{t('home.services.heading')}</h2>
            <p className="mkt-lead" style={{ marginTop: 20, textAlign: 'left', maxWidth: '100%' }}>
              {t('home.services.lead')}
            </p>
          </div>
        </div>
        <div className="mkt-services-scroll-wrap" aria-hidden="false">
          <div className="mkt-services-scroll-track">
            {[1, 2].map((copy) => (
              <div key={copy} className="mkt-services-scroll-row">
                <Link to="/services/strategic-liaison-documentation" className="mkt-service-card-compact">
                  <div className="mkt-service-card-compact-icon mkt-service-card-compact-icon--illustration">
                    <img src="/coreservices-1.png" alt="" />
                  </div>
                  <h3 className="mkt-service-card-compact-title">{t('home.services.strategicLiaison.title')}</h3>
                  <div className="mkt-service-card-compact-desc">
                    <p><strong>{t('home.services.strategicLiaison.utilityCoordination')}</strong> {t('home.services.strategicLiaison.utilityDesc')}</p>
                    <p><strong>{t('home.services.strategicLiaison.technicalSubmission')}</strong> {t('home.services.strategicLiaison.technicalDesc')}</p>
                    <p><strong>{t('home.services.strategicLiaison.operationalStreamlining')}</strong> {t('home.services.strategicLiaison.operationalDesc')}</p>
                  </div>
                  <span className="mkt-service-card-compact-view-more">{t('home.services.strategicLiaison.viewMore')}</span>
                </Link>
                <Link to="/services/aggressive-payment-realization" className="mkt-service-card-compact">
                  <div className="mkt-service-card-compact-icon mkt-service-card-compact-icon--illustration">
                    <img src="/coreservices-2.png" alt="" />
                  </div>
                  <h3 className="mkt-service-card-compact-title">{t('home.services.aggressivePayment.title')}</h3>
                  <div className="mkt-service-card-compact-desc">
                    <p><strong>{t('home.services.aggressivePayment.lifecycleBilling')}</strong> {t('home.services.aggressivePayment.lifecycleDesc')}</p>
                    <p><strong>{t('home.services.aggressivePayment.assetRecovery')}</strong> {t('home.services.aggressivePayment.assetDesc')}</p>
                    <p><strong>{t('home.services.aggressivePayment.riskFreeCollection')}</strong> {t('home.services.aggressivePayment.riskFreeDesc')}</p>
                  </div>
                  <span className="mkt-service-card-compact-view-more">{t('home.services.aggressivePayment.viewMore')}</span>
                </Link>
                <Link to="/services/dispute-claim-management" className="mkt-service-card-compact">
                  <div className="mkt-service-card-compact-icon mkt-service-card-compact-icon--illustration">
                    <img src="/coreservices-3.png" alt="" />
                  </div>
                  <h3 className="mkt-service-card-compact-title">{t('home.services.disputeClaim.title')}</h3>
                  <div className="mkt-service-card-compact-desc">
                    <p><strong>{t('home.services.disputeClaim.resolutionExpert')}</strong> {t('home.services.disputeClaim.resolutionDesc')}</p>
                    <p><strong>{t('home.services.disputeClaim.caseAssessment')}</strong> {t('home.services.disputeClaim.caseDesc')}</p>
                    <p><strong>{t('home.services.disputeClaim.diplomaticNegotiation')}</strong> {t('home.services.disputeClaim.diplomaticDesc')}</p>
                  </div>
                  <span className="mkt-service-card-compact-view-more">{t('home.services.disputeClaim.viewMore')}</span>
                </Link>
                <Link to="/services/mis-reporting-compliance" className="mkt-service-card-compact">
                  <div className="mkt-service-card-compact-icon mkt-service-card-compact-icon--illustration">
                    <img src="/coreservices-4.png" alt="" />
                  </div>
                  <h3 className="mkt-service-card-compact-title">{t('home.services.misReporting.title')}</h3>
                  <div className="mkt-service-card-compact-desc">
                    <p><strong>{t('home.services.misReporting.dataTransparency')}</strong> {t('home.services.misReporting.dataDesc')}</p>
                    <p><strong>{t('home.services.misReporting.fullCompliance')}</strong> {t('home.services.misReporting.complianceDesc')}</p>
                    <p><strong>{t('home.services.misReporting.singlePoint')}</strong> {t('home.services.misReporting.singlePointDesc')}</p>
                  </div>
                  <span className="mkt-service-card-compact-view-more">{t('home.services.misReporting.viewMore')}</span>
                </Link>
                <Link to="/services/ai-integrated-saas-platform" className="mkt-service-card-compact">
                  <div className="mkt-service-card-compact-icon mkt-service-card-compact-icon--illustration">
                    <img src="/coreservices-5.png" alt="" />
                  </div>
                  <h3 className="mkt-service-card-compact-title">{t('home.services.aiSaaS.title')}</h3>
                  <div className="mkt-service-card-compact-desc">
                    <p><strong>{t('home.services.aiSaaS.intelligentAutomation')}</strong> {t('home.services.aiSaaS.intelligentDesc')}</p>
                    <p><strong>{t('home.services.aiSaaS.realTimeDashboards')}</strong> {t('home.services.aiSaaS.realTimeDesc')}</p>
                  </div>
                  <span className="mkt-service-card-compact-view-more">{t('home.services.aiSaaS.viewMore')}</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Company Stats Section */}
      <section className="mkt-section-full home-stats-section" aria-labelledby="stats-heading">
        <div className="mkt-container mkt-container-wide">
          <div className="home-stats-header">
            <h2 id="stats-heading" className="home-stats-title">Our Achievements</h2>
          </div>
          <div className="home-stats-grid">
            <div className="home-stat-item">
              <div className="home-stat-number">20+</div>
              <div className="home-stat-label">Years of Experienced Professionals</div>
            </div>
            <div className="home-stat-divider"></div>
            <div className="home-stat-item">
              <div className="home-stat-number">PAN</div>
              <div className="home-stat-label">India Coverage</div>
            </div>
            <div className="home-stat-divider"></div>
            <div className="home-stat-item">
              <div className="home-stat-number">95%</div>
              <div className="home-stat-label">Risk-Free Model</div>
            </div>
            <div className="home-stat-divider"></div>
            <div className="home-stat-item">
              <div className="home-stat-number">24/7</div>
              <div className="home-stat-label">Support Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Work in Action – showcase */}
      <section className="mkt-section-full home-showcase" aria-labelledby="showcase-heading" ref={showcaseRef}>
        <div className={`mkt-container mkt-container-wide mkt-reveal ${showcaseInView ? 'mkt-reveal-visible' : ''}`}>
          <div className="home-showcase-head">
            <span className="home-showcase-eyebrow">{t('home.showcase.eyebrow')}</span>
            <h2 id="showcase-heading" className="home-showcase-title">{t('home.showcase.title')}</h2>
            <p className="home-showcase-lead">{t('home.showcase.lead')}</p>
          </div>
          <div className="home-showcase-grid">
            {showcaseItems.map((item, i) => (
              <figure key={item.id} className="home-showcase-item mkt-animate-in" style={{ animationDelay: `${i * 0.06}s` }}>
                <span className="home-showcase-number" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <div className="home-showcase-image-wrap">
                  {item.logos ? (
                    <div className="home-showcase-psu-logos" aria-label={`${item.title}: ${item.logos.map((l) => (typeof l === 'string' ? l : l.name)).join(', ')}`}>
                      {item.logos.map((logo) => {
                        const name = typeof logo === 'string' ? logo : logo.name
                        const image = typeof logo === 'object' && logo.image ? logo.image : null
                        const imageFallback = typeof logo === 'object' && logo.imageFallback ? logo.imageFallback : null
                        return (
                          <div key={name} className={`home-showcase-psu-logo${image ? ' home-showcase-psu-logo--image-only' : ''}`}>
                            {image ? (
                              <img
                                src={image}
                                alt={name}
                                className="home-showcase-psu-logo-img"
                                loading="lazy"
                                onError={(e) => {
                                  if (imageFallback && !e.target.dataset.fallbackTried) {
                                    e.target.dataset.fallbackTried = '1'
                                    e.target.src = imageFallback
                                  } else {
                                    e.target.style.display = 'none'
                                  }
                                }}
                              />
                            ) : null}
                            {!image ? <span className="home-showcase-psu-logo-text">{name}</span> : null}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <>
                      <img
                        src={item.image}
                        alt={`${item.title} — ${item.caption}`}
                        className="home-showcase-image"
                        loading="lazy"
                        onError={(e) => { e.target.src = `https://placehold.co/800x520/0f172a/cbd5e1?text=${encodeURIComponent(item.title)}` }}
                      />
                      <div className="home-showcase-image-overlay" aria-hidden="true" />
                    </>
                  )}
                </div>
                <figcaption className="home-showcase-caption">
                  <span className="home-showcase-caption-label">{item.caption}</span>
                  <strong className="home-showcase-caption-title">{item.title}</strong>
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
            <h2 id="strengths-heading" className="mkt-section-heading" style={{ textAlign: 'left', marginBottom: 20 }}>{t('home.strengths.heading')}</h2>
            <p className="mkt-lead" style={{ textAlign: 'left', maxWidth: '100%', marginTop: 0 }}>
              {t('home.strengths.lead')}
            </p>
          </div>
          <div className="mkt-strengths-grid" style={{ marginTop: 48 }}>
            <div className="mkt-strength-card">
              <div className="mkt-strength-number">1</div>
              <h3 className="mkt-strength-title">{t('home.strengths.strength1.title')}</h3>
              <div className="mkt-strength-content">
                <div className="mkt-strength-item">
                  <strong className="mkt-strength-subtitle">{t('home.strengths.strength1.subtitle1')}</strong>
                  <p className="mkt-strength-text">{t('home.strengths.strength1.text1')}</p>
                </div>
                <div className="mkt-strength-item">
                  <strong className="mkt-strength-subtitle">{t('home.strengths.strength1.subtitle2')}</strong>
                  <p className="mkt-strength-text">{t('home.strengths.strength1.text2')}</p>
                </div>
              </div>
            </div>
            <div className="mkt-strength-card">
              <div className="mkt-strength-number">2</div>
              <h3 className="mkt-strength-title">{t('home.strengths.strength2.title')}</h3>
              <div className="mkt-strength-content">
                <div className="mkt-strength-item">
                  <strong className="mkt-strength-subtitle">{t('home.strengths.strength2.subtitle1')}</strong>
                  <p className="mkt-strength-text">{t('home.strengths.strength2.text1')}</p>
                </div>
                <div className="mkt-strength-item">
                  <strong className="mkt-strength-subtitle">{t('home.strengths.strength2.subtitle2')}</strong>
                  <p className="mkt-strength-text">{t('home.strengths.strength2.text2')}</p>
                </div>
              </div>
            </div>
            <div className="mkt-strength-card">
              <div className="mkt-strength-number">3</div>
              <h3 className="mkt-strength-title">{t('home.strengths.strength3.title')}</h3>
              <div className="mkt-strength-content">
                <div className="mkt-strength-item">
                  <strong className="mkt-strength-subtitle">{t('home.strengths.strength3.subtitle1')}</strong>
                  <p className="mkt-strength-text">{t('home.strengths.strength3.text1')}</p>
                </div>
                <div className="mkt-strength-item">
                  <strong className="mkt-strength-subtitle">{t('home.strengths.strength3.subtitle2')}</strong>
                  <p className="mkt-strength-text">{t('home.strengths.strength3.text2')}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mkt-strengths-metrics" style={{ marginTop: 64 }}>
            <div className="mkt-metric-item">
              <div className="mkt-metric-number">{t('home.strengths.metrics.years')}</div>
              <div className="mkt-metric-title">{t('home.strengths.metrics.yearsTitle')}</div>
              <div className="mkt-metric-desc">{t('home.strengths.metrics.yearsDesc')}</div>
            </div>
            <div className="mkt-metric-item">
              <div className="mkt-metric-number">{t('home.strengths.metrics.realization')}</div>
              <div className="mkt-metric-title">{t('home.strengths.metrics.realizationTitle')}</div>
              <div className="mkt-metric-desc">{t('home.strengths.metrics.realizationDesc')}</div>
            </div>
            <div className="mkt-metric-item">
              <div className="mkt-metric-number">{t('home.strengths.metrics.upfront')}</div>
              <div className="mkt-metric-title">{t('home.strengths.metrics.upfrontTitle')}</div>
              <div className="mkt-metric-desc">{t('home.strengths.metrics.upfrontDesc')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits of Partnership */}
      <section className="mkt-section-full muted" aria-labelledby="benefits-heading">
        <div className="mkt-container mkt-container-wide">
          <div className="mkt-page-head">
            <h2 id="benefits-heading" className="mkt-section-heading">{t('home.benefits.heading')}</h2>
          </div>
          <div className="mkt-benefits-intro">
            <p className="mkt-body">
              {t('home.benefits.intro')}
            </p>
          </div>
          <div className="mkt-benefits-grid mkt-benefits-grid-partnership">
            <div className="mkt-benefit-item">
              <div className="mkt-benefit-item-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v12M15 9H9.5a1.5 1.5 0 0 0 0 3h4a1.5 1.5 0 0 1 0 3H9" />
                </svg>
              </div>
              <div className="mkt-benefit-item-content">
                <h3 className="mkt-benefit-item-title">{t('home.benefits.costMinimization')}</h3>
                <p className="mkt-benefit-item-desc">{t('home.benefits.costMinimizationDesc')}</p>
              </div>
            </div>
            <div className="mkt-benefit-item">
              <div className="mkt-benefit-item-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div className="mkt-benefit-item-content">
                <h3 className="mkt-benefit-item-title">{t('home.benefits.badDebts')}</h3>
                <p className="mkt-benefit-item-desc">{t('home.benefits.badDebtsDesc')}</p>
              </div>
            </div>
            <div className="mkt-benefit-item">
              <div className="mkt-benefit-item-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div className="mkt-benefit-item-content">
                <h3 className="mkt-benefit-item-title">{t('home.benefits.improvedDSO')}</h3>
                <p className="mkt-benefit-item-desc">{t('home.benefits.improvedDSODesc')}</p>
              </div>
            </div>
            <div className="mkt-benefit-item">
              <div className="mkt-benefit-item-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div className="mkt-benefit-item-content">
                <h3 className="mkt-benefit-item-title">{t('home.benefits.dataConfidentiality')}</h3>
                <p className="mkt-benefit-item-desc">{t('home.benefits.dataConfidentialityDesc')}</p>
              </div>
            </div>
            <div className="mkt-benefit-item">
              <div className="mkt-benefit-item-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L18 2 20 6 4 6 6 2z" />
                  <path d="M4 6v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6" />
                  <path d="M8 10h0M16 10h0" />
                </svg>
              </div>
              <div className="mkt-benefit-item-content">
                <h3 className="mkt-benefit-item-title">{t('home.benefits.costSavings')}</h3>
                <p className="mkt-benefit-item-desc">{t('home.benefits.costSavingsDesc')}</p>
              </div>
            </div>
            <div className="mkt-benefit-item">
              <div className="mkt-benefit-item-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
              </div>
              <div className="mkt-benefit-item-content">
                <h3 className="mkt-benefit-item-title">{t('home.benefits.increasedRecoveries')}</h3>
                <p className="mkt-benefit-item-desc">{t('home.benefits.increasedRecoveriesDesc')}</p>
              </div>
            </div>
            <div className="mkt-benefit-item">
              <div className="mkt-benefit-item-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 14h2a3 3 0 0 0 3-3V9a3 3 0 0 0-5.83-1.25M11 14H9a3 3 0 0 1-3-3V9a3 3 0 0 1 5.83-1.25" />
                  <path d="M8 12h8" />
                </svg>
              </div>
              <div className="mkt-benefit-item-content">
                <h3 className="mkt-benefit-item-title">{t('home.benefits.fullContractClosure')}</h3>
                <p className="mkt-benefit-item-desc">{t('home.benefits.fullContractClosureDesc')}</p>
              </div>
            </div>
            <div className="mkt-benefit-item">
              <div className="mkt-benefit-item-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="mkt-benefit-item-content">
                <h3 className="mkt-benefit-item-title">{t('home.benefits.teamFocus')}</h3>
                <p className="mkt-benefit-item-desc">{t('home.benefits.teamFocusDesc')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Outsource + Comparison — redesigned: cards + slow auto-scroll, mobile-first */}
      <section className="mkt-section-full home-outsource-section" aria-labelledby="outsource-heading" ref={outsourceRef}>
        <div className={`mkt-container mkt-container-wide mkt-reveal ${outsourceInView ? 'mkt-reveal-visible' : ''}`}>
          <div className="home-outsource-header">
            <h2 id="outsource-heading" className="home-outsource-title">{t('home.outsource.heading')}</h2>
            <p className="home-outsource-lead">{t('home.outsource.lead')}</p>
          </div>
          <div className="home-outsource-comparison-header">
            <h3 className="home-outsource-comparison-title">{t('home.outsource.comparisonHeading')}</h3>
            <p className="home-outsource-comparison-subtitle">{t('home.outsource.comparisonSubtitle')}</p>
          </div>

          {/* Comparison: single modern tabular form */}
          <div className="home-comparison-wrap">
            <div className="home-comparison-table-card">
              <table className="home-comparison-table" role="table" aria-label={t('home.outsource.comparisonSubtitle')}>
                <thead>
                  <tr>
                    <th scope="col" className="home-comparison-th-feature">{t('home.outsource.comparison.feature')}</th>
                    <th scope="col" className="home-comparison-th-inhouse">{t('home.outsource.comparison.inHouse')}</th>
                    <th scope="col" className="home-comparison-th-nbaurum">{t('home.outsource.comparison.nbaurum')}</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, idx) => (
                    <tr key={row.key} className={idx % 2 === 1 ? 'home-comparison-row-alt' : ''}>
                      <td className="home-comparison-cell-feature">{row.feature}</td>
                      <td className="home-comparison-cell-inhouse">{row.inHouse}</td>
                      <td className="home-comparison-cell-nbaurum">{row.nbaurum}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Time-Value of Money — modern card */}
          <div className="home-outsource-timevalue-card">
            <div className="home-outsource-timevalue-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <h3 className="home-outsource-timevalue-title">{t('home.outsource.timeValue.heading')}</h3>
            <p className="home-outsource-timevalue-text">{t('home.outsource.timeValue.text')}</p>
          </div>
          {/* Cost-Benefit Analysis - Redesigned */}
          <div className="home-cost-benefit-section" style={{ marginTop: 48 }}>
            <div className="home-cost-benefit-header">
              <h3 className="home-cost-benefit-title">{t('home.outsource.costBenefit.title')}</h3>
              <p className="home-cost-benefit-subtitle">{t('home.outsource.costBenefit.subtitle')}</p>
            </div>
            <div className="home-cost-benefit-grid">
              <div className="home-cost-benefit-card">
                <div className="home-cost-benefit-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </div>
                <h4 className="home-cost-benefit-card-title">{t('home.outsource.costBenefit.timeValue')}</h4>
                <p className="home-cost-benefit-card-desc">{t('home.outsource.costBenefit.timeValueDesc')}</p>
              </div>
              <div className="home-cost-benefit-card">
                <div className="home-cost-benefit-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                    <polyline points="17 6 23 6 23 12"></polyline>
                  </svg>
                </div>
                <h4 className="home-cost-benefit-card-title">{t('home.outsource.costBenefit.opportunityCost')}</h4>
                <p className="home-cost-benefit-card-desc">{t('home.outsource.costBenefit.opportunityCostDesc')}</p>
              </div>
              <div className="home-cost-benefit-card">
                <div className="home-cost-benefit-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                    <line x1="9" y1="9" x2="15" y2="9"></line>
                    <line x1="9" y1="15" x2="15" y2="15"></line>
                  </svg>
                </div>
                <h4 className="home-cost-benefit-card-title">{t('home.outsource.costBenefit.fixedVsVariable')}</h4>
                <p className="home-cost-benefit-card-desc">{t('home.outsource.costBenefit.fixedVsVariableDesc')}</p>
              </div>
              <div className="home-cost-benefit-card home-cost-benefit-card-highlight">
                <div className="home-cost-benefit-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </div>
                <h4 className="home-cost-benefit-card-title">{t('home.outsource.costBenefit.comparativeROI')}</h4>
                <p className="home-cost-benefit-card-desc">{t('home.outsource.costBenefit.comparativeROIDesc')}</p>
              </div>
            </div>
          </div>

          {/* Strategic Necessity - Redesigned (horizontal marquee) */}
          <div className="home-strategic-necessity-section" style={{ marginTop: 64 }}>
            <div className="home-strategic-necessity-header">
              <h3 className="home-strategic-necessity-title">{t('home.outsource.strategicNecessity.title')}</h3>
              <p className="home-strategic-necessity-subtitle">{t('home.outsource.strategicNecessity.subtitle')}</p>
            </div>
            <div className="home-strategic-necessity-marquee" aria-hidden="false">
              <div className="home-strategic-necessity-track">
                {[
                  { label: t('home.outsource.strategicNecessity.professionalNeutrality'), icon: 'shield' },
                  { label: t('home.outsource.strategicNecessity.conversionCosts'), icon: 'trending' },
                  { label: t('home.outsource.strategicNecessity.specializedIntelligence'), icon: 'brain' },
                  { label: t('home.outsource.strategicNecessity.coreCompetencies'), icon: 'target' },
                  { label: t('home.outsource.strategicNecessity.cashFlowVelocity'), icon: 'zap' },
                  { label: t('home.outsource.strategicNecessity.badDebtProvisioning'), icon: 'chart' },
                  { label: t('home.outsource.strategicNecessity.disputeMediation'), icon: 'handshake' },
                  { label: t('home.outsource.strategicNecessity.agingAnalysis'), icon: 'database' },
                  { label: t('home.outsource.strategicNecessity.businessContinuity'), icon: 'refresh' },
                  { label: t('home.outsource.strategicNecessity.regulatoryCompliance'), icon: 'check-circle' },
                ]
                  // Duplicate list to create seamless horizontal loop
                  .flatMap((item, i) => ([
                    { ...item, key: `${i}-a` },
                    { ...item, key: `${i}-b` },
                  ]))
                  .map((item) => (
                    <div key={item.key} className="home-strategic-necessity-item">
                  <div className="home-strategic-necessity-item-icon">
                    {item.icon === 'shield' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                      </svg>
                    )}
                    {item.icon === 'trending' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                        <polyline points="17 6 23 6 23 12"></polyline>
                      </svg>
                    )}
                    {item.icon === 'brain' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                        <line x1="12" y1="19" x2="12" y2="22"></line>
                        <line x1="8" y1="22" x2="16" y2="22"></line>
                      </svg>
                    )}
                    {item.icon === 'target' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <circle cx="12" cy="12" r="6"></circle>
                        <circle cx="12" cy="12" r="2"></circle>
                      </svg>
                    )}
                    {item.icon === 'zap' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                      </svg>
                    )}
                    {item.icon === 'chart' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="20" x2="18" y2="10"></line>
                        <line x1="12" y1="20" x2="12" y2="4"></line>
                        <line x1="6" y1="20" x2="6" y2="14"></line>
                      </svg>
                    )}
                    {item.icon === 'handshake' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 14h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2z"></path>
                        <path d="M7 10h.01M17 10h.01M7 14h.01M17 14h.01"></path>
                      </svg>
                    )}
                    {item.icon === 'database' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                      </svg>
                    )}
                    {item.icon === 'refresh' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="23 4 23 10 17 10"></polyline>
                        <polyline points="1 20 1 14 7 14"></polyline>
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                      </svg>
                    )}
                    {item.icon === 'check-circle' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                    )}
                  </div>
                  <span className="home-strategic-necessity-item-label">{item.label}</span>
                </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* System showcase – our platform in action */}
      <section className="mkt-section-full home-system-showcase" aria-labelledby="system-heading">
        <div className="mkt-container mkt-container-wide">
          <div className="mkt-page-head">
            <h2 id="system-heading" className="mkt-section-heading">{t('home.system.heading')}</h2>
            <p className="mkt-lead">{t('home.system.lead')}</p>
          </div>
          <div className="home-system-showcase-wrapper">
            <div className="home-system-device-frame">
              <div className="home-system-device-header">
                <div className="home-system-device-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="home-system-device-url">app.nbaurum.com/dashboard</div>
                <div className="home-system-device-controls">
                  <span></span>
                  <span></span>
                </div>
              </div>
              <div className="home-system-screen">
                <div className="home-system-screen-content">
                  <div className="home-system-dashboard-preview">
                    <div className="home-system-dashboard-header">
                      <div className="home-system-dashboard-title">
                        <h3>{t('home.system.dashboardTitle')}</h3>
                        <span className="home-system-badge">{t('home.system.live')}</span>
                      </div>
                      <div className="home-system-dashboard-actions">
                        <button className="home-system-btn-icon" aria-label="Notifications">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                          </svg>
                        </button>
                        <button className="home-system-btn-icon" aria-label="Settings">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="home-system-metrics-grid">
                      <div className="home-system-metric-card">
                        <div className="home-system-metric-label">{t('home.system.totalReceivables')}</div>
                        <div className="home-system-metric-value">₹2,45,67,890</div>
                        <div className="home-system-metric-change positive">+12.5% {t('home.system.vsLastMonth')}</div>
                      </div>
                      <div className="home-system-metric-card">
                        <div className="home-system-metric-label">{t('home.system.dso')}</div>
                        <div className="home-system-metric-value">68 days</div>
                        <div className="home-system-metric-change positive">-15 days {t('home.system.improvement')}</div>
                      </div>
                      <div className="home-system-metric-card">
                        <div className="home-system-metric-label">{t('home.system.collectionRate')}</div>
                        <div className="home-system-metric-value">94.2%</div>
                        <div className="home-system-metric-change positive">+8.3% {t('home.system.thisQuarter')}</div>
                      </div>
                      <div className="home-system-metric-card">
                        <div className="home-system-metric-label">{t('home.system.pendingActions')}</div>
                        <div className="home-system-metric-value">23</div>
                        <div className="home-system-metric-change">12 {t('home.system.requireFollowUp')}</div>
                      </div>
                    </div>
                    <div className="home-system-chart-area">
                      <div className="home-system-chart-header">
                        <h4>{t('home.system.collectionPerformance')}</h4>
                        <div className="home-system-chart-legend">
                          <span><span className="home-system-legend-dot" style={{ background: '#0f4c81' }}></span> {t('home.system.thisMonth')}</span>
                          <span><span className="home-system-legend-dot" style={{ background: '#cbd5e1' }}></span> {t('home.system.lastMonth')}</span>
                        </div>
                      </div>
                      <div className="home-system-chart-bars">
                        {[65, 72, 68, 85, 78, 92, 88].map((height, i) => (
                          <div key={i} className="home-system-chart-bar-wrapper">
                            <div className="home-system-chart-bar" style={{ height: `${height}%` }}></div>
                            <div className="home-system-chart-bar" style={{ height: `${height - 15}%`, background: '#cbd5e1' }}></div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="home-system-table-preview">
                      <div className="home-system-table-header">
                        <h4>{t('home.system.recentInvoices')}</h4>
                        <button className="home-system-btn-text">{t('home.system.viewAll')}</button>
                      </div>
                      <div className="home-system-table">
                        <div className="home-system-table-row header">
                          <div>{t('home.system.invoice')}</div>
                          <div>{t('home.system.client')}</div>
                          <div>{t('home.system.amount')}</div>
                          <div>{t('home.system.status')}</div>
                          <div>{t('home.system.dueDate')}</div>
                        </div>
                        {[
                          { inv: 'INV-2024-001', client: 'State Electricity Board', amount: '₹12,45,000', status: t('home.system.paid'), due: '15 Jan 2024' },
                          { inv: 'INV-2024-002', client: 'Solar Power Corp', amount: '₹8,90,500', status: t('home.system.pending'), due: '22 Jan 2024' },
                          { inv: 'INV-2024-003', client: 'Railway Authority', amount: '₹15,67,200', status: t('home.system.inProcess'), due: '28 Jan 2024' },
                        ].map((row, i) => (
                          <div key={i} className="home-system-table-row">
                            <div data-label={t('home.system.invoice')}>{row.inv}</div>
                            <div data-label={t('home.system.client')}>{row.client}</div>
                            <div data-label={t('home.system.amount')}>{row.amount}</div>
                            <div data-label={t('home.system.status')}><span className={`home-system-status-badge ${row.status.toLowerCase().replace(' ', '-')}`}>{row.status}</span></div>
                            <div data-label={t('home.system.dueDate')}>{row.due}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="home-system-features-list">
              <div className="home-system-feature-item">
                <div className="home-system-feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                  </svg>
                </div>
                <div className="home-system-feature-content">
                  <h4>{t('home.system.aiPoweredInsights')}</h4>
                  <p>{t('home.system.aiPoweredDesc')}</p>
                </div>
              </div>
              <div className="home-system-feature-item">
                <div className="home-system-feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                    <path d="M9 9h6v6H9z"></path>
                  </svg>
                </div>
                <div className="home-system-feature-content">
                  <h4>{t('home.system.realTimeDashboards')}</h4>
                  <p>{t('home.system.realTimeDashboardsDesc')}</p>
                </div>
              </div>
              <div className="home-system-feature-item">
                <div className="home-system-feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                </div>
                <div className="home-system-feature-content">
                  <h4>{t('home.system.automatedWorkflows')}</h4>
                  <p>{t('home.system.automatedWorkflowsDesc')}</p>
                </div>
              </div>
              <div className="home-system-feature-item">
                <div className="home-system-feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                </div>
                <div className="home-system-feature-content">
                  <h4>{t('home.system.complianceReady')}</h4>
                  <p>{t('home.system.complianceReadyDesc')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ready to Secure Your Cash Flow - feature cards */}
      <section className="mkt-section-full home-cashflow" aria-labelledby="cashflow-heading" ref={cashflowRef}>
        <div className={`mkt-container mkt-container-wide home-cashflow-inner mkt-reveal ${cashflowInView ? 'mkt-reveal-visible' : ''}`}>
          <h2 id="cashflow-heading" className="home-cashflow-title">{t('home.cashflow.heading')}</h2>
          <p className="home-cashflow-desc">
            {t('home.cashflow.desc')}
          </p>
          
          <div className="home-cashflow-cards">
            <div className="home-cashflow-card">
              <div className="home-cashflow-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  <path d="M9 12l2 2 4-4"></path>
                </svg>
              </div>
              <h3>{t('home.cashflow.zeroRisk')}</h3>
              <p>{t('home.cashflow.zeroRiskDesc')}</p>
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
              <h3>{t('home.cashflow.sectorExperts')}</h3>
              <p>{t('home.cashflow.sectorExpertsDesc')}</p>
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
              <h3>{t('home.cashflow.endToEnd')}</h3>
              <p>{t('home.cashflow.endToEndDesc')}</p>
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
              <h3>{t('home.cashflow.reputationFirst')}</h3>
              <p>{t('home.cashflow.reputationFirstDesc')}</p>
            </div>
          </div>
          
          <div className="home-cashflow-actions">
            <Link to="/register" className="mkt-btn mkt-btn-primary mkt-btn-lg">
              {t('home.cashflow.getStarted')}
            </Link>
            <Link to="/contact" className="mkt-btn mkt-btn-ghost mkt-btn-lg">
              {t('home.cashflow.getInTouch')}
            </Link>
          </div>
        </div>
      </section>

      {/* Understanding Accounts Receivable – insights */}
      <section className="mkt-section-full home-ar-insights" aria-labelledby="ar-insights-heading" ref={arInsightsRef}>
        <div className={`mkt-container mkt-container-wide mkt-reveal ${arInsightsInView ? 'mkt-reveal-visible' : ''}`}>
          <div className="home-ar-insights-card">
            <h2 id="ar-insights-heading" className="home-ar-insights-title">{t('home.arInsights.heading')}</h2>
            <p className="home-ar-insights-lead">{t('home.arInsights.lead')}</p>
            <p className="home-ar-insights-para">{t('home.arInsights.para2')}</p>
            <p className="home-ar-insights-para">{t('home.arInsights.para3')}</p>
            <p className="home-ar-insights-closing">{t('home.arInsights.closing')}</p>
          </div>
        </div>
      </section>

      {/* FAQ – left: 5 FAQs, right: image placeholder */}
      <section className="mkt-section-full muted home-faq" aria-labelledby="faq-heading" ref={faqRef}>
        <div className={`mkt-container mkt-container-wide home-faq-inner mkt-reveal ${faqInView ? 'mkt-reveal-visible' : ''}`}>
          <div className="home-faq-head">
            <h2 id="faq-heading" className="home-faq-title">{t('home.faq.heading')}</h2>
            <p className="home-faq-subtitle">{t('home.faq.subtitle')}</p>
          </div>

          <div className="home-faq-layout">
            <div className="home-faq-list-wrap">
              <div className="home-faq-list">
                {faqs.slice(0, FAQ_DISPLAY_COUNT).map((faq, i) => (
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
                      <p className="home-faq-answer-text">{faq.a}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="home-faq-image-wrap">
              <img
                src="https://img.freepik.com/free-vector/tiny-business-people-with-giant-faq-letters-gadget-users-searching-instructions-useful-information-flat-vector-illustration-customer-support-solution-concept-banner-landing-web-page_74855-23409.jpg?semt=ais_wordcount_boost&w=740&q=80"
                alt="FAQ — customer support and useful information"
                className="home-faq-image"
                loading="lazy"
              />
            </div>
          </div>
          <div className="home-faq-view-more">
            <Link to="/faq" className="mkt-btn mkt-btn-primary mkt-btn-lg">
              {t('home.faq.viewMore')}
            </Link>
            <p className="home-faq-view-more-hint">{t('home.faq.viewMoreHint')}</p>
          </div>
        </div>
      </section>

      {/* Our Seamless Onboarding Process */}
      <section className="mkt-section-full" aria-labelledby="onboarding-heading">
        <div className="mkt-container mkt-container-wide">
          <div className="mkt-page-head">
            <h2 id="onboarding-heading" className="mkt-section-heading">{t('home.onboarding.heading')}</h2>
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
              {t('home.onboarding.getStarted')}
            </Link>
            <Link to="/contact" className="mkt-btn mkt-btn-ghost mkt-btn-lg">
              {t('home.onboarding.talkToUs')}
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
