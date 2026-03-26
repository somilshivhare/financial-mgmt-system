import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
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
import { performLogout } from '../../utils/logout'
import * as invoiceService from '../../services/invoiceService'
import * as poEntryService from '../../services/poEntryService'
import * as paymentService from '../../services/paymentService'
import * as masterDataService from '../../services/masterDataService'

export default function Navbar({ onToggleSidebar, collapsed }) {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchIndex, setSearchIndex] = useState({
    invoices: [],
    poEntries: [],
    payments: [],
    masterData: [],
    loaded: false,
    loading: false,
  })
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [userData, setUserData] = useState(null)
  const quickActionsRef = useRef(null)
  const notificationsRef = useRef(null)
  const userMenuRef = useRef(null)
  const searchRef = useRef(null)

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          const parsed = JSON.parse(storedUser)
          setUserData(parsed)
        }

        if (storedUser) {
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
              localStorage.setItem('user', JSON.stringify(userInfo))
            }
          } catch (apiError) {
            console.warn('Failed to fetch user from API, using localStorage:', apiError)
          }
        }
      } catch (error) {
        console.error('Failed to load user data:', error)
      }
    }
    loadUserData()
    const handleStorageChange = () => loadUserData()
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const {
    notifications = [],
    unreadCount: notificationUnreadCount = 0,
    markAsRead = () => {},
    markAllAsRead = () => {},
    dismissNotification = () => {},
  } = useNotifications() || {}

  const unreadCount = notificationUnreadCount || 0

  const normalizeMasterDataRecords = (masterDataPayload) => {
    const sections = ['companies', 'customers', 'consignees', 'payers', 'employees', 'paymentTerms']
    return sections.flatMap((section) => {
      const items = masterDataPayload?.[section]
      if (!Array.isArray(items)) return []
      return items.map((record) => {
        const values = record?.values || {}
        const fallbackName = values.companyName || values.customerName || values.nameOfEmployee || values.payerName || values.consigneeName || values.termName || record?.title || 'Master Data'
        return {
          id: record?.id,
          type: record?.type,
          title: record?.title || 'Master Data',
          name: String(fallbackName || 'Master Data'),
          subtitle: values.emailId || values.email || values.contactNo || values.phoneNumber || '',
        }
      })
    })
  }

  const loadSearchIndex = useCallback(async () => {
    try {
      setSearchIndex((prev) => ({ ...prev, loading: true }))
      const [invoices, poEntries, payments, masterData] = await Promise.all([
        invoiceService.getAllInvoices().catch(() => []),
        poEntryService.getAllPOEntries().catch(() => []),
        paymentService.getAllPayments().catch(() => []),
        masterDataService.getAllMasterData().catch(() => ({})),
      ])

      setSearchIndex({
        invoices: Array.isArray(invoices) ? invoices : [],
        poEntries: Array.isArray(poEntries) ? poEntries : [],
        payments: Array.isArray(payments) ? payments : [],
        masterData: normalizeMasterDataRecords(masterData),
        loaded: true,
        loading: false,
      })
    } catch (error) {
      console.error('Failed to build global search index:', error)
      setSearchIndex((prev) => ({ ...prev, loaded: true, loading: false }))
    }
  }, [])

  const searchSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const suggestions = []

    if (!q) {
      return [
        { id: 'shortcut-invoices', kind: 'shortcut', label: 'Go to Invoices', description: 'Open invoice list', path: '/invoices' },
        { id: 'shortcut-po', kind: 'shortcut', label: 'Go to PO Entries', description: 'Open purchase orders', path: '/po-entry' },
        { id: 'shortcut-payments', kind: 'shortcut', label: 'Go to Payments', description: 'Open payment list', path: '/payments' },
        { id: 'shortcut-master', kind: 'shortcut', label: 'Go to Master Data', description: 'Open master data records', path: '/master-data' },
      ]
    }

    searchIndex.invoices.forEach((invoice) => {
      const invoiceNo = String(invoice.invoice_number || invoice.invoiceID || invoice.internal_invoice_no || '').trim()
      const customer = String(invoice.customer_name || invoice.customerName || '').trim()
      const poNo = String(invoice.po_number || invoice.poNumber || '').trim()
      const haystack = `${invoiceNo} ${customer} ${poNo}`.toLowerCase()
      if (haystack.includes(q) && invoice?.id != null) {
        suggestions.push({
          id: `inv-${invoice.id}`,
          kind: 'invoice',
          label: invoiceNo || `Invoice #${invoice.id}`,
          description: customer ? `Customer: ${customer}` : 'Invoice record',
          path: `/invoices/view/${invoice.id}`,
        })
      }
    })

    searchIndex.poEntries.forEach((po) => {
      const poNo = String(po.po_number || po.poNumber || '').trim()
      const customer = String(po.customer_name || po.customerName || '').trim()
      const project = String(po.project_description || po.projectDescription || '').trim()
      const haystack = `${poNo} ${customer} ${project}`.toLowerCase()
      if (haystack.includes(q) && po?.id != null) {
        suggestions.push({
          id: `po-${po.id}`,
          kind: 'po',
          label: poNo || `PO #${po.id}`,
          description: customer ? `Customer: ${customer}` : (project || 'PO record'),
          path: `/po-entry/view/${po.id}`,
        })
      }
    })

    searchIndex.payments.forEach((payment) => {
      const paymentId = String(payment.paymentID || payment.payment_id || payment.id || '').trim()
      const customer = String(payment.customerName || payment.customer_name || '').trim()
      const invoiceNo = String(payment.invoiceID || payment.invoice_number || '').trim()
      const haystack = `${paymentId} ${customer} ${invoiceNo}`.toLowerCase()
      if (haystack.includes(q) && payment?.id != null) {
        suggestions.push({
          id: `pay-${payment.id}`,
          kind: 'payment',
          label: paymentId || `Payment #${payment.id}`,
          description: customer ? `Customer: ${customer}` : (invoiceNo ? `Invoice: ${invoiceNo}` : 'Payment record'),
          path: `/payments/view/${payment.id}`,
        })
      }
    })

    searchIndex.masterData.forEach((record) => {
      const name = String(record.name || '').trim()
      const title = String(record.title || 'Master Data').trim()
      const subtitle = String(record.subtitle || '').trim()
      const haystack = `${name} ${title} ${subtitle}`.toLowerCase()
      if (haystack.includes(q) && record?.id && record?.type) {
        suggestions.push({
          id: `md-${record.type}-${record.id}`,
          kind: 'master-data',
          label: name || 'Master Data Record',
          description: title,
          path: `/master-data/new/${record.type}/${record.id}`,
        })
      }
    })

    return suggestions.slice(0, 10)
  }, [searchQuery, searchIndex])

  const runSuggestion = (suggestion) => {
    if (!suggestion?.path) return
    navigate(suggestion.path)
    setSearchQuery('')
    setShowSearchSuggestions(false)
    setActiveSuggestionIndex(-1)
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchSuggestions(false)
        setActiveSuggestionIndex(-1)
      }
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
    performLogout()
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    if (searchSuggestions.length > 0) {
      runSuggestion(searchSuggestions[Math.max(0, activeSuggestionIndex)])
    }
  }

  const quickActions = [
    { label: 'Create Invoice', icon: FileText, action: () => navigate('/invoices/new') },
    { label: 'Add Customer', icon: Users, action: () => navigate('/master-data/new/customer-profile') },
    { label: 'Add Master Data', icon: Bookmark, action: () => navigate('/master-data/new') },
  ]

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
            alt="NB Aurum Solutions – Your Dues. Our Duty." 
            className="navbar-logo"
            onClick={() => navigate('/dashboard')}
            style={{ cursor: 'pointer' }}
          />
        </div>
      </div>

      {/* Global Search */}
      <div className="navbar-search-wrapper" ref={searchRef}>
        <form onSubmit={handleSearch} className="navbar-search-form">
          <Search className="navbar-search-icon" />
          <input
            type="text"
            className="navbar-search-input"
            placeholder="Search invoices, customers, master data..."
            value={searchQuery}
            onFocus={async () => {
              setShowSearchSuggestions(true)
              if (!searchIndex.loaded && !searchIndex.loading) {
                await loadSearchIndex()
              }
            }}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setShowSearchSuggestions(true)
              setActiveSuggestionIndex(-1)
            }}
            onKeyDown={(e) => {
              if (!showSearchSuggestions || searchSuggestions.length === 0) return
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActiveSuggestionIndex((prev) => (prev + 1) % searchSuggestions.length)
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActiveSuggestionIndex((prev) => (prev <= 0 ? searchSuggestions.length - 1 : prev - 1))
              } else if (e.key === 'Enter') {
                if (activeSuggestionIndex >= 0) {
                  e.preventDefault()
                  runSuggestion(searchSuggestions[activeSuggestionIndex])
                }
              } else if (e.key === 'Escape') {
                setShowSearchSuggestions(false)
                setActiveSuggestionIndex(-1)
              }
            }}
          />
          {searchQuery && (
            <button
              type="button"
              className="navbar-search-clear"
              onClick={() => {
                setSearchQuery('')
                setShowSearchSuggestions(true)
                setActiveSuggestionIndex(-1)
              }}
              aria-label="Clear search"
            >
              <X className="navbar-search-clear-icon" />
            </button>
          )}
        </form>
        {showSearchSuggestions && (
          <div className="navbar-search-suggestions" role="listbox" aria-label="Search suggestions">
            {searchIndex.loading && (
              <div className="navbar-search-suggestion-empty">Loading search data...</div>
            )}
            {!searchIndex.loading && searchSuggestions.length === 0 && (
              <div className="navbar-search-suggestion-empty">No matching results found.</div>
            )}
            {!searchIndex.loading && searchSuggestions.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={`navbar-search-suggestion-item ${index === activeSuggestionIndex ? 'is-active' : ''}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => runSuggestion(item)}
              >
                <span className="navbar-search-suggestion-label">{item.label}</span>
                <span className="navbar-search-suggestion-desc">{item.description}</span>
              </button>
            ))}
          </div>
        )}
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
                    navigate('/notifications')
                    setShowNotifications(false)
                  }}
                >
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
