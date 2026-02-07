import { Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'

export default function ProtectedRoute({ children }) {
  const location = useLocation()
  const [isAuthenticated, setIsAuthenticated] = useState(null) // null = checking, true/false = determined
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
        console.error('[ProtectedRoute] Error checking authentication:', error)
        setIsAuthenticated(false)
        setIsChecking(false)
      }
    }

    checkAuth()
  }, [])

  if (isChecking) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
