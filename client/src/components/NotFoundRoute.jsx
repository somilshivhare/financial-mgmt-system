import { Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'

/**
 * NotFoundRoute Component
 * 
 * Handles 404 cases - redirects authenticated users to dashboard,
 * unauthenticated users to home, but only for truly invalid routes.
 */
export default function NotFoundRoute() {
  const location = useLocation()
  const [isAuthenticated, setIsAuthenticated] = useState(null)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem('user')
        const storedToken = localStorage.getItem('token')
        const authenticated = !!(storedUser && storedToken)
        setIsAuthenticated(authenticated)
        setIsChecking(false)
      } catch (error) {
        console.error('[NotFoundRoute] Error checking authentication:', error)
        setIsAuthenticated(false)
        setIsChecking(false)
      }
    }

    checkAuth()
  }, [])

  if (isChecking) {
    return null
  }

  // Redirect authenticated users to dashboard, unauthenticated to home
  return <Navigate to={isAuthenticated ? '/dashboard' : '/'} replace />
}
