import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Bell,
  Building2,
  CheckCircle2,
  KeyRound,
  Lock,
  Settings as SettingsIcon,
  ShieldCheck,
  Users,
  FileText,
  Receipt,
  Clock,
} from 'lucide-react'
import * as settingsApi from '../api/settings'
import '../styles/Settings.css'

function safeParse(json) {
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

const DEFAULT_SETTINGS = {
  general: {
    companyName: 'NB Aurum',
    companyEmail: 'finance@nbaurum.com',
    companyPhone: '+91 00000 00000',
    financialYear: '2024-2025',
    currency: 'INR',
  },
  invoice: {
    numberingFormat: 'INV-{YYYY}-{SEQ}',
    taxDefaultPercent: 18,
    paymentTermDefault: 'Net 30',
  },
  notifications: {
    emailNotifications: true,
    systemAlerts: true,
  },
  security: {
    twoFactorEnabled: false,
    sessionTimeoutMinutes: 30,
  },
  access: {
    roles: [
      { name: 'Administrator', permissions: ['All access'] },
      { name: 'Manager', permissions: ['Invoices: Manage', 'Collections: Manage', 'Reports: View'] },
      { name: 'User', permissions: ['Invoices: View', 'Payments: View'] },
      { name: 'Accountant', permissions: ['Invoices: Manage', 'Payments: Manage'] },
    ],
  },
}

function Modal({ title, children, confirmText, confirmTone = 'primary', onCancel, onConfirm }) {
  return (
    <div className="settings-modal-overlay" onClick={onCancel} role="presentation">
      <div className="settings-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="settings-modal-header">
          <div className="settings-modal-title">{title}</div>
        </div>
        <div className="settings-modal-body">{children}</div>
        <div className="settings-modal-actions">
          <button type="button" className="settings-btn settings-btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className={`settings-btn ${confirmTone === 'danger' ? 'settings-btn-danger' : 'settings-btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Settings() {
  const [user, setUser] = useState({ email: 'user@example.com', role: 'User' })
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [draft, setDraft] = useState(DEFAULT_SETTINGS)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const [modal, setModal] = useState(null) // { key, title, confirmText, tone, onConfirm, body }

  const isAdmin = useMemo(() => {
    const r = (user.role || '').toLowerCase()
    return r === 'admin' || r === 'administrator'
  }, [user.role])

  const isDirty = useMemo(() => JSON.stringify(settings) !== JSON.stringify(draft), [settings, draft])

  // Load settings from backend
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true)
        setLoadError(null)
        
        // Load user from localStorage
        const storedUser = safeParse(localStorage.getItem('user') || '') || {}
        setUser({
          email: storedUser.email || 'user@example.com',
          role: storedUser.role || storedUser.userRole || 'User',
        })

        // Load settings from backend
        const response = await settingsApi.getSettings()
        if (response?.data?.data) {
          const backendSettings = response.data.data
          
          // Transform backend settings to frontend format (remove _meta)
          const transformedSettings = {}
          Object.keys(backendSettings).forEach(key => {
            const { _meta, ...value } = backendSettings[key]
            transformedSettings[key] = value
          })
          
          // Merge with defaults to ensure all categories exist
          const mergedSettings = {
            ...DEFAULT_SETTINGS,
            ...transformedSettings,
          }
          
          setSettings(mergedSettings)
          setDraft(mergedSettings)
        } else {
          // Fallback to defaults if no settings found
          setSettings(DEFAULT_SETTINGS)
          setDraft(DEFAULT_SETTINGS)
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
        setLoadError(error.message || 'Failed to load settings')
        // Fallback to defaults on error
        setSettings(DEFAULT_SETTINGS)
        setDraft(DEFAULT_SETTINGS)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  useEffect(() => {
    if (!saved) return
    const t = setTimeout(() => setSaved(false), 2200)
    return () => clearTimeout(t)
  }, [saved])

  const validate = (s) => {
    const next = {}
    if (!s.general.companyName.trim()) next.companyName = 'Company name is required'
    if (s.general.companyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.general.companyEmail)) {
      next.companyEmail = 'Enter a valid email address'
    }
    if (s.invoice.taxDefaultPercent < 0 || s.invoice.taxDefaultPercent > 100) {
      next.taxDefaultPercent = 'Tax must be between 0 and 100'
    }
    if (!s.invoice.numberingFormat.trim()) next.numberingFormat = 'Numbering format is required'
    if (s.security.sessionTimeoutMinutes < 5 || s.security.sessionTimeoutMinutes > 240) {
      next.sessionTimeoutMinutes = 'Session timeout must be between 5 and 240 minutes'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const setDraftPath = (path, value) => {
    setDraft((prev) => {
      const next = structuredClone(prev)
      const [group, key] = path
      next[group][key] = value
      return next
    })
    const k = path[1]
    if (errors[k]) setErrors((e) => ({ ...e, [k]: '' }))
  }

  const requestConfirm = ({ title, confirmText, tone, body, onConfirm }) => {
    setModal({ title, confirmText, tone, body, onConfirm })
  }

  const onSave = async () => {
    if (!validate(draft)) return

    // Guarded confirmations for sensitive settings
    const changedFY = draft.general.financialYear !== settings.general.financialYear
    const changedNum = draft.invoice.numberingFormat !== settings.invoice.numberingFormat
    const changed2fa = draft.security.twoFactorEnabled !== settings.security.twoFactorEnabled
    const changedTimeout = draft.security.sessionTimeoutMinutes !== settings.security.sessionTimeoutMinutes

    // Check financial year change if it's being changed
    if (changedFY) {
      try {
        const checkResponse = await settingsApi.checkFinancialYearChange(draft.general.financialYear)
        if (!checkResponse?.data?.data?.allowed) {
          setErrors({
            ...errors,
            financialYear: checkResponse.data.data.reason || 'Cannot change financial year',
          })
          requestConfirm({
            title: 'Financial Year Change Not Allowed',
            confirmText: 'OK',
            tone: 'danger',
            body: (
              <div className="settings-confirm">
                <div className="settings-confirm-note">
                  <AlertCircle className="settings-confirm-icon" />
                  <div>
                    {checkResponse.data.data.reason || 'Cannot change financial year: Transactions already exist in the system.'}
                  </div>
                </div>
              </div>
            ),
            onConfirm: () => setModal(null),
          })
          return
        }
      } catch (error) {
        console.error('Failed to check financial year:', error)
        // Continue with confirmation if check fails
      }
    }

    if (changedFY || changedNum || changed2fa || changedTimeout) {
      requestConfirm({
        title: 'Confirm settings update',
        confirmText: 'Apply changes',
        tone: 'primary',
        body: (
          <div className="settings-confirm">
            <div className="settings-confirm-note">
              <AlertCircle className="settings-confirm-icon" />
              <div>
                These changes can affect billing, audit trails, or user access. Please confirm before applying.
              </div>
            </div>
            <ul className="settings-confirm-list">
              {changedFY && <li><strong>Financial Year</strong> will change to {draft.general.financialYear}.</li>}
              {changedNum && <li><strong>Invoice numbering</strong> will change to <span className="settings-mono">{draft.invoice.numberingFormat}</span>.</li>}
              {changed2fa && <li><strong>2FA</strong> will be {draft.security.twoFactorEnabled ? 'enabled' : 'disabled'}.</li>}
              {changedTimeout && <li><strong>Session timeout</strong> will be {draft.security.sessionTimeoutMinutes} minutes.</li>}
            </ul>
          </div>
        ),
        onConfirm: () => applySave(),
      })
      return
    }

    await applySave()
  }

  const applySave = async () => {
    setModal(null)
    setSaving(true)
    setErrors({})
    
    try {
      // Prepare settings for backend (only changed categories)
      const settingsToUpdate = {}
      if (JSON.stringify(draft.general) !== JSON.stringify(settings.general)) {
        settingsToUpdate.general = draft.general
      }
      if (JSON.stringify(draft.invoice) !== JSON.stringify(settings.invoice)) {
        settingsToUpdate.invoice = draft.invoice
      }
      if (JSON.stringify(draft.notifications) !== JSON.stringify(settings.notifications)) {
        settingsToUpdate.notifications = draft.notifications
      }
      if (JSON.stringify(draft.security) !== JSON.stringify(settings.security)) {
        settingsToUpdate.security = draft.security
      }
      if (JSON.stringify(draft.access) !== JSON.stringify(settings.access)) {
        settingsToUpdate.access = draft.access
      }

      // Update settings via backend API
      await settingsApi.updateSettings(settingsToUpdate)
      
      // Update local state
      setSettings(draft)
      setSaved(true)
      
      // Clear any errors
      setErrors({})
    } catch (error) {
      console.error('Failed to save settings:', error)
      
      // Handle specific error types
      if (error.code === 'FINANCIAL_YEAR_LOCKED' || error.message?.includes('financial year')) {
        setErrors({
          ...errors,
          financialYear: error.message || 'Cannot change financial year: Transactions exist',
        })
      } else if (error.code === 'SETTING_LOCKED') {
        setErrors({
          ...errors,
          _general: error.message || 'This setting is locked and cannot be changed',
        })
      } else if (error.code === 'VALIDATION_ERROR' && error.data) {
        // Handle validation errors
        const validationErrors = {}
        error.data.forEach(err => {
          const path = err.path.join('.')
          validationErrors[path] = err.message
        })
        setErrors(validationErrors)
      } else {
        setErrors({
          ...errors,
          _general: error.message || 'Failed to save settings. Please try again.',
        })
      }
    } finally {
      setSaving(false)
    }
  }

  const resetDraft = () => {
    setDraft(settings)
    setErrors({})
  }

  const handleResetToDefaults = async () => {
    requestConfirm({
      title: 'Reset to Defaults',
      confirmText: 'Reset',
      tone: 'danger',
      body: (
        <div className="settings-confirm">
          <div className="settings-confirm-note">
            <AlertCircle className="settings-confirm-icon" />
            <div>
              This will reset all settings to their default values. This action cannot be undone.
            </div>
          </div>
        </div>
      ),
      onConfirm: async () => {
        setModal(null)
        setSaving(true)
        try {
          await settingsApi.resetSettings()
          // Reload settings
          const response = await settingsApi.getSettings()
          if (response?.data?.data) {
            const backendSettings = response.data.data
            const transformedSettings = {}
            Object.keys(backendSettings).forEach(key => {
              const { _meta, ...value } = backendSettings[key]
              transformedSettings[key] = value
            })
            const mergedSettings = {
              ...DEFAULT_SETTINGS,
              ...transformedSettings,
            }
            setSettings(mergedSettings)
            setDraft(mergedSettings)
            setSaved(true)
          }
        } catch (error) {
          console.error('Failed to reset settings:', error)
          setErrors({
            ...errors,
            _general: error.message || 'Failed to reset settings',
          })
        } finally {
          setSaving(false)
        }
      },
    })
  }

  if (loading) {
    return (
      <div className="settings-page">
        <div className="settings-loading">
          <p>Loading settings...</p>
        </div>
      </div>
    )
  }

  if (loadError && !settings) {
    return (
      <div className="settings-page">
        <div className="settings-error">
          <AlertCircle />
          <p>Failed to load settings: {loadError}</p>
          <button
            type="button"
            className="settings-btn settings-btn-primary"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div className="settings-header-content">
          <h1 className="settings-title">Settings</h1>
          <p className="settings-subtitle">Centralized configuration for company, invoicing, notifications, and security.</p>
        </div>

        <div className="settings-header-actions">
          {saved ? (
            <div className="settings-state settings-state--ok" role="status">
              <CheckCircle2 className="settings-state-icon" />
              Saved
            </div>
          ) : isDirty ? (
            <div className="settings-state settings-state--warn" role="status">
              <AlertCircle className="settings-state-icon" />
              Unsaved changes
            </div>
          ) : (
            <div className="settings-state" role="status">
              <ShieldCheck className="settings-state-icon" />
              Secure configuration
            </div>
          )}

          <button type="button" className="settings-btn settings-btn-ghost" onClick={resetDraft} disabled={!isDirty || saving}>
            Discard changes
          </button>
          {isAdmin && (
            <button
              type="button"
              className="settings-btn settings-btn-secondary"
              onClick={handleResetToDefaults}
              disabled={saving}
            >
              Reset to defaults
            </button>
          )}
          <button type="button" className="settings-btn settings-btn-primary" onClick={onSave} disabled={saving || !isDirty}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      {errors._general && (
        <div className="settings-error-banner" role="alert">
          <AlertCircle />
          <span>{errors._general}</span>
        </div>
      )}

      <div className="settings-grid">
        {/* General Settings */}
        <section className="settings-card">
          <div className="settings-card-head">
            <div className="settings-card-title">
              <Building2 className="settings-card-icon" />
              General Settings
            </div>
            <div className="settings-card-desc">Company info and finance period defaults used across modules.</div>
          </div>

          <div className="settings-form-grid">
            <div className="settings-field">
              <label className="settings-label" htmlFor="companyName">Company name</label>
              <input
                id="companyName"
                className={`settings-input ${errors.companyName ? 'is-error' : ''}`}
                value={draft.general.companyName}
                onChange={(e) => setDraftPath(['general', 'companyName'], e.target.value)}
                aria-invalid={errors.companyName ? 'true' : 'false'}
              />
              {errors.companyName && <div className="settings-error" role="alert">{errors.companyName}</div>}
            </div>

            <div className="settings-field">
              <label className="settings-label" htmlFor="companyEmail">Company email</label>
              <input
                id="companyEmail"
                type="email"
                className={`settings-input ${errors.companyEmail ? 'is-error' : ''}`}
                value={draft.general.companyEmail}
                onChange={(e) => setDraftPath(['general', 'companyEmail'], e.target.value)}
                aria-invalid={errors.companyEmail ? 'true' : 'false'}
              />
              {errors.companyEmail && <div className="settings-error" role="alert">{errors.companyEmail}</div>}
            </div>

            <div className="settings-field">
              <label className="settings-label" htmlFor="companyPhone">Company phone</label>
              <input
                id="companyPhone"
                className="settings-input"
                value={draft.general.companyPhone}
                onChange={(e) => setDraftPath(['general', 'companyPhone'], e.target.value)}
              />
            </div>

            <div className="settings-field">
              <label className="settings-label" htmlFor="fy">Financial year</label>
              <select
                id="fy"
                className="settings-input settings-select"
                value={draft.general.financialYear}
                onChange={(e) => setDraftPath(['general', 'financialYear'], e.target.value)}
              >
                <option value="2023-2024">2023-2024</option>
                <option value="2024-2025">2024-2025</option>
                <option value="2025-2026">2025-2026</option>
              </select>
              <div className="settings-help">Changing the financial year affects reporting ranges and fiscal defaults.</div>
            </div>

            <div className="settings-field">
              <label className="settings-label" htmlFor="currency">Currency</label>
              <select
                id="currency"
                className="settings-input settings-select"
                value={draft.general.currency}
                onChange={(e) => setDraftPath(['general', 'currency'], e.target.value)}
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
              <div className="settings-help">Currency is used for invoice totals, payments, and dashboards.</div>
            </div>
          </div>
        </section>

        {/* Invoice Settings */}
        <section className="settings-card">
          <div className="settings-card-head">
            <div className="settings-card-title">
              <Receipt className="settings-card-icon" />
              Invoice Settings
            </div>
            <div className="settings-card-desc">Numbering, tax defaults, and payment terms.</div>
          </div>

          <div className="settings-form-grid">
            <div className="settings-field settings-field--span">
              <label className="settings-label" htmlFor="invNum">Invoice numbering format</label>
              <input
                id="invNum"
                className={`settings-input ${errors.numberingFormat ? 'is-error' : ''}`}
                value={draft.invoice.numberingFormat}
                onChange={(e) => setDraftPath(['invoice', 'numberingFormat'], e.target.value)}
                aria-invalid={errors.numberingFormat ? 'true' : 'false'}
              />
              {errors.numberingFormat && <div className="settings-error" role="alert">{errors.numberingFormat}</div>}
              <div className="settings-help">
                Supported tokens: <span className="settings-mono">{'{YYYY}'}</span>, <span className="settings-mono">{'{MM}'}</span>, <span className="settings-mono">{'{SEQ}'}</span>.
              </div>
            </div>

            <div className="settings-field">
              <label className="settings-label" htmlFor="tax">Tax default (%)</label>
              <input
                id="tax"
                type="number"
                className={`settings-input ${errors.taxDefaultPercent ? 'is-error' : ''}`}
                value={draft.invoice.taxDefaultPercent}
                onChange={(e) => setDraftPath(['invoice', 'taxDefaultPercent'], Number(e.target.value))}
                aria-invalid={errors.taxDefaultPercent ? 'true' : 'false'}
              />
              {errors.taxDefaultPercent && <div className="settings-error" role="alert">{errors.taxDefaultPercent}</div>}
            </div>

            <div className="settings-field">
              <label className="settings-label" htmlFor="terms">Default payment terms</label>
              <select
                id="terms"
                className="settings-input settings-select"
                value={draft.invoice.paymentTermDefault}
                onChange={(e) => setDraftPath(['invoice', 'paymentTermDefault'], e.target.value)}
              >
                <option value="Due on receipt">Due on receipt</option>
                <option value="Net 7">Net 7</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 45">Net 45</option>
              </select>
            </div>
          </div>
        </section>

        {/* Notification Preferences */}
        <section className="settings-card">
          <div className="settings-card-head">
            <div className="settings-card-title">
              <Bell className="settings-card-icon" />
              Notification Preferences
            </div>
            <div className="settings-card-desc">Control email notifications and in-app system alerts.</div>
          </div>

          <div className="settings-toggle-list">
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={draft.notifications.emailNotifications}
                onChange={(e) => setDraftPath(['notifications', 'emailNotifications'], e.target.checked)}
              />
              <span className="settings-toggle-ui" aria-hidden="true" />
              <span>
                <span className="settings-toggle-title">Email notifications</span>
                <span className="settings-toggle-sub">Receive billing, invoicing, and compliance updates by email.</span>
              </span>
            </label>

            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={draft.notifications.systemAlerts}
                onChange={(e) => setDraftPath(['notifications', 'systemAlerts'], e.target.checked)}
              />
              <span className="settings-toggle-ui" aria-hidden="true" />
              <span>
                <span className="settings-toggle-title">System alerts</span>
                <span className="settings-toggle-sub">Show operational alerts in the Alerts module.</span>
              </span>
            </label>
          </div>
        </section>

        {/* Security Settings */}
        <section className="settings-card">
          <div className="settings-card-head">
            <div className="settings-card-title">
              <KeyRound className="settings-card-icon" />
              Security Settings
            </div>
            <div className="settings-card-desc">Strengthen access controls and session behavior.</div>
          </div>

          <div className="settings-form-grid">
            <div className="settings-field">
              <label className="settings-label">Two-factor authentication (2FA)</label>
              <div className="settings-inline">
                <label className="settings-switch">
                  <input
                    type="checkbox"
                    checked={draft.security.twoFactorEnabled}
                    onChange={(e) => setDraftPath(['security', 'twoFactorEnabled'], e.target.checked)}
                  />
                  <span className="settings-switch-ui" aria-hidden="true" />
                </label>
                <div className="settings-help">
                  Enables an additional verification step during sign-in for higher assurance.
                </div>
              </div>
            </div>

            <div className="settings-field">
              <label className="settings-label" htmlFor="timeout">Session timeout (minutes)</label>
              <div className="settings-inline">
                <Clock className="settings-inline-icon" />
                <input
                  id="timeout"
                  type="number"
                  className={`settings-input ${errors.sessionTimeoutMinutes ? 'is-error' : ''}`}
                  value={draft.security.sessionTimeoutMinutes}
                  onChange={(e) => setDraftPath(['security', 'sessionTimeoutMinutes'], Number(e.target.value))}
                  aria-invalid={errors.sessionTimeoutMinutes ? 'true' : 'false'}
                />
              </div>
              {errors.sessionTimeoutMinutes && <div className="settings-error" role="alert">{errors.sessionTimeoutMinutes}</div>}
              <div className="settings-help">Recommended: 15–60 minutes depending on your policy.</div>
            </div>
          </div>
        </section>

        {/* User & Role Management (Admin only) */}
        <section className="settings-card settings-card--span">
          <div className="settings-card-head settings-card-head--row">
            <div>
              <div className="settings-card-title">
                <Users className="settings-card-icon" />
                User & Role Management
              </div>
              <div className="settings-card-desc">
                Roles and permissions are controlled by administrators. Current access is visible for transparency.
              </div>
            </div>
            <div className={`settings-access-badge ${isAdmin ? 'is-admin' : ''}`}>
              <Lock className="settings-access-icon" />
              <span>{isAdmin ? 'Admin access' : 'Admin only'}</span>
            </div>
          </div>

          {!isAdmin && (
            <div className="settings-banner" role="note">
              <AlertCircle className="settings-banner-icon" />
              You do not have permission to modify roles and permissions. Contact your administrator for changes.
            </div>
          )}

          <div className="settings-role-grid">
            {draft.access.roles.map((r) => (
              <div key={r.name} className="settings-role-card">
                <div className="settings-role-head">
                  <div className="settings-role-name">{r.name}</div>
                  <span className="settings-role-chip">Permissions</span>
                </div>
                <div className="settings-role-list">
                  {r.permissions.map((p) => (
                    <div key={p} className="settings-role-item">
                      <span className="settings-role-dot" aria-hidden="true" />
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
                <button type="button" className="settings-btn settings-btn-secondary" disabled={!isAdmin}>
                  Manage role
                </button>
              </div>
            ))}
          </div>

          <div className="settings-help">
            Current signed-in user: <span className="settings-mono">{user.email}</span> • Role: <strong>{user.role}</strong>
          </div>
        </section>
      </div>

      {modal && (
        <Modal
          title={modal.title}
          confirmText={modal.confirmText}
          confirmTone={modal.tone}
          onCancel={() => setModal(null)}
          onConfirm={modal.onConfirm}
        >
          {modal.body}
        </Modal>
      )}
    </div>
  )
}


