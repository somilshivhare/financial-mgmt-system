import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Users, History, RefreshCw } from 'lucide-react'
import { getAdminUsers, getAdminLoginHistory } from '../api/admin'
import '../styles/AdminDashboard.css'

function formatDateTime(val) {
  if (!val) return '—'
  try {
    const d = new Date(val)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return '—'
  }
}

function formatDate(val) {
  if (!val) return '—'
  try {
    const d = new Date(val)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('en-IN')
  } catch {
    return '—'
  }
}

function formatStorage(bytes) {
  if (bytes == null || Number(bytes) === 0) return '0 B'
  const n = Number(bytes)
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(2)} KB`
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} MB`
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [users, setUsers] = useState([])
  const [logins, setLogins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user')
      const parsed = stored ? JSON.parse(stored) : null
      setUser(parsed)
      const role = (parsed?.role || '').toLowerCase()
      if (role !== 'admin') {
        navigate('/dashboard', { replace: true })
        return
      }
    } catch {
      navigate('/login', { replace: true })
    }
  }, [navigate])

  const loadData = async () => {
    if ((user?.role || '').toLowerCase() !== 'admin') return
    setError(null)
    setLoading(true)
    try {
      const [usersRes, loginsRes] = await Promise.all([
        getAdminUsers(),
        getAdminLoginHistory(50),
      ])
      const usersData = usersRes?.data?.data
      const loginsData = loginsRes?.data?.data
      setUsers(Array.isArray(usersData) ? usersData : [])
      setLogins(Array.isArray(loginsData) ? loginsData : [])
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load admin data')
      setUsers([])
      setLogins([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if ((user?.role || '').toLowerCase() === 'admin') {
      loadData()
    }
  }, [user?.role])

  if (!user) return null
  if ((user?.role || '').toLowerCase() !== 'admin') return null

  return (
    <div className="admin-dashboard-page">
      <div className="admin-dashboard-header">
        <div className="admin-dashboard-header-content">
          <h1 className="admin-dashboard-title">
            <Shield className="admin-dashboard-title-icon" aria-hidden />
            Admin Dashboard
          </h1>
          <p className="admin-dashboard-subtitle">
            User accounts and login activity (admin only)
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="admin-dashboard-refresh"
          title="Refresh"
        >
          <RefreshCw size={18} className={loading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="admin-dashboard-error" role="alert">
          {error}
        </div>
      )}

      <div className="admin-dashboard-sections">
        <section className="admin-dashboard-section">
          <h2 className="admin-dashboard-section-title">
            <Users size={20} aria-hidden />
            All users
          </h2>
          <div className="admin-dashboard-table-wrap">
            {loading && users.length === 0 ? (
              <p className="admin-dashboard-loading">Loading users...</p>
            ) : users.length === 0 ? (
              <p className="admin-dashboard-empty">No users found.</p>
            ) : (
              <table className="admin-dashboard-table" role="grid">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Storage used</th>
                    <th>Last login</th>
                    <th>Last login IP</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.full_name || '—'}</td>
                      <td>{u.email || '—'}</td>
                      <td><span className={`admin-dashboard-role admin-dashboard-role--${(u.role_name || '').toLowerCase()}`}>{u.role_name || '—'}</span></td>
                      <td><span className={`admin-dashboard-status admin-dashboard-status--${(u.status || '').toLowerCase()}`}>{u.status || '—'}</span></td>
                      <td className="admin-dashboard-storage">{formatStorage(u.storage_bytes)}</td>
                      <td>{formatDateTime(u.last_login_at)}</td>
                      <td>{u.last_login_ip || '—'}</td>
                      <td>{formatDate(u.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="admin-dashboard-section">
          <h2 className="admin-dashboard-section-title">
            <History size={20} aria-hidden />
            Recent login activity
          </h2>
          <div className="admin-dashboard-table-wrap">
            {loading && logins.length === 0 ? (
              <p className="admin-dashboard-loading">Loading login history...</p>
            ) : logins.length === 0 ? (
              <p className="admin-dashboard-empty">No login history yet.</p>
            ) : (
              <table className="admin-dashboard-table" role="grid">
                <thead>
                  <tr>
                    <th>Date & time</th>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>IP</th>
                    <th>Status</th>
                    <th>Failure reason</th>
                  </tr>
                </thead>
                <tbody>
                  {logins.map((h) => (
                    <tr key={h.id}>
                      <td>{formatDateTime(h.login_at)}</td>
                      <td>{h.full_name || '—'}</td>
                      <td>{h.email || '—'}</td>
                      <td><span className={`admin-dashboard-role admin-dashboard-role--${(h.role_name || '').toLowerCase()}`}>{h.role_name || '—'}</span></td>
                      <td>{h.ip_address || '—'}</td>
                      <td><span className={`admin-dashboard-status admin-dashboard-status--${(h.login_status || '').toLowerCase()}`}>{h.login_status || '—'}</span></td>
                      <td>{h.failure_reason || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
