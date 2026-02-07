import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  BarChart3,
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileText,
  Sparkles,
  Bookmark,
  Bell,
  User,
  Mail,
  Settings,
  LogOut,
  Shield,
} from 'lucide-react'
import { performLogout } from '../../utils/logout'

const overviewSection = {
  title: 'OVERVIEW',
  items: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
  ],
}

const adminSection = {
  title: 'ADMIN',
  items: [
    { to: '/admin-dashboard', label: 'Admin Dashboard', icon: Shield },
  ],
}

const sections = [
  overviewSection,
  {
    title: 'MANAGE',
    items: [
      { to: '/meetings', label: 'Minutes of Meeting', icon: CalendarDays },
      { to: '/collection', label: 'Collection Plan', icon: ClipboardList },
      { to: '/finance', label: 'Finance', icon: CreditCard },
      { to: '/payments', label: 'Payment Entry', icon: CreditCard },
      { to: '/invoices', label: 'Invoices', icon: FileText },
      { to: '/po-entry', label: 'PO Entry', icon: Sparkles },
      { to: '/master-data', label: 'Master Data', icon: Bookmark },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { to: '/subscription', label: 'Subscription', icon: Bell },
      { to: '/profile', label: 'My Profile', icon: User },
      { to: '/support', label: 'Contact & Support', icon: Mail },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
]

function NavItem({ collapsed, to, icon: Icon, label }) {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
      title={collapsed ? label : undefined}
    >
      <span className="sidebar-nav-icon">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="sidebar-nav-label">{label}</span>
    </NavLink>
  )
}

export default function Sidebar({ collapsed, mobileOpen, onCloseMobile }) {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const check = () => {
      try {
        const stored = localStorage.getItem('user')
        const parsed = stored ? JSON.parse(stored) : null
        const role = (parsed?.role || '').toLowerCase()
        setIsAdmin(role === 'admin')
      } catch {
        setIsAdmin(false)
      }
    }
    check()
    window.addEventListener('storage', check)
    return () => window.removeEventListener('storage', check)
  }, [])

  const navSections = [overviewSection, ...(isAdmin ? [adminSection] : []), ...sections.slice(1)]

  const onLogout = () => {
    performLogout()
  }

  return (
    <div className="app-sidebar-content">
      {/* Navigation - Brand section removed, starts directly with nav */}
      <nav className="sidebar-nav">
        {navSections.map((section) => (
          <div key={section.title} className="sidebar-section">
            <div className="sidebar-section-title">{section.title}</div>
            <div className="sidebar-nav-items">
              {section.items.map((item) => (
                <NavItem key={item.to} collapsed={collapsed} {...item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <button
          type="button"
          onClick={onLogout}
          className="sidebar-logout-button"
          aria-label="Logout"
        >
          <LogOut className="h-5 w-5" aria-hidden="true" />
          <span>Logout</span>
        </button>

        {/* Mobile close button */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="mt-2 w-full rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 md:hidden"
        >
          Close
        </button>
      </div>
    </div>
  )
}
