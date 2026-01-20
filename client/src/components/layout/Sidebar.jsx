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
  AlertCircle,
  Settings,
  LogOut,
} from 'lucide-react'

const sections = [
  {
    title: 'OVERVIEW',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/reports', label: 'Reports', icon: BarChart3 },
    ],
  },
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
      { to: '/contact', label: 'Contact', icon: Mail },
      { to: '/alerts', label: 'Alerts', icon: AlertCircle },
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
  const onLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    window.location.href = '/login'
  }

  return (
    <div className="app-sidebar-content">
      {/* Navigation - Brand section removed, starts directly with nav */}
      <nav className="sidebar-nav">
        {sections.map((section) => (
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
        <div className="sidebar-storage">
          <div className="sidebar-storage-header">
            <div className="sidebar-storage-label">STORAGE USED</div>
            <div className="sidebar-storage-percent">65%</div>
          </div>
          <div className="sidebar-storage-bar">
            <div className="sidebar-storage-fill" />
          </div>
          <div className="sidebar-storage-footer">
            <span className="sidebar-storage-used">6.5 GB</span>
            <span className="sidebar-storage-total">of 10 GB</span>
          </div>
        </div>

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
