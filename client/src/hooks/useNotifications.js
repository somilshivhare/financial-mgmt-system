import { useState, useEffect, useCallback, useRef } from 'react'
import { io } from 'socket.io-client'
import * as notificationsApi from '../api/notifications'
import { getApiBaseUrl } from '../config/api'

export function useNotifications() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [connectionError, setConnectionError] = useState(null)
  const socketRef = useRef(null)
  const pollingIntervalRef = useRef(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5
  const reconnectTimeoutRef = useRef(null)

  const loadNotifications = useCallback(async () => {
    try {
      const response = await notificationsApi.getNotifications({ limit: 50 })
      const notifications = response?.data?.notifications || response?.data?.data?.notifications || []
      setNotifications(Array.isArray(notifications) ? notifications : [])
    } catch (error) {
      console.error('[Notifications] Failed to load notifications:', error)
      setNotifications([])
    }
  }, [])

  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await notificationsApi.getUnreadCount()
      const count = response?.data?.count ?? response?.data?.data?.count ?? 0
      setUnreadCount(typeof count === 'number' ? count : 0)
    } catch (error) {
      console.error('[Notifications] Failed to load unread count:', error)
      setUnreadCount(0)
    }
  }, [])

  const connectWebSocket = useCallback(() => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    
    if (!token || !user) {
      console.warn('[Notifications] No token or user found, skipping WebSocket connection')
      setConnectionError('Not authenticated')
      return
    }

    if (socketRef.current?.connected) {
      console.log('[Notifications] WebSocket already connected')
      return
    }

    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.warn('[Notifications] Max reconnection attempts reached, using polling fallback')
      setConnectionError('Max reconnection attempts reached')
      return
    }

    try {
      const userData = JSON.parse(user)
      const userId = userData.id

      const baseUrl = getApiBaseUrl()
      
      console.log(`[Notifications] Connecting to WebSocket at ${baseUrl}`)
      
      const socket = io(baseUrl, {
        auth: {
          token: token, // Pass token in auth object
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: maxReconnectAttempts,
        timeout: 20000,
      })

      socket.on('connect', () => {
        console.log('[Notifications] WebSocket connected:', socket.id)
        setConnected(true)
        setConnectionError(null)
        reconnectAttemptsRef.current = 0 // Reset on successful connection
        
        loadNotifications()
        loadUnreadCount()
      })

      socket.on('authenticated', (data) => {
        console.log('[Notifications] WebSocket authenticated:', data)
        setConnected(true)
        setConnectionError(null)
      })

      socket.on('disconnect', (reason) => {
        console.log('[Notifications] WebSocket disconnected:', reason)
        setConnected(false)
        
        if (reason === 'io server disconnect') {
          setConnectionError('Server disconnected')
        } else if (reason === 'io client disconnect') {
          setConnectionError(null)
        }
      })

      socket.on('connect_error', (error) => {
        console.error('[Notifications] WebSocket connection error:', error.message)
        setConnected(false)
        reconnectAttemptsRef.current++
        
        if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setConnectionError(`Connection failed after ${maxReconnectAttempts} attempts. Using polling fallback.`)
          console.warn('[Notifications] Switching to polling fallback')
        } else {
          setConnectionError(`Connection error: ${error.message}`)
        }
      })

      socket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`[Notifications] Reconnection attempt ${attemptNumber}/${maxReconnectAttempts}`)
        reconnectAttemptsRef.current = attemptNumber
      })

      socket.on('reconnect_failed', () => {
        console.error('[Notifications] WebSocket reconnection failed')
        setConnectionError('Reconnection failed. Using polling fallback.')
      })

      socket.on('notification', (notification) => {
        console.log('[Notifications] New notification received:', notification)
        
        setNotifications(prev => {
          const exists = prev.find(n => n.id === notification.id)
          if (exists) return prev
          
          return [notification, ...prev].slice(0, 50)
        })
        
        setUnreadCount(prev => prev + 1)
      })

      socket.on('pong', (data) => {
        if (data?.timestamp) {
          const latency = Date.now() - data.timestamp
          if (latency > 1000) {
            console.warn(`[Notifications] High WebSocket latency: ${latency}ms`)
          }
        }
      })

      socketRef.current = socket
    } catch (error) {
      console.error('[Notifications] Failed to initialize WebSocket:', error)
      setConnected(false)
      setConnectionError(`Initialization error: ${error.message}`)
    }
  }, [loadNotifications, loadUnreadCount])

  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }
    
    pollingIntervalRef.current = setInterval(async () => {
      if (!connected) {
        console.log('[Notifications] Polling for updates (WebSocket disconnected)')
        await Promise.all([loadNotifications(), loadUnreadCount()])
      }
    }, 30000) // 30 seconds
  }, [connected, loadNotifications, loadUnreadCount])

  const markAsRead = useCallback(async (id) => {
    try {
      await notificationsApi.markAsRead(id)
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, status: 'read', read_at: new Date().toISOString() } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('[Notifications] Failed to mark notification as read:', error)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsApi.markAllAsRead()
      setNotifications(prev =>
        prev.map(n => ({ ...n, status: 'read', read_at: new Date().toISOString() }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error('[Notifications] Failed to mark all as read:', error)
    }
  }, [])

  const dismissNotification = useCallback(async (id) => {
    try {
      await notificationsApi.dismissNotification(id)
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch (error) {
      console.error('[Notifications] Failed to dismiss notification:', error)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    
    let mounted = true
    
    const initialize = async () => {
      try {
        if (mounted) {
          setNotifications([])
          setUnreadCount(0)
          setLoading(false)
        }

      } catch (err) {
        console.error('[Notifications] Initialization error (non-critical):', err)
        if (mounted) {
          setNotifications([])
          setUnreadCount(0)
          setLoading(false)
        }
      }
    }

    initialize()
    
    return () => {
      mounted = false
      if (socketRef.current) {
        console.log('[Notifications] Cleaning up WebSocket connection')
        socketRef.current.disconnect()
        socketRef.current = null
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, []) // Empty dependency array - notifications disabled

  const reconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttemptsRef.current = 0 // Reset attempts
      setConnectionError(null)
      connectWebSocket()
    }, 2000) // Wait 2 seconds before reconnecting
  }, [connectWebSocket])

  return {
    notifications,
    unreadCount,
    loading,
    connected,
    connectionError,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    refresh: loadNotifications,
    refreshUnreadCount: loadUnreadCount,
    reconnect,
  }
}
