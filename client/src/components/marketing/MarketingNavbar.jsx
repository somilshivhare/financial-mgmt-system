import { Link, NavLink } from 'react-router-dom'

const navLinkClass = ({ isActive }) =>
  `mkt-nav-link ${isActive ? 'is-active' : ''}`

export default function MarketingNavbar() {
  return (
    <header className="mkt-nav">
      <div className="mkt-nav-inner">
        <Link to="/" className="mkt-brand" aria-label="Nbaurum home">
          <span className="mkt-brand-mark" aria-hidden="true">
            <img className="mkt-brand-logo" src="/logo.png" alt="" />
          </span>
        </Link>

        <nav className="mkt-nav-links" aria-label="Primary navigation">
          <NavLink to="/about" className={navLinkClass}>
            About
          </NavLink>
          <NavLink to="/who-we-are" className={navLinkClass}>
            Who we are
          </NavLink>
          <NavLink to="/pricing" className={navLinkClass}>
            Pricing
          </NavLink>
          <NavLink to="/contact" className={navLinkClass}>
            Contact
          </NavLink>
        </nav>

        <div className="mkt-nav-actions">
          <Link to="/login" className="mkt-btn mkt-btn-ghost">
            Login
          </Link>
          <Link to="/register" className="mkt-btn mkt-btn-primary">
            Start
          </Link>
        </div>
      </div>
    </header>
  )
}


