import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { resetPassword } from '../api/auth'
import '../styles/Auth.css'

function useQuery() {
  const { search } = useLocation()
  return useMemo(() => new URLSearchParams(search), [search])
}

export default function ResetPassword() {
  const navigate = useNavigate()
  const q = useQuery()
  const token = q.get('token') || ''

  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      const res = await resetPassword(token, newPassword)
      setMessage(res.message || 'Password reset successful.')
      setTimeout(() => navigate('/login'), 800)
    } catch (err) {
      setError('Invalid or expired reset token.')
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
                <h2 className="auth-card-title">Reset Password</h2>
                <p className="auth-card-subtitle">Choose a new password for your account.</p>
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
                <label htmlFor="newPassword" className="auth-label">
                  New Password <span className="auth-required">*</span>
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="auth-input"
                  placeholder="Enter new password"
                  required
                  disabled={loading}
                />
              </div>

              <button type="submit" className="auth-button auth-button-primary" disabled={loading || !token || newPassword.length < 8}>
                {loading ? 'Resetting…' : 'Reset password'}
              </button>
            </form>

            <div className="auth-footer">
              <p className="auth-footer-text">
                <Link to="/login" className="auth-footer-link">
                  Back to login
                </Link>
              </p>
            </div>
          </div>

          {!token && (
            <div style={{ marginTop: 12, fontSize: 12, opacity: 0.8 }}>
              Missing token. Please open the reset link from your email.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


