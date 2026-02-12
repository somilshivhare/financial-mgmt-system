import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMarketingLanguage } from '../contexts/MarketingLanguageContext'
import '../styles/Marketing.css'

export default function FAQ() {
  const { t } = useMarketingLanguage()
  const [openIndex, setOpenIndex] = useState(null)

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

  useEffect(() => {
    document.title = 'FAQ – NB Aurum Solutions | Payment Collections & Consultancy'
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Frequently asked questions about NB Aurum Solutions: recovery process, No Collection No Fee, DSO, retention, PBG, Pole-to-Pole model, PAN-India service, and more.')
    }
  }, [])

  return (
    <>
      <section className="mkt-section-full faq-page-hero" aria-labelledby="faq-page-heading">
        <div className="mkt-container mkt-container-wide">
          <div className="mkt-page-head">
            <div className="mkt-eyebrow" aria-hidden="true">Support</div>
            <h1 id="faq-page-heading" className="mkt-section-heading">{t('home.faq.heading')}</h1>
            <p className="mkt-lead">{t('home.faq.subtitle')}</p>
          </div>
        </div>
      </section>

      <section className="mkt-section-full muted faq-page-list" aria-label="All FAQs">
        <div className="mkt-container mkt-container-wide">
          <div className="faq-page-list-inner">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className={`faq-page-item ${openIndex === i ? 'is-open' : ''}`}
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpenIndex(openIndex === i ? null : i) } }}
                aria-expanded={openIndex === i}
              >
                <div className="faq-page-question">
                  <span className="faq-page-q-label">Q{i + 1}</span>
                  <span className="faq-page-q-text">{faq.q}</span>
                  <span className="faq-page-icon" aria-hidden="true">{openIndex === i ? '−' : '+'}</span>
                </div>
                <div className="faq-page-answer">
                  <p className="faq-page-answer-text">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="faq-page-cta">
            <p className="faq-page-cta-hint">{t('home.faq.viewMoreHint')}</p>
            <Link to="/contact" className="mkt-btn mkt-btn-primary mkt-btn-lg">
              {t('home.faq.viewMore')}
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
