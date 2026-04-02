import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useMarketingLanguage } from '../../contexts/MarketingLanguageContext'

const navLinkClass = ({ isActive }) => `mkt-nav-link ${isActive ? 'is-active' : ''}`

export default function MarketingNavbar() {
  const { t } = useMarketingLanguage()
  const [open, setOpen] = useState(false)
  const location = useLocation()

  const close = () => setOpen(false)

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  // Safety net: always clear any stale body/html scroll locks on route changes.
  useEffect(() => {
    document.body.style.overflow = ''
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.left = ''
    document.body.style.right = ''
    document.body.style.width = ''
    document.documentElement.style.touchAction = ''
    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.width = ''
      document.documentElement.style.touchAction = ''
    }
  }, [location.pathname])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 980 && open) {
        setOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [open])

  useEffect(() => {
    const drawer = document.getElementById('mobile-nav')
    const drawerInner = drawer?.querySelector('.mkt-nav-drawer-inner')
    const toggle = document.querySelector('.mkt-nav-toggle')

    const shouldClose = (target) => {
      if (!target || !drawer) return true
      if (toggle?.contains(target)) return false
      if (drawerInner?.contains(target)) return false
      return true
    }

    const handleClickOutside = (e) => {
      if (!open || window.innerWidth > 980) return
      if (shouldClose(e.target)) setOpen(false)
    }

    const handleEscape = (e) => {
      if (e.key === 'Escape' && open) setOpen(false)
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.addEventListener('click', handleClickOutside, true)
      return () => {
        document.removeEventListener('keydown', handleEscape)
        document.removeEventListener('click', handleClickOutside, true)
      }
    }
  }, [open])

  const scrollLockRef = useRef(0)
  useEffect(() => {
    const isMobile = window.innerWidth <= 980
    if (open && isMobile) {
      scrollLockRef.current = window.scrollY
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollLockRef.current}px`
      document.body.style.left = '0'
      document.body.style.right = '0'
      document.body.style.width = '100%'
      document.documentElement.style.touchAction = 'none'
    } else {
      const scrollY = scrollLockRef.current
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.width = ''
      document.documentElement.style.touchAction = ''
      if (scrollY) window.scrollTo(0, scrollY)
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.width = ''
      document.documentElement.style.touchAction = ''
      if (scrollLockRef.current) window.scrollTo(0, scrollLockRef.current)
    }
  }, [open])


  return (
    <header className="mkt-nav" role="banner">
      <div className="mkt-nav-inner">
        {/* Logo only - Left (no box, no text) */}
        <Link 
          to="/" 
          className="mkt-brand mkt-brand-logo-only" 
          aria-label="NB Aurum Solutions Home" 
          onClick={close}
        >
          <img className="mkt-brand-logo" src="/logo.png" alt="NB Aurum Solutions" />
        </Link>

        {/* Navigation Links - Center */}
        <nav className="mkt-nav-links" aria-label="Primary navigation">
          <NavLink to="/" className={navLinkClass} onClick={close}>
            {t('nav.home')}
          </NavLink>
          <NavLink to="/about" className={navLinkClass} onClick={close}>
            {t('nav.about')}
          </NavLink>
          <NavLink to="/services" className={navLinkClass} onClick={close}>
            {t('nav.services')}
          </NavLink>
          <NavLink to="/who-we-are" className={navLinkClass} onClick={close}>
            {t('nav.whoWeAre')}
          </NavLink>
          <NavLink to="/pricing" className={navLinkClass} onClick={close}>
            {t('nav.pricing')}
          </NavLink>
          <NavLink to="/faq" className={navLinkClass} onClick={close}>
            {t('nav.faq')}
          </NavLink>
          <NavLink to="/contact" className={navLinkClass} onClick={close}>
            {t('nav.contact')}
          </NavLink>
        </nav>

        {/* Action Buttons - Right (desktop) */}
        <div className="mkt-nav-actions">
          <Link to="/login" className="mkt-btn mkt-btn-ghost" onClick={close}>
            {t('nav.login')}
          </Link>
          <Link to="/register" className="mkt-btn mkt-btn-primary" onClick={close}>
            {t('nav.getStarted')}
          </Link>
        </div>

        {/* Mobile Get Started + Hamburger */}
        <div className="mkt-nav-mobile-right">
          <Link
            to="/register"
            className="mkt-nav-mobile-cta"
            onClick={close}
          >
            {t('nav.getStarted')}
          </Link>

          <button
            type="button"
            className={`mkt-nav-toggle ${open ? 'is-open' : ''}`}
            aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div 
        className={`mkt-nav-drawer ${open ? 'is-open' : ''}`}
        id="mobile-nav"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        aria-hidden={!open}
        onClick={(e) => {
          if (e.target.id === 'mobile-nav') setOpen(false)
        }}
        onTouchEnd={(e) => {
          if (e.target.id === 'mobile-nav') setOpen(false)
        }}
      >
        <nav 
          className="mkt-nav-drawer-inner" 
          aria-label="Mobile navigation"
          onClick={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <div className="mkt-nav-drawer-header-row">
            <h2 className="mkt-nav-drawer-menu-title">{t('nav.menu')}</h2>
            <button
              type="button"
              className="mkt-nav-drawer-close"
              onClick={close}
              aria-label="Close menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="mkt-nav-drawer-links">
            <NavLink to="/" className={navLinkClass} onClick={close}>
              {t('nav.home')}
            </NavLink>
            <NavLink to="/about" className={navLinkClass} onClick={close}>
              {t('nav.about')}
            </NavLink>
            <NavLink to="/services" className={navLinkClass} onClick={close}>
              {t('nav.services')}
            </NavLink>
            <NavLink to="/who-we-are" className={navLinkClass} onClick={close}>
              {t('nav.whoWeAre')}
            </NavLink>
            <NavLink to="/pricing" className={navLinkClass} onClick={close}>
              {t('nav.pricing')}
            </NavLink>
            <NavLink to="/faq" className={navLinkClass} onClick={close}>
              {t('nav.faq')}
            </NavLink>
            <NavLink to="/contact" className={navLinkClass} onClick={close}>
              {t('nav.contact')}
            </NavLink>
          </div>
          <div className="mkt-nav-drawer-actions">
            <Link to="/login" className="mkt-btn mkt-btn-ghost" onClick={close}>
              {t('nav.login')}
            </Link>
            <Link to="/register" className="mkt-btn mkt-btn-primary" onClick={close}>
              {t('nav.getStarted')}
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}
