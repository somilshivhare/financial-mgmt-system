import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle2, LayoutDashboard, BarChart3, LineChart, Shield } from 'lucide-react'
import { register } from '../api/auth'
import '../styles/Auth.css'

function Register({ onRegister }) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    companyName: '',
    fullName: '',
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isPasswordFocused, setIsPasswordFocused] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const submitTimeoutRef = useRef(null)
  const isSubmittingRef = useRef(false)
  const submitButtonClickedRef = useRef(false)

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.type !== 'submit' && e.target.tagName !== 'BUTTON') {
      e.preventDefault()
      e.stopPropagation()
      const submitButton = e.target.form?.querySelector('button[type="submit"]')
      if (submitButton && !loading) {
        submitButton.focus()
      }
    }
  }

  const handleSubmitButtonClick = (e) => {
    submitButtonClickedRef.current = true
    setTimeout(() => {
      submitButtonClickedRef.current = false
    }, 1000)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }))
    }
    if (error) setError('')
  }

  const validatePassword = (password) => {
    const minLength = password.length >= 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      hasSpecialChar,
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar,
    }
  }

  const validateForm = () => {
    const errors = {}
    
    if (!formData.companyName.trim()) {
      errors.companyName = 'Company name is required'
    }
    
    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required'
    }
    
    if (!formData.email) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    if (!formData.mobileNumber) {
      errors.mobileNumber = 'Mobile number is required'
    } else if (!/^[0-9]{10}$/.test(formData.mobileNumber.replace(/[\s-]/g, ''))) {
      errors.mobileNumber = 'Please enter a valid 10-digit mobile number'
    }
    
    if (!formData.password) {
      errors.password = 'Password is required'
    } else {
      const passwordValidation = validatePassword(formData.password)
      if (!passwordValidation.isValid) {
        errors.password = 'Password does not meet requirements'
      }
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
    
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!submitButtonClickedRef.current) {
      return
    }
    
    if (isSubmittingRef.current || loading) {
      return
    }
    
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current)
    }
    
    setError('')
    
    if (!validateForm()) {
      return
    }

    isSubmittingRef.current = true
    setLoading(true)

    try {
      const response = await register(
        formData.email,
        formData.password,
        formData.fullName,
        {
          companyName: formData.companyName,
          mobileNumber: formData.mobileNumber,
        }
      )
      
      const userData = response.data?.user || {
        email: formData.email,
        name: formData.fullName,
        companyName: formData.companyName,
      }
      
      if (rememberMe) {
        localStorage.setItem('rememberRegistration', JSON.stringify({
          email: formData.email,
          companyName: formData.companyName,
          fullName: formData.fullName,
        }))
      } else {
        localStorage.removeItem('rememberRegistration')
      }
      
      onRegister(userData)
      navigate('/dashboard')
    } catch (err) {
      let errorMessage = 'Registration failed. Please check your information and try again.'
      
      if (err.response?.data) {
        const errorData = err.response.data
        if (errorData.code === 'RATE_LIMIT_EXCEEDED') {
          errorMessage = errorData.message || 'Too many registration attempts. Please wait a moment and try again.'
        } else if (errorData.code === 'ERR_DUPLICATE_EMAIL') {
          errorMessage = 'An account with this email already exists. Please use a different email or sign in.'
        } else if (errorData.code === 'ERR_MISSING_FIELDS') {
          errorMessage = errorData.message || 'Please fill in all required fields.'
        } else if (errorData.code === 'ERR_WEAK_PASSWORD') {
          errorMessage = errorData.message || 'Password does not meet security requirements.'
        } else if (errorData.message) {
          errorMessage = errorData.message
        }
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
      console.error('[Register] Error:', err)
    } finally {
      submitTimeoutRef.current = setTimeout(() => {
        isSubmittingRef.current = false
        setLoading(false)
      }, 500)
    }
  }
  
  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const rememberedData = localStorage.getItem('rememberRegistration')
    if (rememberedData) {
      try {
        const data = JSON.parse(rememberedData)
        setFormData((prev) => ({
          ...prev,
          email: data.email || '',
          companyName: data.companyName || '',
          fullName: data.fullName || '',
        }))
        setRememberMe(true)
      } catch (err) {
        console.error('[Register] Error loading remembered data:', err)
        localStorage.removeItem('rememberRegistration')
      }
    }
  }, [])

  const passwordValidation = formData.password ? validatePassword(formData.password) : null

  return (
    <div className="auth-page auth-page--register">
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

          {/* Registration Card */}
          <div className="auth-card">
          <div className="auth-card-header">
            <div>
              <h2 className="auth-card-title">Create Account</h2>
              <p className="auth-card-subtitle">Set up your workspace in minutes</p>
            </div>
            <div className="auth-security-indicator">
              <Lock className="auth-security-icon" />
              <span className="auth-security-text">Secure registration</span>
            </div>
          </div>

          {error && (
            <div className="auth-error-message" role="alert">
              <AlertCircle className="auth-error-icon" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="auth-form auth-form--register" noValidate>
            <div className="auth-form-grid" role="group" aria-label="Registration details">
              {/* Left column: Company, Full Name, Mobile (Desktop) */}
              {/* Mobile order: Company, Full Name, Email, Mobile, Password, Confirm Password */}
              <div className="auth-form-col">
                {/* 1. Company Name */}
                <div className="auth-form-group">
                  <label htmlFor="companyName" className="auth-label">
                    Company / Organization Name <span className="auth-required">*</span>
                  </label>
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    value={formData.companyName}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    className={`auth-input ${fieldErrors.companyName ? 'auth-input-error' : ''}`}
                    placeholder="Enter company name"
                    required
                    disabled={loading}
                    aria-invalid={fieldErrors.companyName ? 'true' : 'false'}
                    aria-describedby={fieldErrors.companyName ? 'companyName-error' : undefined}
                  />
                  {fieldErrors.companyName && (
                    <span id="companyName-error" className="auth-field-error" role="alert">
                      {fieldErrors.companyName}
                    </span>
                  )}
                </div>

                {/* 2. Full Name */}
                <div className="auth-form-group">
                  <label htmlFor="fullName" className="auth-label">
                    Full Name <span className="auth-required">*</span>
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    className={`auth-input ${fieldErrors.fullName ? 'auth-input-error' : ''}`}
                    placeholder="Enter your full name"
                    required
                    disabled={loading}
                    aria-invalid={fieldErrors.fullName ? 'true' : 'false'}
                    aria-describedby={fieldErrors.fullName ? 'fullName-error' : undefined}
                  />
                  {fieldErrors.fullName && (
                    <span id="fullName-error" className="auth-field-error" role="alert">
                      {fieldErrors.fullName}
                    </span>
                  )}
                </div>

                {/* 3. Mobile Number */}
                <div className="auth-form-group">
                  <label htmlFor="mobileNumber" className="auth-label">
                    Mobile Number <span className="auth-required">*</span>
                  </label>
                  <input
                    id="mobileNumber"
                    name="mobileNumber"
                    type="tel"
                    value={formData.mobileNumber}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    className={`auth-input ${fieldErrors.mobileNumber ? 'auth-input-error' : ''}`}
                    placeholder="Enter 10-digit mobile number"
                    maxLength="10"
                    required
                    disabled={loading}
                    aria-invalid={fieldErrors.mobileNumber ? 'true' : 'false'}
                    aria-describedby={fieldErrors.mobileNumber ? 'mobileNumber-error' : undefined}
                  />
                  {fieldErrors.mobileNumber && (
                    <span id="mobileNumber-error" className="auth-field-error" role="alert">
                      {fieldErrors.mobileNumber}
                    </span>
                  )}
                </div>
              </div>

              {/* Right column: Email, Password, Confirm Password (Desktop) */}
              <div className="auth-form-col">
                {/* 4. Email Address */}
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
                    onKeyDown={handleKeyDown}
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
                {/* 5. Password */}
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
                      onKeyDown={handleKeyDown}
                      onFocus={() => setIsPasswordFocused(true)}
                      onBlur={() => setIsPasswordFocused(false)}
                      className={`auth-input auth-input-password ${fieldErrors.password ? 'auth-input-error' : ''}`}
                      placeholder="Create a strong password"
                      autoComplete="new-password"
                      required
                      disabled={loading}
                      aria-invalid={fieldErrors.password ? 'true' : 'false'}
                      aria-describedby={fieldErrors.password ? 'password-error' : 'password-requirements'}
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
                  {passwordValidation && (
                    <div
                      id="password-requirements"
                      className={`auth-password-requirements auth-password-requirements--collapsible ${
                        isPasswordFocused ? 'is-open' : ''
                      }`}
                      aria-hidden={isPasswordFocused ? 'false' : 'true'}
                    >
                      <div className={`auth-password-requirement ${passwordValidation.minLength ? 'auth-password-requirement-valid' : ''}`}>
                        {passwordValidation.minLength ? <CheckCircle2 className="auth-password-check-icon" /> : <span className="auth-password-check-dot" />}
                        <span>At least 8 characters</span>
                      </div>
                      <div className={`auth-password-requirement ${passwordValidation.hasUpperCase ? 'auth-password-requirement-valid' : ''}`}>
                        {passwordValidation.hasUpperCase ? <CheckCircle2 className="auth-password-check-icon" /> : <span className="auth-password-check-dot" />}
                        <span>One uppercase letter</span>
                      </div>
                      <div className={`auth-password-requirement ${passwordValidation.hasLowerCase ? 'auth-password-requirement-valid' : ''}`}>
                        {passwordValidation.hasLowerCase ? <CheckCircle2 className="auth-password-check-icon" /> : <span className="auth-password-check-dot" />}
                        <span>One lowercase letter</span>
                      </div>
                      <div className={`auth-password-requirement ${passwordValidation.hasNumber ? 'auth-password-requirement-valid' : ''}`}>
                        {passwordValidation.hasNumber ? <CheckCircle2 className="auth-password-check-icon" /> : <span className="auth-password-check-dot" />}
                        <span>One number</span>
                      </div>
                      <div className={`auth-password-requirement ${passwordValidation.hasSpecialChar ? 'auth-password-requirement-valid' : ''}`}>
                        {passwordValidation.hasSpecialChar ? <CheckCircle2 className="auth-password-check-icon" /> : <span className="auth-password-check-dot" />}
                        <span>One special character</span>
                      </div>
                    </div>
                  )}
                  {fieldErrors.password && (
                    <span id="password-error" className="auth-field-error" role="alert">
                      {fieldErrors.password}
                    </span>
                  )}
              </div>

                {/* 6. Confirm Password */}
                <div className="auth-form-group">
                  <label htmlFor="confirmPassword" className="auth-label">
                    Confirm Password <span className="auth-required">*</span>
                  </label>
                  <div className="auth-input-wrapper">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onKeyDown={handleKeyDown}
                      className={`auth-input auth-input-password ${fieldErrors.confirmPassword ? 'auth-input-error' : ''}`}
                      placeholder="Confirm your password"
                      autoComplete="new-password"
                      required
                      disabled={loading}
                      aria-invalid={fieldErrors.confirmPassword ? 'true' : 'false'}
                      aria-describedby={fieldErrors.confirmPassword ? 'confirmPassword-error' : undefined}
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      tabIndex={0}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="auth-password-toggle-icon" />
                      ) : (
                        <Eye className="auth-password-toggle-icon" />
                      )}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <span id="confirmPassword-error" className="auth-field-error" role="alert">
                      {fieldErrors.confirmPassword}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Remember me checkbox */}
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
            </div>

            <button
              type="submit"
              className="auth-button auth-button-primary"
              disabled={loading}
              onClick={handleSubmitButtonClick}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="auth-footer">
            <p className="auth-footer-text">
              Already have an account?{' '}
              <Link to="/login" className="auth-footer-link">
                Sign in
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

export default Register
