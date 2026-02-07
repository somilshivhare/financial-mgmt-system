import { useState } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '../api/auth'
import '../styles/Auth.css'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [devToken, setDevToken] = useState('')
  const [error, setError] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setDevToken('')
    setLoading(true)
    try {
      const res = await requestPasswordReset(email)
      setMessage(res.message || 'If the email exists, a reset link has been generated.')
      if (import.meta.env.DEV && res.data?.token) setDevToken(res.data.token)
    } catch (err) {
      setError('Unable to process request. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-form-panel">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-card-header">
              <div>
                <h2 className="auth-card-title">Forgot Password</h2>
                <p className="auth-card-subtitle">Enter your email to receive a password reset link.</p>
              </div>
            </div>

            {message && (
              <div className="auth-success-message" role="status">
                <span>{message}</span>
              </div>
            )}

            {error && (
              <div className="auth-error-message" role="alert">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={onSubmit} className="auth-form" noValidate>
              <div className="auth-form-group">
                <label htmlFor="email" className="auth-label">
                  Email Address <span className="auth-required">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input"
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                />
              </div>

              <button type="submit" className="auth-button auth-button-primary" disabled={loading || !email}>
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>

            {import.meta.env.DEV && devToken && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Dev token (development only):</div>
                <div style={{ fontFamily: 'monospace', wordBreak: 'break-all', fontSize: 12 }}>{devToken}</div>
                <div style={{ marginTop: 8 }}>
                  <Link to={`/reset-password?token=${encodeURIComponent(devToken)}`} className="auth-link">
                    Reset password now
                  </Link>
                </div>
              </div>
            )}

            <div className="auth-footer">
              <p className="auth-footer-text">
                <Link to="/login" className="auth-footer-link">
                  Back to login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


