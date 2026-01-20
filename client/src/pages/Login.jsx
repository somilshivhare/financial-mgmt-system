import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Lock, AlertCircle, FileText, TrendingUp, Shield } from 'lucide-react'
import { login } from '../api/auth'
import '../styles/Auth.css'

function Login({ onLogin }) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

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
    setError('')
    
    if (!validateForm()) {
      return
    }

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
      
      navigate('/dashboard')
    } catch (err) {
      // Generic error message for security
      setError('Invalid email or password. Please try again.')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

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
      <div className="auth-brand-panel">
        <div className="auth-brand-panel-content">
          <div className="auth-brand-panel-logo-container">
            <img 
              src="/logo.png" 
              alt="Nbaurum" 
              className="auth-brand-panel-logo"
            />
          </div>
          <h1 className="auth-brand-panel-name">Nbaurum</h1>
          <p className="auth-brand-panel-tagline">Your Dues. Our Duty.</p>
          <div className="auth-brand-panel-divider"></div>
          
          <div className="auth-brand-panel-features">
            <div className="auth-brand-panel-feature">
              <FileText className="auth-brand-panel-feature-icon" />
              <div className="auth-brand-panel-feature-content">
                <h3 className="auth-brand-panel-feature-title">Comprehensive Invoicing</h3>
                <p className="auth-brand-panel-feature-description">
                  Streamline your invoicing process with automated workflows, multi-stage due management, and real-time tracking.
                </p>
              </div>
            </div>
            
            <div className="auth-brand-panel-feature">
              <TrendingUp className="auth-brand-panel-feature-icon" />
              <div className="auth-brand-panel-feature-content">
                <h3 className="auth-brand-panel-feature-title">Smart Collections</h3>
                <p className="auth-brand-panel-feature-description">
                  Monitor receivables, track payments, and optimize cash flow with intelligent collection planning and analytics.
                </p>
              </div>
            </div>
            
            <div className="auth-brand-panel-feature">
              <Shield className="auth-brand-panel-feature-icon" />
              <div className="auth-brand-panel-feature-content">
                <h3 className="auth-brand-panel-feature-title">Enterprise Security</h3>
                <p className="auth-brand-panel-feature-description">
                  Bank-grade security with centralized master data management and compliance-ready reporting.
                </p>
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
                alt="Nbaurum" 
                className="auth-mobile-brand-header-logo"
              />
            </div>
            <h1 className="auth-mobile-brand-header-name">Nbaurum</h1>
            <p className="auth-mobile-brand-header-tagline">Your Dues. Our Duty.</p>
          </div>

          {/* Login Card */}
          <div className="auth-card">
          <div className="auth-card-header">
            <div>
              <h2 className="auth-card-title">Sign In</h2>
              <p className="auth-card-subtitle">Access your ERP dashboard</p>
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
              © {new Date().getFullYear()} Nbaurum. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
    </div>
    
  )
}

export default Login
