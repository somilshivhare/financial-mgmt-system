import { useState, useEffect, useCallback, useRef } from 'react'
import { io } from 'socket.io-client'
import * as alertsApi from '../api/alerts'
import { getApiBaseUrl } from '../config/api'

/**
 * Custom hook for managing alerts with real-time WebSocket support
 */
export function useAlerts() {
  const [alerts, setAlerts] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [connectionError, setConnectionError] = useState(null)
  const socketRef = useRef(null)
  const pollingIntervalRef = useRef(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5
  const reconnectTimeoutRef = useRef(null)

  // Load unread count
  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await alertsApi.getUnreadCount()
      if (response?.data?.count !== undefined) {
        setUnreadCount(response.data.count)
      }
    } catch (error) {
      console.error('[Alerts] Failed to load unread count:', error)
    }
  }, [])

  // Initialize WebSocket connection
  const connectWebSocket = useCallback(() => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    
    if (!token || !user) {
      console.warn('[Alerts] No token or user found, skipping WebSocket connection')
      setConnectionError('Not authenticated')
      return
    }

    // Prevent multiple connections
    if (socketRef.current?.connected) {
      console.log('[Alerts] WebSocket already connected')
      return
    }

    // Don't reconnect if max attempts reached
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.warn('[Alerts] Max reconnection attempts reached, using polling fallback')
      setConnectionError('Max reconnection attempts reached')
      return
    }

    try {
      const userData = JSON.parse(user)
      const userId = userData.id

      // Connect to WebSocket server
      // WebSocket needs the base URL without /api/v1 path
      const baseUrl = getApiBaseUrl()
      
      console.log(`[Alerts] Connecting to WebSocket at ${baseUrl}`)
      
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
        console.log('[Alerts] WebSocket connected:', socket.id)
        setConnected(true)
        setConnectionError(null)
        reconnectAttemptsRef.current = 0 // Reset on successful connection
        
        // Load unread count on connection
        loadUnreadCount()
      })

      socket.on('authenticated', (data) => {
        console.log('[Alerts] WebSocket authenticated:', data)
        setConnected(true)
        setConnectionError(null)
      })

      socket.on('disconnect', (reason) => {
        console.log('[Alerts] WebSocket disconnected:', reason)
        setConnected(false)
        
        // Only set error for unexpected disconnects
        if (reason === 'io server disconnect') {
          setConnectionError('Server disconnected')
        } else if (reason === 'io client disconnect') {
          // Client-initiated disconnect, no error
          setConnectionError(null)
        }
      })

      socket.on('connect_error', (error) => {
        console.error('[Alerts] WebSocket connection error:', error.message)
        setConnected(false)
        reconnectAttemptsRef.current++
        
        if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setConnectionError(`Connection failed after ${maxReconnectAttempts} attempts. Using polling fallback.`)
          console.warn('[Alerts] Switching to polling fallback')
        } else {
          setConnectionError(`Connection error: ${error.message}`)
        }
      })

      socket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`[Alerts] Reconnection attempt ${attemptNumber}/${maxReconnectAttempts}`)
        reconnectAttemptsRef.current = attemptNumber
      })

      socket.on('reconnect_failed', () => {
        console.error('[Alerts] WebSocket reconnection failed')
        setConnectionError('Reconnection failed. Using polling fallback.')
      })

      // Listen for new alerts
      socket.on('notification', (notification) => {
        if (notification.type === 'alert') {
          console.log('[Alerts] New alert received:', notification)
          
          // Update unread count
          setUnreadCount(prev => prev + 1)
          
          // Add to alerts list if needed
          if (notification.id) {
            setAlerts(prev => [notification, ...prev].slice(0, 50))
          }
        }
      })

      // Heartbeat
      socket.on('pong', (data) => {
        // Connection is alive
        if (data?.timestamp) {
          const latency = Date.now() - data.timestamp
          if (latency > 1000) {
            console.warn(`[Alerts] High WebSocket latency: ${latency}ms`)
          }
        }
      })

      socketRef.current = socket
    } catch (error) {
      console.error('[Alerts] Failed to initialize WebSocket:', error)
      setConnected(false)
      setConnectionError(`Initialization error: ${error.message}`)
    }
  }, [loadUnreadCount])

  // Fallback polling mechanism
  const startPolling = useCallback(() => {
    // Poll every 30 seconds as fallback
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }
    
    pollingIntervalRef.current = setInterval(async () => {
      if (!connected) {
        // Only poll if WebSocket is not connected
        console.log('[Alerts] Polling for unread count (WebSocket disconnected)')
        await loadUnreadCount()
      }
    }, 30000) // 30 seconds
  }, [connected, loadUnreadCount])

  // Mark alert as read
  const markAsRead = useCallback(async (id) => {
    try {
      await alertsApi.markAlertAsRead(id)
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('[Alerts] Failed to mark alert as read:', error)
    }
  }, [])

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await alertsApi.markAllAlertsAsRead()
      setUnreadCount(0)
    } catch (error) {
      console.error('[Alerts] Failed to mark all as read:', error)
    }
  }, [])

  // Initialize on mount - with error handling and retry limits
  useEffect(() => {
    // Check authentication first
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    
    let mounted = true
    let retryCount = 0
    const maxRetries = 2
    
    const initialize = async () => {
      if (!mounted) return
      
      try {
        setLoading(true)
        await loadUnreadCount()
        
        if (mounted) {
          setLoading(false)
          
          // Connect WebSocket (non-blocking)
          try {
            connectWebSocket()
          } catch (err) {
            console.error('[Alerts] Failed to connect WebSocket (non-critical):', err)
          }
          
          // Start fallback polling (non-blocking)
          try {
            startPolling()
          } catch (err) {
            console.error('[Alerts] Failed to start polling (non-critical):', err)
          }
        }
      } catch (err) {
        console.error('[Alerts] Initialization error (non-critical):', err)
        if (mounted) {
          setLoading(false)
          // Retry once if it failed
          if (retryCount < maxRetries) {
            retryCount++
            setTimeout(() => {
              if (mounted) initialize()
            }, 2000)
          }
        }
      }
    }

    initialize()

    // Cleanup on unmount
    return () => {
      mounted = false
      if (socketRef.current) {
        console.log('[Alerts] Cleaning up WebSocket connection')
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
  }, []) // Empty deps - only run on mount to prevent loops

  // Manual reconnect (with delay to prevent spam)
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
    alerts,
    unreadCount,
    loading,
    connected,
    connectionError,
    markAsRead,
    markAllAsRead,
    refreshUnreadCount: loadUnreadCount,
    reconnect,
  }
}
