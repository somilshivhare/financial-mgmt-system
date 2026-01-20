import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Menu, 
  PanelLeftClose, 
  PanelLeftOpen, 
  UserCircle2,
  Search,
  Bell,
  Zap,
  FileText,
  Users,
  Bookmark,
  X,
  User,
  LogOut,
} from 'lucide-react'

export default function Navbar({ onToggleSidebar, collapsed }) {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const quickActionsRef = useRef(null)
  const notificationsRef = useRef(null)
  const userMenuRef = useRef(null)

  // Mock notification count
  const notificationCount = 3

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (quickActionsRef.current && !quickActionsRef.current.contains(event.target)) {
        setShowQuickActions(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    window.location.href = '/login'
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // TODO: Implement search functionality
      console.log('Searching for:', searchQuery)
      setSearchQuery('')
    }
  }

  const quickActions = [
    { label: 'Create Invoice', icon: FileText, action: () => navigate('/invoices/new') },
    { label: 'Add Customer', icon: Users, action: () => navigate('/master-data/new/customer-profile') },
    { label: 'Add Master Data', icon: Bookmark, action: () => navigate('/master-data/new') },
  ]

  return (
    <div className="app-navbar-content">
      <div className="app-navbar-left">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="navbar-button"
          aria-label="Toggle sidebar"
        >
          <span className="hidden lg:inline">
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </span>
          <span className="lg:hidden">
            <Menu />
          </span>
        </button>

        <div className="navbar-logo-group">
          <img 
            src="/logo.png" 
            alt="Nbaurum – Your Dues. Our Duty." 
            className="navbar-logo"
            onClick={() => navigate('/dashboard')}
            style={{ cursor: 'pointer' }}
          />
        </div>
      </div>

      {/* Global Search */}
      <div className="navbar-search-wrapper">
        <form onSubmit={handleSearch} className="navbar-search-form">
          <Search className="navbar-search-icon" />
          <input
            type="text"
            className="navbar-search-input"
            placeholder="Search invoices, customers, master data..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="navbar-search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              <X className="navbar-search-clear-icon" />
            </button>
          )}
        </form>
      </div>

      {/* Right Actions */}
      <div className="app-navbar-right">
        {/* Quick Actions */}
        <div className="navbar-dropdown-wrapper" ref={quickActionsRef}>
          <button
            type="button"
            className="navbar-button navbar-button-actions"
            onClick={() => setShowQuickActions(!showQuickActions)}
            aria-label="Quick actions"
            aria-expanded={showQuickActions}
          >
            <Zap />
          </button>
          {showQuickActions && (
            <div className="navbar-dropdown">
              <div className="navbar-dropdown-header">Quick Actions</div>
              <div className="navbar-dropdown-items">
                {quickActions.map((action, index) => {
                  const Icon = action.icon
                  return (
                    <button
                      key={index}
                      type="button"
                      className="navbar-dropdown-item"
                      onClick={() => {
                        action.action()
                        setShowQuickActions(false)
                      }}
                    >
                      <Icon className="navbar-dropdown-item-icon" />
                      <span>{action.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="navbar-dropdown-wrapper" ref={notificationsRef}>
          <button
            type="button"
            className="navbar-button navbar-button-notifications"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            aria-expanded={showNotifications}
          >
            <Bell />
            {notificationCount > 0 && (
              <span className="navbar-notification-badge">{notificationCount}</span>
            )}
          </button>
          {showNotifications && (
            <div className="navbar-dropdown navbar-dropdown-notifications">
              <div className="navbar-dropdown-header">Notifications</div>
              <div className="navbar-dropdown-items">
                <div className="navbar-notification-item">
                  <div className="navbar-notification-content">
                    <div className="navbar-notification-title">Invoice #1234 pending approval</div>
                    <div className="navbar-notification-time">2 hours ago</div>
                  </div>
                </div>
                <div className="navbar-notification-item">
                  <div className="navbar-notification-content">
                    <div className="navbar-notification-title">Payment due: Customer ABC</div>
                    <div className="navbar-notification-time">5 hours ago</div>
                  </div>
                </div>
                <div className="navbar-notification-item">
                  <div className="navbar-notification-content">
                    <div className="navbar-notification-title">Master data update required</div>
                    <div className="navbar-notification-time">1 day ago</div>
                  </div>
                </div>
              </div>
              <div className="navbar-dropdown-footer">
                <button type="button" className="navbar-dropdown-footer-link">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="navbar-dropdown-wrapper" ref={userMenuRef}>
          <button
            type="button"
            className="navbar-user-button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            aria-label="User menu"
            aria-expanded={showUserMenu}
          >
            <div className="navbar-user-info">
              <div className="navbar-user-name">User</div>
              <div className="navbar-user-email">user@example.com</div>
            </div>
            <UserCircle2 className="navbar-user-icon" />
          </button>
          {showUserMenu && (
            <div className="navbar-dropdown navbar-dropdown-user">
              <div className="navbar-dropdown-items">
                <button
                  type="button"
                  className="navbar-dropdown-item"
                  onClick={() => {
                    navigate('/profile')
                    setShowUserMenu(false)
                  }}
                >
                  <User className="navbar-dropdown-item-icon" />
                  <span>Profile</span>
                </button>
                <button
                  type="button"
                  className="navbar-dropdown-item navbar-dropdown-item-danger"
                  onClick={() => {
                    handleLogout()
                    setShowUserMenu(false)
                  }}
                >
                  <LogOut className="navbar-dropdown-item-icon" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
