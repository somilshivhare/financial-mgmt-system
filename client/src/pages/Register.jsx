import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle2, FileText, TrendingUp, Shield } from 'lucide-react'
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
    role: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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
    setError('')
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const response = await register(
        formData.email,
        formData.password,
        formData.fullName,
        {
          companyName: formData.companyName,
          mobileNumber: formData.mobileNumber,
          role: formData.role,
        }
      )
      
      const userData = response.data?.user || {
        email: formData.email,
        name: formData.fullName,
        companyName: formData.companyName,
      }
      
      onRegister(userData)
      navigate('/dashboard')
    } catch (err) {
      // Generic error message for security
      setError('Registration failed. Please check your information and try again.')
      console.error('Registration error:', err)
    } finally {
      setLoading(false)
    }
  }

  const passwordValidation = formData.password ? validatePassword(formData.password) : null

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

          {/* Registration Card */}
          <div className="auth-card">
          <div className="auth-card-header">
            <div>
              <h2 className="auth-card-title">Create Account</h2>
              <p className="auth-card-subtitle">Start managing your receivables</p>
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

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
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
              <label htmlFor="mobileNumber" className="auth-label">
                Mobile Number <span className="auth-required">*</span>
              </label>
              <input
                id="mobileNumber"
                name="mobileNumber"
                type="tel"
                value={formData.mobileNumber}
                onChange={handleChange}
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
                <div id="password-requirements" className="auth-password-requirements">
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

            <div className="auth-form-group">
              <label htmlFor="role" className="auth-label">
                Role (Optional)
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="auth-input auth-select"
                disabled={loading}
              >
                <option value="">Select a role</option>
                <option value="admin">Administrator</option>
                <option value="manager">Manager</option>
                <option value="user">User</option>
                <option value="accountant">Accountant</option>
              </select>
            </div>

            <button
              type="submit"
              className="auth-button auth-button-primary"
              disabled={loading}
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
              © {new Date().getFullYear()} Nbaurum. All rights reserved.
            </p>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
