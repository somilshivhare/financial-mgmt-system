import { Outlet } from 'react-router-dom'
import MarketingNavbar from '../components/marketing/MarketingNavbar'
import MarketingFooter from '../components/marketing/MarketingFooter'
import '../styles/Marketing.css'

export default function MarketingLayout() {
  return (
    <div className="mkt-page">
      <a href="#mkt-main-content" className="mkt-skip-link">
        Skip to main content
      </a>
      <MarketingNavbar />
      <main id="mkt-main-content" className="mkt-main" role="main">
        <Outlet />
      </main>
      <MarketingFooter />
    </div>
  )
}


