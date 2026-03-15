import { Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'

export default function NotFoundRoute() {
  const location = useLocation()
  const [isAuthenticated, setIsAuthenticated] = useState(null)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem('user')
        const authenticated = !!storedUser
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

  return <Navigate to={isAuthenticated ? '/dashboard' : '/'} replace />
}
