import { useState, useEffect } from 'react'

function scrollToTop() {
  const options = { top: 0, left: 0, behavior: 'smooth' }
  window.scrollTo(options)
  document.documentElement.scrollTo(options)
  document.body.scrollTo(options)
  const mktPage = document.querySelector('.mkt-page')
  if (mktPage) mktPage.scrollTo(options)
  const mktMain = document.querySelector('.mkt-main')
  if (mktMain) mktMain.scrollTo(options)
}

export default function MarketingFloatingButtons() {
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const el = document.querySelector('.mkt-page') || document.documentElement
    const check = () => {
      // Use the larger of container scroll or window scroll so the button shows when page scrolls
      const containerY = el.scrollTop || 0
      const windowY = typeof window !== 'undefined' ? window.scrollY || 0 : 0
      const y = Math.max(containerY, windowY)
      setShowScrollTop(y > 300)
    }
    check()
    el.addEventListener('scroll', check, { passive: true })
    window.addEventListener('scroll', check, { passive: true })
    return () => {
      el.removeEventListener('scroll', check)
      window.removeEventListener('scroll', check)
    }
  }, [])

  return (
    <div className="mkt-floating-buttons" aria-hidden="true">
      <button
        type="button"
        className={`mkt-floating-btn mkt-floating-scroll-top ${showScrollTop ? 'is-visible' : ''}`}
        onClick={scrollToTop}
        aria-label="Scroll to top"
        title="Scroll to top"
      >
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
    </div>
  )
}
