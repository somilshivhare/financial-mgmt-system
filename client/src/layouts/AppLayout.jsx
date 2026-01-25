import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Sidebar from '../components/layout/Sidebar'
import AIAssistant from '../components/AIAssistant'
import '../styles/Layout.css'

const SIDEBAR_EXPANDED = 260
const SIDEBAR_COLLAPSED = 80
const NAVBAR_HEIGHT = 56

function getStoredCollapsed() {
  try {
    return localStorage.getItem('sidebarCollapsed') === 'true'
  } catch {
    return false
  }
}

export default function AppLayout() {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(getStoredCollapsed)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    // Close mobile sidebar on navigation
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    try {
      localStorage.setItem('sidebarCollapsed', String(collapsed))
    } catch {
      // ignore
    }
  }, [collapsed])

  useEffect(() => {
    const mq = window.matchMedia?.('(max-width: 1023px)')
    if (!mq) return
    const handler = (e) => {
      if (!e.matches) setMobileOpen(false)
    }
    mq.addEventListener?.('change', handler)
    return () => mq.removeEventListener?.('change', handler)
  }, [])

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED

  const onToggleSidebar = () => {
    if (window.matchMedia?.('(max-width: 1023px)')?.matches) {
      setMobileOpen((v) => !v)
      return
    }
    setCollapsed((v) => !v)
  }

  return (
    <div
      className={`app-layout ${collapsed ? 'sidebar-collapsed' : ''}`}
    >
      {/* Navbar */}
      <header className="app-navbar">
        <Navbar onToggleSidebar={onToggleSidebar} collapsed={collapsed} />
      </header>

      {/* Sidebar */}
      <aside className={`app-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />
      </aside>

      {/* Main Content */}
      <main className="app-main">
        <div className="app-main-content">
          <Outlet />
        </div>
      </main>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="mobile-overlay active"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* AI Assistant */}
      <AIAssistant />
    </div>
  )
}
