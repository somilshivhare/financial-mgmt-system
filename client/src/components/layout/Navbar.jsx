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
  Check,
  CheckCheck,
} from 'lucide-react'
import { me } from '../../api/auth'
import { useNotifications } from '../../hooks/useNotifications'
import { useAlerts } from '../../hooks/useAlerts'

export default function Navbar({ onToggleSidebar, collapsed }) {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [userData, setUserData] = useState(null)
  const quickActionsRef = useRef(null)
  const notificationsRef = useRef(null)
  const userMenuRef = useRef(null)

  // Load user data from localStorage and API
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // First, try to get from localStorage (fast)
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          const parsed = JSON.parse(storedUser)
          setUserData(parsed)
        }

        // Then, fetch fresh data from API if token exists
        const token = localStorage.getItem('token')
        if (token) {
          try {
            const response = await me()
            if (response?.data?.data) {
              const apiUserData = response.data.data
              const userInfo = {
                fullName: apiUserData.full_name || apiUserData.fullName,
                email: apiUserData.email,
                role: apiUserData.role,
                id: apiUserData.id,
              }
              setUserData(userInfo)
              // Update localStorage with fresh data
              localStorage.setItem('user', JSON.stringify(userInfo))
            }
          } catch (apiError) {
            // If API call fails, use localStorage data
            console.warn('Failed to fetch user from API, using localStorage:', apiError)
          }
        }
      } catch (error) {
        console.error('Failed to load user data:', error)
      }
    }
    loadUserData()
    // Listen for storage changes (e.g., when user logs in from another tab)
    const handleStorageChange = () => loadUserData()
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Use real notifications hook - hooks handle errors internally
  const {
    notifications = [],
    unreadCount: notificationUnreadCount = 0,
    markAsRead = () => {},
    markAllAsRead = () => {},
    dismissNotification = () => {},
  } = useNotifications() || {}

  // Use alerts hook for badge count - hooks handle errors internally
  const {
    unreadCount: alertsUnreadCount = 0,
    refreshUnreadCount: refreshAlertsCount = () => {},
  } = useAlerts() || {}

  // Combined unread count (alerts + notifications) - safe defaults
  const unreadCount = (alertsUnreadCount || 0) + (notificationUnreadCount || 0)

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

  // Format notification time
  const formatNotificationTime = (dateString) => {
    if (!dateString) return 'Just now'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`
    return date.toLocaleDateString()
  }

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
            alt="NB Aurum – Your Dues. Our Duty." 
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
            {unreadCount > 0 && (
              <span className="navbar-notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </button>
          {showNotifications && (
            <div className="navbar-dropdown navbar-dropdown-notifications">
              <div className="navbar-dropdown-header">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="navbar-mark-all-read"
                    title="Mark all as read"
                  >
                    <CheckCheck size={16} />
                  </button>
                )}
              </div>
              <div className="navbar-dropdown-items">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`navbar-notification-item ${notification.status === 'new' ? 'navbar-notification-unread' : ''}`}
                      onClick={() => {
                        if (notification.status === 'new') {
                          markAsRead(notification.id)
                        }
                        if (notification.link_url) {
                          navigate(notification.link_url)
                          setShowNotifications(false)
                        }
                      }}
                    >
                      <div className="navbar-notification-content">
                        <div className="navbar-notification-title">{notification.message}</div>
                        <div className="navbar-notification-time">
                          {formatNotificationTime(notification.created_at)}
                        </div>
                      </div>
                      {notification.status === 'new' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsRead(notification.id)
                          }}
                          className="navbar-notification-mark-read"
                          title="Mark as read"
                        >
                          <Check size={16} />
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="navbar-notification-empty">
                    <p>No notifications</p>
                  </div>
                )}
              </div>
              <div className="navbar-dropdown-footer">
                <button
                  type="button"
                  className="navbar-dropdown-footer-link"
                  onClick={() => {
                    navigate('/alerts')
                    setShowNotifications(false)
                  }}
                >
                  View all alerts
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
              <div className="navbar-user-name">
                {userData?.fullName || userData?.name || 'User'}
              </div>
              <div className="navbar-user-email">
                {userData?.email || 'user@example.com'}
              </div>
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
