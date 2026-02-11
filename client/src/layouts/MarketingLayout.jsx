import { Outlet } from 'react-router-dom'
import { MarketingLanguageProvider } from '../contexts/MarketingLanguageContext'
import MarketingTopBar from '../components/marketing/MarketingTopBar'
import MarketingNavbar from '../components/marketing/MarketingNavbar'
import MarketingFooter from '../components/marketing/MarketingFooter'
import MarketingFloatingButtons from '../components/marketing/MarketingFloatingButtons'
import '../styles/Marketing.css'

export default function MarketingLayout() {
  return (
    <MarketingLanguageProvider>
      <div className="mkt-page">
        <a href="#mkt-main-content" className="mkt-skip-link">
          Skip to main content
        </a>
        <MarketingTopBar />
        <MarketingNavbar />
        <main id="mkt-main-content" className="mkt-main" role="main">
          <Outlet />
        </main>
        <MarketingFooter />
        <MarketingFloatingButtons />
      </div>
    </MarketingLanguageProvider>
  )
}


