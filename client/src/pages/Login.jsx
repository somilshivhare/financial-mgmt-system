import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Eye, EyeOff, Lock, AlertCircle, LayoutDashboard, BarChart3, LineChart, Shield } from 'lucide-react'
import { login } from '../api/auth'
import '../styles/Auth.css'

function Login({ onLogin }) {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Get the intended destination from location state, or default to dashboard
  const from = location.state?.from?.pathname || '/dashboard'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const submitTimeoutRef = useRef(null)
  const isSubmittingRef = useRef(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }))
    }
    // Clear general error
    if (error) setError('')
  }

  const validateForm = () => {
    const errors = {}
    
    if (!formData.email) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    if (!formData.password) {
      errors.password = 'Password is required'
    }
    
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Prevent double submission
    if (isSubmittingRef.current || loading) {
      return
    }
    
    // Clear any existing timeout
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current)
    }
    
    setError('')
    
    if (!validateForm()) {
      return
    }

    // Set submitting flag and loading state
    isSubmittingRef.current = true
    setLoading(true)

    try {
      const response = await login(formData.email, formData.password)
      
      // Store user data
      const userData = response.data?.user || { email: formData.email, name: formData.email }
      onLogin(userData)
      
      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem('rememberEmail', formData.email)
      } else {
        localStorage.removeItem('rememberEmail')
      }
      
      // Redirect to intended destination or dashboard
      navigate(from, { replace: true })
    } catch (err) {
      // Handle structured error responses
      let errorMessage = 'Invalid email or password. Please try again.'
      
      if (err.response?.data) {
        const errorData = err.response.data
        if (errorData.code === 'RATE_LIMIT_EXCEEDED') {
          errorMessage = errorData.message || 'Too many login attempts. Please wait a moment and try again.'
        } else if (errorData.message) {
          errorMessage = errorData.message
        } else if (errorData.code === 'ERR_INVALID_CREDENTIALS') {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.'
        }
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
      console.error('[Login] Error:', err)
    } finally {
      // Add small delay before allowing resubmission to prevent rapid clicks
      submitTimeoutRef.current = setTimeout(() => {
        isSubmittingRef.current = false
        setLoading(false)
      }, 500)
    }
  }
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current)
      }
    }
  }, [])

  // Load remembered email on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberEmail')
    if (rememberedEmail) {
      setFormData((prev) => ({ ...prev, email: rememberedEmail }))
      setRememberMe(true)
    }
  }, [])

  return (
    <div className="auth-page">
      {/* Left Panel - Brand & Context (Desktop Only) */}
      {/* Back to Home Button */}
<button
  className="auth-back-button"
  onClick={() => navigate('/')}
  aria-label="Back to Home"
>
  <ArrowLeft className="auth-back-icon" />
</button>

      <div className="auth-brand-panel">
        <div className="auth-brand-panel-content">
          <div className="auth-brand-panel-logo-container">
            <img 
              src="/logo.png" 
              alt="NB Aurum Solutions" 
              className="auth-brand-panel-logo"
            />
          </div>
          <div className="auth-brand-copy">
            <h2 className="auth-brand-headline">
              Effortlessly manage invoices, collections, and operations.
            </h2>
            <p className="auth-brand-subcopy">
              NB Aurum Solutions centralizes your finance workflows into a single workspace, so teams can invoice, follow up, and reconcile with confidence.
            </p>
          </div>

          <div className="auth-brand-illustration" aria-hidden="true">
            <div className="auth-brand-illustration-shell">
              <div className="auth-brand-illustration-sidebar">
                <div className="auth-brand-illustration-logo-row">
                  <span className="auth-brand-illustration-logo-dot" />
                  <span className="auth-brand-illustration-logo-text">NB Aurum Solutions</span>
                </div>
                <div className="auth-brand-illustration-nav-item auth-brand-illustration-nav-item--active">
                  <LayoutDashboard className="auth-brand-illustration-nav-icon" />
                  <span>Overview</span>
                </div>
                <div className="auth-brand-illustration-nav-item">
                  <BarChart3 className="auth-brand-illustration-nav-icon" />
                  <span>Invoices</span>
                </div>
                <div className="auth-brand-illustration-nav-item">
                  <LineChart className="auth-brand-illustration-nav-icon" />
                  <span>Collections</span>
                </div>
                <div className="auth-brand-illustration-nav-item">
                  <Shield className="auth-brand-illustration-nav-icon" />
                  <span>Controls</span>
                </div>
              </div>

              <div className="auth-brand-illustration-main">
                <div className="auth-brand-illustration-kpi-row">
                  <div className="auth-brand-illustration-kpi-card">
                    <span className="auth-brand-illustration-kpi-label">Outstanding</span>
                    <span className="auth-brand-illustration-kpi-value">₹24.2L</span>
                    <div className="auth-brand-illustration-kpi-bar">
                      <span className="auth-brand-illustration-kpi-bar-fill" />
                    </div>
                  </div>
                  <div className="auth-brand-illustration-kpi-card">
                    <span className="auth-brand-illustration-kpi-label">Collected</span>
                    <span className="auth-brand-illustration-kpi-value">92%</span>
                    <div className="auth-brand-illustration-kpi-bar auth-brand-illustration-kpi-bar--soft">
                      <span className="auth-brand-illustration-kpi-bar-fill" />
                    </div>
                  </div>
                </div>

                <div className="auth-brand-illustration-chart" />

                <div className="auth-brand-illustration-table">
                  <div className="auth-brand-illustration-table-header">
                    <span>Customer</span>
                    <span>Due</span>
                    <span>Status</span>
                  </div>
                  <div className="auth-brand-illustration-table-row">
                    <span>Acme Corp.</span>
                    <span>₹4.8L</span>
                    <span className="auth-brand-illustration-pill auth-brand-illustration-pill--warning">Due soon</span>
                  </div>
                  <div className="auth-brand-illustration-table-row">
                    <span>Northwind</span>
                    <span>₹2.1L</span>
                    <span className="auth-brand-illustration-pill auth-brand-illustration-pill--success">Paid</span>
                  </div>
                  <div className="auth-brand-illustration-table-row">
                    <span>Globex</span>
                    <span>₹3.4L</span>
                    <span className="auth-brand-illustration-pill">Planned</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="auth-form-panel">
        <div className="auth-container">
          {/* Mobile Brand Header */}
          <div className="auth-mobile-brand-header">
            <div className="auth-mobile-brand-header-logo-container">
              <img 
                src="/logo.png" 
                alt="NB Aurum Solutions" 
                className="auth-mobile-brand-header-logo"
              />
            </div>
            <h1 className="auth-mobile-brand-header-name">NB Aurum Solutions</h1>
            <p className="auth-mobile-brand-header-tagline">Your Dues. Our Duty.</p>
          </div>

          {/* Login Card */}
          <div className="auth-card">
          <div className="auth-card-header">
            <div>
              <h2 className="auth-card-title">Welcome Back</h2>
              <p className="auth-card-subtitle">Sign in to continue to your NB Aurum Solutions workspace</p>
            </div>
            <div className="auth-security-indicator">
              <Lock className="auth-security-icon" />
              <span className="auth-security-text">Secure login</span>
            </div>
          </div>

          {error && (
            <div className="auth-error-message" role="alert">
              <AlertCircle className="auth-error-icon" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="auth-form-group">
              <label htmlFor="email" className="auth-label">
                Email Address <span className="auth-required">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`auth-input ${fieldErrors.email ? 'auth-input-error' : ''}`}
                placeholder="Enter your email"
                autoComplete="email"
                required
                disabled={loading}
                aria-invalid={fieldErrors.email ? 'true' : 'false'}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              />
              {fieldErrors.email && (
                <span id="email-error" className="auth-field-error" role="alert">
                  {fieldErrors.email}
                </span>
              )}
            </div>

            <div className="auth-form-group">
              <label htmlFor="password" className="auth-label">
                Password <span className="auth-required">*</span>
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  className={`auth-input auth-input-password ${fieldErrors.password ? 'auth-input-error' : ''}`}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  aria-invalid={fieldErrors.password ? 'true' : 'false'}
                  aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={0}
                >
                  {showPassword ? (
                    <EyeOff className="auth-password-toggle-icon" />
                  ) : (
                    <Eye className="auth-password-toggle-icon" />
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <span id="password-error" className="auth-field-error" role="alert">
                  {fieldErrors.password}
                </span>
              )}
            </div>

            <div className="auth-form-options">
              <label className="auth-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="auth-checkbox"
                  disabled={loading}
                />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="auth-link">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              className="auth-button auth-button-primary"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-footer">
            <p className="auth-footer-text">
              Don't have an account?{' '}
              <Link to="/register" className="auth-footer-link">
                Create an account
              </Link>
            </p>
          </div>
          
          {/* Footer */}
          <div className="auth-page-footer">
            <p className="auth-page-footer-text">
              © {new Date().getFullYear()} NB Aurum Solutions Pvt. Ltd. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
    </div>
    
  )
}

export default Login
