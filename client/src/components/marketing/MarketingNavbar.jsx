import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'

const navLinkClass = ({ isActive }) => `mkt-nav-link ${isActive ? 'is-active' : ''}`

export default function MarketingNavbar() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  const close = () => setOpen(false)

  // Close drawer when route changes
  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  // Close drawer when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 980 && open) {
        setOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [open])

  // Close drawer when clicking outside (on backdrop)
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

  // Prevent body scroll when drawer is open (only on mobile)
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

  return (
    <header className="mkt-nav" role="banner">
      <div className="mkt-nav-inner">
        {/* Logo - Left */}
        <Link 
          to="/" 
          className="mkt-brand" 
          aria-label="Nbaurum Home" 
          onClick={close}
        >
          <span className="mkt-brand-mark" aria-hidden="true">
            <img className="mkt-brand-logo" src="/logo.png" alt="" />
          </span>
          <span className="mkt-brand-name">Nbaurum</span>
        </Link>

        {/* Navigation Links - Center */}
        <nav className="mkt-nav-links" aria-label="Primary navigation">
          <NavLink to="/" className={navLinkClass} onClick={close}>
            Home
          </NavLink>
          <NavLink to="/about" className={navLinkClass} onClick={close}>
            About
          </NavLink>
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
          // Close when clicking backdrop (outside drawer inner)
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
          <div className="mkt-nav-drawer-links">
            <NavLink to="/" className={navLinkClass} onClick={close}>
              Home
            </NavLink>
            <NavLink to="/about" className={navLinkClass} onClick={close}>
              About
            </NavLink>
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
