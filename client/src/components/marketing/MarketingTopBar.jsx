import { useState, useEffect, useRef } from 'react'
import { useMarketingLanguage } from '../../contexts/MarketingLanguageContext'

const SUPPORT_EMAIL = 'nbaurum@gmail.com'

function formatDateTime(date) {
  const d = date.getDate()
  const m = date.toLocaleString('en-IN', { month: 'short' })
  const y = date.getFullYear()
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  return `${d}-${m}-${y} ${h}:${min}:${s}`
}

export default function MarketingTopBar() {
  const { language, setLanguage } = useMarketingLanguage()
  const [dateTime, setDateTime] = useState(() => formatDateTime(new Date()))
  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef(null)

  useEffect(() => {
    const isMobile = () => typeof window !== 'undefined' && window.innerWidth <= 768
    const intervalMs = isMobile() ? 10000 : 1000
    const interval = setInterval(() => {
      setDateTime(formatDateTime(new Date()))
    }, intervalMs)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangOpen(false)
      }
    }
    if (langOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [langOpen])

  const languageLabel = language === 'hi' ? 'हिंदी' : 'English'

  const tickerContent = (
    <>
      <span className="mkt-topbar-item" aria-hidden="true">
        <svg className="mkt-topbar-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        {dateTime}
      </span>
      <span className="mkt-topbar-ticker-sep" aria-hidden="true" />
      <a href={`mailto:${SUPPORT_EMAIL}`} className="mkt-topbar-item mkt-topbar-link">
        <svg className="mkt-topbar-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
        {SUPPORT_EMAIL}
      </a>
    </>
  )

  return (
    <div className="mkt-topbar" role="complementary" aria-label="Contact and language">
      <div className="mkt-topbar-inner">
        <div className="mkt-topbar-ticker-wrap" aria-hidden="true">
          <div className="mkt-topbar-ticker-track">
            <div className="mkt-topbar-ticker-item">{tickerContent}</div>
            <div className="mkt-topbar-ticker-item">{tickerContent}</div>
          </div>
        </div>
        <div className="mkt-topbar-right" ref={langRef}>
          <button
            type="button"
            className="mkt-topbar-lang-toggle"
            onClick={() => setLangOpen((v) => !v)}
            aria-expanded={langOpen}
            aria-haspopup="listbox"
            aria-label={language === 'hi' ? 'Select language' : 'भाषा चुनें'}
          >
            <span className="mkt-topbar-lang-label">{languageLabel}</span>
            <svg className="mkt-topbar-lang-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 4.5l3 3 3-3" />
            </svg>
          </button>
          {langOpen && (
            <div
              className="mkt-topbar-lang-dropdown"
              role="listbox"
              aria-label="Language"
            >
              <button
                type="button"
                role="option"
                aria-selected={language === 'en'}
                className={`mkt-topbar-lang-option ${language === 'en' ? 'is-selected' : ''}`}
                onClick={() => {
                  setLanguage('en')
                  setLangOpen(false)
                }}
              >
                English
              </button>
              <button
                type="button"
                role="option"
                aria-selected={language === 'hi'}
                className={`mkt-topbar-lang-option ${language === 'hi' ? 'is-selected' : ''}`}
                onClick={() => {
                  setLanguage('hi')
                  setLangOpen(false)
                }}
              >
                हिंदी
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
