import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useMarketingLanguage } from '../contexts/MarketingLanguageContext'
import { useInView } from '../hooks/useInView'

export default function About() {
  const { t } = useMarketingLanguage()
  const [missionRef, missionInView] = useInView({ rootMargin: '0px 0px -60px 0px' })
  const [complianceRef, complianceInView] = useInView({ rootMargin: '0px 0px -60px 0px' })
  const [valuesRef, valuesInView] = useInView({ rootMargin: '0px 0px -60px 0px' })
  const [differentiatesRef, differentiatesInView] = useInView({ rootMargin: '0px 0px -60px 0px' })

  useEffect(() => {
    document.title = 'About NB Aurum Solutions – Payment Collections & Consultancy'
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Your trusted partner in payment collections & consultancy. Specialization in Power, Solar, Telecom, Railways, PSU\'s & Government Projects – PAN India. 20+ years expertise, integrity first.')
    }
  }, [])

  return (
    <>
      {/* Hero Section */}
      <section className="mkt-section-full" aria-labelledby="about-heading">
        <div className="mkt-container mkt-container-wide">
          <div className="mkt-page-head">
            <div className="mkt-eyebrow" aria-hidden="true">About Us</div>
            <h1 id="about-heading" className="mkt-section-heading">{t('about.heading')}</h1>
            <p className="mkt-lead">
              {t('about.lead')}
            </p>
          </div>
          <div className="mkt-strengths-metrics" style={{ marginTop: 64 }}>
            <div className="mkt-metric-item">
              <div className="mkt-metric-number">20+</div>
              <div className="mkt-metric-title">Years of Experience</div>
              <div className="mkt-metric-desc">Two decades navigating B2G payment landscapes</div>
            </div>
            <div className="mkt-metric-item">
              <div className="mkt-metric-number">95%</div>
              <div className="mkt-metric-title">Commitment</div>
              <div className="mkt-metric-desc">Committed to complete payment recovery</div>
            </div>
            <div className="mkt-metric-item">
              <div className="mkt-metric-number">PAN</div>
              <div className="mkt-metric-title">India Coverage</div>
              <div className="mkt-metric-desc">Nationwide network across all states</div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="mkt-section-full muted" aria-labelledby="mission-heading" ref={missionRef}>
        <div className={`mkt-container mkt-container-wide mkt-reveal ${missionInView ? 'mkt-reveal-visible' : ''}`}>
          <div className="mkt-page-head">
            <h2 id="mission-heading" className="mkt-section-heading">{t('about.mission.title')}</h2>
            <p className="mkt-lead">
              {t('about.mission.text')}
            </p>
          </div>
          <div className="mkt-card" style={{ marginTop: 48, position: 'relative', overflow: 'hidden' }}>
            <div className="mkt-strength-number" style={{ fontSize: '8rem', fontWeight: 800, color: 'var(--mkt-primary)', opacity: 0.05, position: 'absolute', top: -20, right: -20, lineHeight: 1 }} aria-hidden="true">01</div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h3 className="mkt-strength-title" style={{ fontSize: '1.75rem', marginBottom: 24, marginTop: 0 }}>{t('about.mission.standFor')}</h3>
              <p className="mkt-strength-text" style={{ fontSize: '1.1rem', lineHeight: 1.8, marginBottom: 32 }}>
                {t('about.mission.standForText')}
              </p>
              <Link to="/who-we-are" className="mkt-btn mkt-btn-primary">
                {t('about.mission.whoWeAre')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance Section */}
      <section className="mkt-section-full" aria-labelledby="compliance-heading" ref={complianceRef}>
        <div className={`mkt-container mkt-container-wide mkt-reveal ${complianceInView ? 'mkt-reveal-visible' : ''}`}>
          <div className="mkt-page-head">
            <h2 id="compliance-heading" className="mkt-section-heading">{t('about.compliance.heading')}</h2>
            <p className="mkt-lead">
              {t('about.compliance.lead')}
            </p>
          </div>
          <div className="mkt-grid-3" style={{ marginTop: 48 }}>
            <div className="mkt-card">
              <div className="mkt-benefit-item-icon" aria-hidden="true" style={{ marginBottom: 20 }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <h3 className="mkt-benefit-item-title" style={{ marginTop: 0 }}>{t('about.compliance.complianceControls.title')}</h3>
              <p className="mkt-body">
                {t('about.compliance.complianceControls.text')}
              </p>
            </div>
            <div className="mkt-card">
              <div className="mkt-benefit-item-icon" aria-hidden="true" style={{ marginBottom: 20 }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h3 className="mkt-benefit-item-title" style={{ marginTop: 0 }}>{t('about.compliance.dataConfidentiality.title')}</h3>
              <p className="mkt-body">
                {t('about.compliance.dataConfidentiality.text')}
              </p>
            </div>
            <div className="mkt-card">
              <div className="mkt-benefit-item-icon" aria-hidden="true" style={{ marginBottom: 20 }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
              </div>
              <h3 className="mkt-benefit-item-title" style={{ marginTop: 0 }}>{t('about.compliance.scalability.title')}</h3>
              <p className="mkt-body">
                {t('about.compliance.scalability.text')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="mkt-section-full muted" aria-labelledby="values-heading" ref={valuesRef}>
        <div className={`mkt-container mkt-container-wide mkt-reveal ${valuesInView ? 'mkt-reveal-visible' : ''}`}>
          <div className="mkt-page-head">
            <h2 id="values-heading" className="mkt-section-heading">{t('about.values.heading')}</h2>
            <p className="mkt-lead">
              {t('about.values.lead')}
            </p>
          </div>
          <div className="mkt-grid-2" style={{ marginTop: 48 }}>
            <div className="mkt-card" style={{ position: 'relative', overflow: 'hidden' }}>
              <div className="mkt-strength-number" style={{ fontSize: '6rem', fontWeight: 800, color: 'var(--mkt-primary)', opacity: 0.05, position: 'absolute', top: -10, right: -10, lineHeight: 1 }} aria-hidden="true">02</div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h3 className="mkt-strength-title" style={{ fontSize: '1.5rem', marginBottom: 24, marginTop: 0 }}>{t('about.values.howWeDeliver.title')}</h3>
                <ul className="mkt-timeline">
                  <li>
                    <span className="mkt-timeline-dot" aria-hidden="true" />
                    <div>
                      <strong className="mkt-strength-subtitle">{t('about.values.howWeDeliver.strategicLiaison.title')}</strong>
                      <p className="mkt-strength-text">{t('about.values.howWeDeliver.strategicLiaison.text')}</p>
                    </div>
                  </li>
                  <li>
                    <span className="mkt-timeline-dot" aria-hidden="true" />
                    <div>
                      <strong className="mkt-strength-subtitle">{t('about.values.howWeDeliver.paymentRealization.title')}</strong>
                      <p className="mkt-strength-text">{t('about.values.howWeDeliver.paymentRealization.text')}</p>
                    </div>
                  </li>
                  <li>
                    <span className="mkt-timeline-dot" aria-hidden="true" />
                    <div>
                      <strong className="mkt-strength-subtitle">{t('about.values.howWeDeliver.disputeClosure.title')}</strong>
                      <p className="mkt-strength-text">{t('about.values.howWeDeliver.disputeClosure.text')}</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mkt-card" style={{ position: 'relative', overflow: 'hidden' }}>
              <div className="mkt-strength-number" style={{ fontSize: '6rem', fontWeight: 800, color: 'var(--mkt-primary)', opacity: 0.05, position: 'absolute', top: -10, right: -10, lineHeight: 1 }} aria-hidden="true">03</div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h3 className="mkt-strength-title" style={{ fontSize: '1.5rem', marginBottom: 24, marginTop: 0 }}>{t('about.values.coreValues.title')}</h3>
                <ul className="mkt-benefit-list" style={{ listStyle: 'none', padding: 0 }}>
                  <li style={{ paddingLeft: 24, position: 'relative', marginBottom: 16 }}>
                    <span style={{ position: 'absolute', left: 0, top: 6, width: 6, height: 6, borderRadius: '50%', background: 'var(--mkt-primary)' }} aria-hidden="true" />
                    <p className="mkt-body" style={{ margin: 0 }}>{t('about.values.coreValues.value1')}</p>
                  </li>
                  <li style={{ paddingLeft: 24, position: 'relative', marginBottom: 16 }}>
                    <span style={{ position: 'absolute', left: 0, top: 6, width: 6, height: 6, borderRadius: '50%', background: 'var(--mkt-primary)' }} aria-hidden="true" />
                    <p className="mkt-body" style={{ margin: 0 }}>{t('about.values.coreValues.value2')}</p>
                  </li>
                  <li style={{ paddingLeft: 24, position: 'relative', marginBottom: 16 }}>
                    <span style={{ position: 'absolute', left: 0, top: 6, width: 6, height: 6, borderRadius: '50%', background: 'var(--mkt-primary)' }} aria-hidden="true" />
                    <p className="mkt-body" style={{ margin: 0 }}>{t('about.values.coreValues.value3')}</p>
                  </li>
                  <li style={{ paddingLeft: 24, position: 'relative', marginBottom: 16 }}>
                    <span style={{ position: 'absolute', left: 0, top: 6, width: 6, height: 6, borderRadius: '50%', background: 'var(--mkt-primary)' }} aria-hidden="true" />
                    <p className="mkt-body" style={{ margin: 0 }}>{t('about.values.coreValues.value4')}</p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Differentiates Section */}
      <section className="mkt-section-full" aria-labelledby="differentiates-heading" ref={differentiatesRef}>
        <div className={`mkt-container mkt-container-wide mkt-reveal ${differentiatesInView ? 'mkt-reveal-visible' : ''}`}>
          <div className="mkt-page-head">
            <h2 id="differentiates-heading" className="mkt-section-heading">{t('about.differentiates.heading')}</h2>
            <p className="mkt-lead">
              {t('about.differentiates.lead')}
            </p>
          </div>
          <div className="mkt-strengths-grid" style={{ marginTop: 48 }}>
            <div className="mkt-strength-card">
              <div className="mkt-strength-number">1</div>
              <h3 className="mkt-strength-title">{t('about.differentiates.domainExpertise.title')}</h3>
              <div className="mkt-strength-content">
                <p className="mkt-strength-text" style={{ marginTop: 0 }}>
                  {t('about.differentiates.domainExpertise.text')}
                </p>
              </div>
            </div>
            <div className="mkt-strength-card">
              <div className="mkt-strength-number">2</div>
              <h3 className="mkt-strength-title">{t('about.differentiates.panIndia.title')}</h3>
              <div className="mkt-strength-content">
                <p className="mkt-strength-text" style={{ marginTop: 0 }}>
                  {t('about.differentiates.panIndia.text')}
                </p>
              </div>
            </div>
            <div className="mkt-strength-card">
              <div className="mkt-strength-number">3</div>
              <h3 className="mkt-strength-title">{t('about.differentiates.riskFree.title')}</h3>
              <div className="mkt-strength-content">
                <p className="mkt-strength-text" style={{ marginTop: 0 }}>
                  {t('about.differentiates.riskFree.text')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Get started CTA */}
      <section className="mkt-section-full primary" aria-labelledby="get-started-heading">
        <div className="mkt-container mkt-container-wide">
          <div className="mkt-page-head">
            <h2 id="get-started-heading" className="mkt-section-heading">{t('about.getStarted.heading')}</h2>
            <p className="mkt-lead" style={{ color: 'rgba(255,255,255,0.9)' }}>
              {t('about.getStarted.lead')}
            </p>
          </div>
          <div style={{ marginTop: 48, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }}>
            <Link to="/register" className="mkt-btn mkt-btn-primary mkt-btn-lg" style={{ background: '#fff', color: 'var(--mkt-primary)' }}>
              {t('about.getStarted.getStarted')}
            </Link>
            <Link to="/contact" className="mkt-btn mkt-btn-ghost mkt-btn-lg" style={{ borderColor: 'rgba(255,255,255,0.5)', color: '#fff' }}>
              {t('about.getStarted.getInTouch')}
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
