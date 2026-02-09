import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { X } from 'lucide-react'

const navLinkClass = ({ isActive }) => `mkt-nav-link ${isActive ? 'is-active' : ''}`

export default function MarketingNavbar() {
  const [open, setOpen] = useState(false)
  const [servicesOpen, setServicesOpen] = useState(false)
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false)
  const location = useLocation()
  const servicesRef = useRef(null)

  const close = () => setOpen(false)

  useEffect(() => {
    setOpen(false)
    setMobileServicesOpen(false)
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
    const handleClickOutside = (e) => {
      if (open && window.innerWidth <= 980) {
        const drawer = document.getElementById('mobile-nav')
        const toggle = document.querySelector('.mkt-nav-toggle')
        if (drawer && !drawer.contains(e.target) && toggle && !toggle.contains(e.target)) {
          setOpen(false)
        }
      }
    }

    if (open) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [open])

  useEffect(() => {
    if (open && window.innerWidth <= 980) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (servicesRef.current && !servicesRef.current.contains(e.target)) {
        setServicesOpen(false)
      }
    }
    if (servicesOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [servicesOpen])

  return (
    <header className="mkt-nav" role="banner">
      <div className="mkt-nav-inner">
        {/* Logo - Left */}
        <Link 
          to="/" 
          className="mkt-brand" 
          aria-label="NB Aurum Solutions Home" 
          onClick={close}
        >
          <span className="mkt-brand-mark" aria-hidden="true">
            <img className="mkt-brand-logo" src="/logo.png" alt="" />
          </span>
          <span className="mkt-brand-name">NB Aurum Solutions</span>
        </Link>

        {/* Navigation Links - Center */}
        <nav className="mkt-nav-links" aria-label="Primary navigation">
          <NavLink to="/" className={navLinkClass} onClick={close}>
            Home
          </NavLink>
          <NavLink to="/about" className={navLinkClass} onClick={close}>
            About
          </NavLink>
          <div className="mkt-nav-dropdown" ref={servicesRef}>
            <button
              className={`mkt-nav-link mkt-nav-dropdown-toggle ${servicesOpen ? 'is-open' : ''}`}
              onClick={() => setServicesOpen(!servicesOpen)}
              aria-expanded={servicesOpen}
              aria-haspopup="true"
            >
              Services
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '6px', transition: 'transform 0.2s' }}>
                <path d="M3 4.5l3 3 3-3" />
              </svg>
            </button>
            {servicesOpen && (
              <div className="mkt-nav-dropdown-menu">
                <Link to="/services/strategic-liaison-documentation" className="mkt-nav-dropdown-item" onClick={() => { close(); setServicesOpen(false); }}>
                  Strategic Liaison & Documentation
                </Link>
                <Link to="/services/aggressive-payment-realization" className="mkt-nav-dropdown-item" onClick={() => { close(); setServicesOpen(false); }}>
                  Aggressive Payment Realization
                </Link>
                <Link to="/services/dispute-claim-management" className="mkt-nav-dropdown-item" onClick={() => { close(); setServicesOpen(false); }}>
                  Dispute & Claim Management
                </Link>
                <Link to="/services/mis-reporting-compliance" className="mkt-nav-dropdown-item" onClick={() => { close(); setServicesOpen(false); }}>
                  MIS, Reporting & Compliance
                </Link>
                <Link to="/services/ai-integrated-saas-platform" className="mkt-nav-dropdown-item" onClick={() => { close(); setServicesOpen(false); }}>
                  AI Integrated SaaS Platform
                </Link>
              </div>
            )}
          </div>
          <NavLink to="/who-we-are" className={navLinkClass} onClick={close}>
            Who we are
          </NavLink>
          <NavLink to="/pricing" className={navLinkClass} onClick={close}>
            Pricing
          </NavLink>
          <NavLink to="/contact" className={navLinkClass} onClick={close}>
            Contact
          </NavLink>
        </nav>

        {/* Action Buttons - Right */}
        <div className="mkt-nav-actions">
          <Link to="/login" className="mkt-btn mkt-btn-ghost" onClick={close}>
            Login
          </Link>
          <Link to="/register" className="mkt-btn mkt-btn-primary" onClick={close}>
            Get started
          </Link>
        </div>

        {/* Hamburger Toggle - Mobile Only */}
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

      {/* Mobile Drawer */}
      <div 
        className={`mkt-nav-drawer ${open ? 'is-open' : ''}`}
        id="mobile-nav"
        aria-hidden={!open}
        onClick={(e) => {
          if (e.target.id === 'mobile-nav') {
            setOpen(false)
          }
        }}
      >
        <nav 
          className="mkt-nav-drawer-inner" 
          aria-label="Mobile navigation"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mkt-nav-drawer-links" style={{ paddingTop: 20 }}>
            <h2 style={{ margin: 0, marginBottom: 16, padding: '0 20px', fontSize: '1.25rem', fontWeight: 700, color: 'var(--mkt-text)' }}>Menu</h2>
            <NavLink to="/" className={navLinkClass} onClick={close}>
              Home
            </NavLink>
            <NavLink to="/about" className={navLinkClass} onClick={close}>
              About
            </NavLink>
            <div className="mkt-nav-drawer-dropdown">
              <button
                type="button"
                className={`mkt-nav-drawer-dropdown-toggle ${mobileServicesOpen ? 'is-open' : ''}`}
                onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
                aria-expanded={mobileServicesOpen}
              >
                <span>Services</span>
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 16 16" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="mkt-nav-drawer-dropdown-icon"
                >
                  <path d="M6 4l4 4-4 4" />
                </svg>
              </button>
              {mobileServicesOpen && (
                <div className="mkt-nav-drawer-dropdown-menu">
                  <Link to="/services/strategic-liaison-documentation" className="mkt-nav-drawer-link" onClick={() => { close(); setMobileServicesOpen(false); }}>
                    Strategic Liaison & Documentation
                  </Link>
                  <Link to="/services/aggressive-payment-realization" className="mkt-nav-drawer-link" onClick={() => { close(); setMobileServicesOpen(false); }}>
                    Aggressive Payment Realization
                  </Link>
                  <Link to="/services/dispute-claim-management" className="mkt-nav-drawer-link" onClick={() => { close(); setMobileServicesOpen(false); }}>
                    Dispute & Claim Management
                  </Link>
                  <Link to="/services/mis-reporting-compliance" className="mkt-nav-drawer-link" onClick={() => { close(); setMobileServicesOpen(false); }}>
                    MIS, Reporting & Compliance
                  </Link>
                  <Link to="/services/ai-integrated-saas-platform" className="mkt-nav-drawer-link" onClick={() => { close(); setMobileServicesOpen(false); }}>
                    AI Integrated SaaS Platform
                  </Link>
                </div>
              )}
            </div>
            <NavLink to="/who-we-are" className={navLinkClass} onClick={close}>
              Who we are
            </NavLink>
            <NavLink to="/pricing" className={navLinkClass} onClick={close}>
              Pricing
            </NavLink>
            <NavLink to="/contact" className={navLinkClass} onClick={close}>
              Contact
            </NavLink>
          </div>
          <div className="mkt-nav-drawer-actions">
            <Link to="/login" className="mkt-btn mkt-btn-ghost" onClick={close}>
              Login
            </Link>
            <Link to="/register" className="mkt-btn mkt-btn-primary" onClick={close}>
              Get started
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}
