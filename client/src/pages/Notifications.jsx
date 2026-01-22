import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Check, CheckCheck, X, Filter, Search } from 'lucide-react'
import { useNotifications } from '../hooks/useNotifications'
import * as notificationsApi from '../api/notifications'
import '../styles/Notifications.css'

export default function Notifications() {
  const navigate = useNavigate()
  const {
    notifications: initialNotifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    refresh,
  } = useNotifications()

  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, unread, read
  const [typeFilter, setTypeFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadAllNotifications()
  }, [])

  const loadAllNotifications = async () => {
    try {
      setLoading(true)
      const response = await notificationsApi.getNotifications({ limit: 100 })
      if (response?.data?.notifications) {
        setNotifications(response.data.notifications)
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'unread' && notif.status !== 'new') return false
    if (filter === 'read' && notif.status !== 'read') return false
    if (typeFilter && notif.type !== typeFilter) return false
    if (searchQuery && !notif.message.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const handleMarkAsRead = async (id) => {
    await markAsRead(id)
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, status: 'read', read_at: new Date().toISOString() } : n)
    )
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
    await loadAllNotifications()
  }

  const handleDismiss = async (id) => {
    await dismissNotification(id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const handleNotificationClick = (notification) => {
    if (notification.status === 'new') {
      handleMarkAsRead(notification.id)
    }
    if (notification.link_url) {
      navigate(notification.link_url)
    }
  }

  const formatTime = (dateString) => {
    if (!dateString) return 'Just now'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'var(--color-danger)'
      case 'high': return 'var(--color-warning)'
      case 'medium': return 'var(--color-primary)'
      case 'low': return 'var(--color-text-tertiary)'
      default: return 'var(--color-text-tertiary)'
    }
  }

  const notificationTypes = [
    { value: '', label: 'All Types' },
    { value: 'invoice_created', label: 'Invoice Created' },
    { value: 'invoice_approval_pending', label: 'Invoice Approval Pending' },
    { value: 'payment_due', label: 'Payment Due' },
    { value: 'payment_overdue', label: 'Payment Overdue' },
    { value: 'payment_received', label: 'Payment Received' },
    { value: 'master_data_changed', label: 'Master Data Changed' },
    { value: 'po_created', label: 'PO Created' },
    { value: 'po_approval_pending', label: 'PO Approval Pending' },
    { value: 'po_approved', label: 'PO Approved' },
    { value: 'collection_followup', label: 'Collection Follow-up' },
    { value: 'system_action', label: 'System Action' },
    { value: 'admin_announcement', label: 'Admin Announcement' },
  ]

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <div className="notifications-header-content">
          <h1 className="notifications-title">
            <Bell className="notifications-title-icon" />
            Notifications
          </h1>
          <p className="notifications-subtitle">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            className="notifications-mark-all-read-btn"
            onClick={handleMarkAllAsRead}
          >
            <CheckCheck size={18} />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="notifications-filters">
        <div className="notifications-filter-group">
          <Filter size={18} />
          <button
            type="button"
            className={`notifications-filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            type="button"
            className={`notifications-filter-btn ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            Unread ({notifications.filter(n => n.status === 'new').length})
          </button>
          <button
            type="button"
            className={`notifications-filter-btn ${filter === 'read' ? 'active' : ''}`}
            onClick={() => setFilter('read')}
          >
            Read
          </button>
        </div>

        <div className="notifications-search-group">
          <Search size={18} />
          <input
            type="text"
            className="notifications-search-input"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="notifications-type-filter"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          {notificationTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Notifications List */}
      <div className="notifications-content">
        {loading ? (
          <div className="notifications-loading">
            <p>Loading notifications...</p>
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="notifications-list">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`notifications-item ${notification.status === 'new' ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="notifications-item-content">
                  <div className="notifications-item-header">
                    <div className="notifications-item-message">{notification.message}</div>
                    {notification.priority && (
                      <span
                        className="notifications-item-priority"
                        style={{ color: getPriorityColor(notification.priority) }}
                      >
                        {notification.priority}
                      </span>
                    )}
                  </div>
                  <div className="notifications-item-meta">
                    <span className="notifications-item-type">{notification.type.replace(/_/g, ' ')}</span>
                    <span className="notifications-item-time">{formatTime(notification.created_at)}</span>
                  </div>
                </div>
                <div className="notifications-item-actions">
                  {notification.status === 'new' && (
                    <button
                      type="button"
                      className="notifications-action-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMarkAsRead(notification.id)
                      }}
                      title="Mark as read"
                    >
                      <Check size={18} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="notifications-action-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDismiss(notification.id)
                    }}
                    title="Dismiss"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="notifications-empty">
            <Bell size={48} />
            <p>No notifications found</p>
            {searchQuery || filter !== 'all' || typeFilter ? (
              <button
                type="button"
                className="notifications-clear-filters-btn"
                onClick={() => {
                  setSearchQuery('')
                  setFilter('all')
                  setTypeFilter('')
                }}
              >
                Clear filters
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}

