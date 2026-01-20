import { Outlet } from 'react-router-dom'
import MarketingNavbar from '../components/marketing/MarketingNavbar'
import MarketingFooter from '../components/marketing/MarketingFooter'
import '../styles/Marketing.css'

export default function MarketingLayout() {
  return (
    <div className="mkt-page">
      <MarketingNavbar />
      <main className="mkt-main">
        <Outlet />
      </main>
      <MarketingFooter />
    </div>
  )
}


