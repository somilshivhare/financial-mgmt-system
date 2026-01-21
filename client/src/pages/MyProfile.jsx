import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
  Lock,
  Monitor,
  ShieldCheck,
  Upload,
  XCircle,
} from 'lucide-react'
import '../styles/MyProfile.css'

function safeParse(json) {
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

const DEFAULT_PROFILE = {
  personal: {
    name: 'User',
    email: 'user@example.com',
    mobile: '',
  },
  organization: {
    companyName: 'Nbaurum',
    role: 'User',
    department: 'Finance',
  },
  permissions: ['Invoice: Read', 'Invoice: Create', 'Collections: Read', 'Master Data: Read'],
  security: {
    lastLogin: new Date().toISOString(),
    sessions: [
      { id: 'sess-1', device: 'Chrome on Windows', location: 'Mumbai, IN', lastActive: 'Just now', current: true },
      { id: 'sess-2', device: 'Edge on Windows', location: 'Delhi, IN', lastActive: '2 days ago', current: false },
    ],
  },
  preferences: {
    language: 'en-IN',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD MMM YYYY',
  },
}

export default function MyProfile() {
  const [profile, setProfile] = useState(DEFAULT_PROFILE)
  const [draft, setDraft] = useState(DEFAULT_PROFILE)
  const [fieldErrors, setFieldErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('')
  const photoFileRef = useRef(null)

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pwErrors, setPwErrors] = useState({})
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false })

  useEffect(() => {
    const storedUser = safeParse(localStorage.getItem('user') || '')
    if (!storedUser) return

    const nextProfile = {
      ...DEFAULT_PROFILE,
      personal: {
        ...DEFAULT_PROFILE.personal,
        name: storedUser.name || DEFAULT_PROFILE.personal.name,
        email: storedUser.email || DEFAULT_PROFILE.personal.email,
      },
      organization: {
        ...DEFAULT_PROFILE.organization,
        companyName: storedUser.companyName || DEFAULT_PROFILE.organization.companyName,
        role: storedUser.role || DEFAULT_PROFILE.organization.role,
      },
    }
    setProfile(nextProfile)
    setDraft(nextProfile)
  }, [])

  useEffect(() => {
    if (!saved) return
    const t = setTimeout(() => setSaved(false), 2200)
    return () => clearTimeout(t)
  }, [saved])

  useEffect(() => {
    if (!pwSaved) return
    const t = setTimeout(() => setPwSaved(false), 2200)
    return () => clearTimeout(t)
  }, [pwSaved])

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl)
    }
  }, [photoPreviewUrl])

  const isDirty = useMemo(() => JSON.stringify(profile) !== JSON.stringify(draft), [profile, draft])

  const validatePersonal = (p) => {
    const errors = {}
    if (!p.name?.trim()) errors.name = 'Name is required'
    if (!p.email?.trim()) errors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) errors.email = 'Enter a valid email address'
    if (p.mobile && !/^[0-9]{10}$/.test(p.mobile.replace(/[\s-]/g, ''))) {
      errors.mobile = 'Enter a valid 10-digit mobile number'
    }
    return errors
  }

  const onPersonalChange = (field, value) => {
    setDraft((prev) => ({
      ...prev,
      personal: { ...prev.personal, [field]: value },
    }))
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const onPreferenceChange = (field, value) => {
    setDraft((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, [field]: value },
    }))
  }

  const onSelectPhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowed = ['image/png', 'image/jpeg', 'image/webp']
    const maxBytes = 2 * 1024 * 1024
    if (!allowed.includes(file.type)) {
      setFieldErrors((prev) => ({ ...prev, photo: 'Upload a PNG, JPG, or WEBP image.' }))
      e.target.value = ''
      return
    }
    if (file.size > maxBytes) {
      setFieldErrors((prev) => ({ ...prev, photo: 'Image must be 2MB or smaller.' }))
      e.target.value = ''
      return
    }

    setFieldErrors((prev) => ({ ...prev, photo: '' }))
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl)
    setPhotoPreviewUrl(URL.createObjectURL(file))
  }

  const onSaveProfile = async () => {
    const errors = validatePersonal(draft.personal)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSaving(true)
    try {
      // Persist minimal user fields used across the app
      const storedUser = safeParse(localStorage.getItem('user') || '') || {}
      const nextUser = {
        ...storedUser,
        name: draft.personal.name,
        email: draft.personal.email,
        companyName: draft.organization.companyName,
        role: draft.organization.role,
      }
      localStorage.setItem('user', JSON.stringify(nextUser))

      setProfile(draft)
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  const validatePassword = () => {
    const errors = {}
    if (!pw.current) errors.current = 'Current password is required'
    if (!pw.next) errors.next = 'New password is required'
    else {
      const strong =
        pw.next.length >= 8 &&
        /[A-Z]/.test(pw.next) &&
        /[a-z]/.test(pw.next) &&
        /[0-9]/.test(pw.next) &&
        /[!@#$%^&*(),.?":{}|<>]/.test(pw.next)
      if (!strong) errors.next = 'Use 8+ chars with upper, lower, number, and special character'
    }
    if (!pw.confirm) errors.confirm = 'Confirm your new password'
    else if (pw.confirm !== pw.next) errors.confirm = 'Passwords do not match'
    setPwErrors(errors)
    return Object.keys(errors).length === 0
  }

  const onChangePassword = async (e) => {
    e.preventDefault()
    if (!validatePassword()) return

    setPwSaving(true)
    try {
      // No backend requested; keep as a UI workflow only.
      await new Promise((r) => setTimeout(r, 500))
      setPw({ current: '', next: '', confirm: '' })
      setPwSaved(true)
      setPwErrors({})
    } finally {
      setPwSaving(false)
    }
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-header-content">
          <h1 className="profile-title">My Profile</h1>
          <p className="profile-subtitle">Manage your personal details, security settings, and preferences.</p>
        </div>

        <div className="profile-header-actions">
          {saved ? (
            <div className="profile-save-state profile-save-state--ok" role="status">
              <CheckCircle2 className="profile-save-icon" />
              Saved
            </div>
          ) : isDirty ? (
            <div className="profile-save-state profile-save-state--warn" role="status">
              <Info className="profile-save-icon" />
              Unsaved changes
            </div>
          ) : (
            <div className="profile-save-state" role="status">
              <ShieldCheck className="profile-save-icon" />
              Secure profile
            </div>
          )}

          <button
            type="button"
            className="profile-btn profile-btn-primary"
            onClick={onSaveProfile}
            disabled={saving || !isDirty}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      <div className="profile-grid">
        {/* Personal Information */}
        <section className="profile-card">
          <div className="profile-card-header">
            <h2 className="profile-card-title">Personal Information</h2>
            <p className="profile-card-subtitle">Editable profile details used for account communications.</p>
          </div>

          <div className="profile-photo-row">
            <div className="profile-photo">
              {photoPreviewUrl ? (
                <img className="profile-photo-img" src={photoPreviewUrl} alt="Profile preview" />
              ) : (
                <div className="profile-photo-placeholder" aria-hidden="true">
                  <Camera className="profile-photo-icon" />
                </div>
              )}
            </div>

            <div className="profile-photo-actions">
              <input
                ref={photoFileRef}
                className="profile-file-input"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={onSelectPhoto}
              />
              <button
                type="button"
                className="profile-btn profile-btn-secondary"
                onClick={() => photoFileRef.current?.click()}
              >
                <Upload className="profile-btn-icon" />
                Upload photo
              </button>
              <div className="profile-help">PNG/JPG/WEBP, max 2MB.</div>
              {fieldErrors.photo && <div className="profile-field-error" role="alert">{fieldErrors.photo}</div>}
            </div>
          </div>

          <div className="profile-form-grid">
            <div className="profile-field">
              <label className="profile-label" htmlFor="name">Name</label>
              <input
                id="name"
                className={`profile-input ${fieldErrors.name ? 'is-error' : ''}`}
                value={draft.personal.name}
                onChange={(e) => onPersonalChange('name', e.target.value)}
                aria-invalid={fieldErrors.name ? 'true' : 'false'}
                aria-describedby={fieldErrors.name ? 'name-error' : undefined}
              />
              {fieldErrors.name && <div id="name-error" className="profile-field-error" role="alert">{fieldErrors.name}</div>}
            </div>

            <div className="profile-field">
              <label className="profile-label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className={`profile-input ${fieldErrors.email ? 'is-error' : ''}`}
                value={draft.personal.email}
                onChange={(e) => onPersonalChange('email', e.target.value)}
                aria-invalid={fieldErrors.email ? 'true' : 'false'}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              />
              {fieldErrors.email && <div id="email-error" className="profile-field-error" role="alert">{fieldErrors.email}</div>}
            </div>

            <div className="profile-field">
              <label className="profile-label" htmlFor="mobile">Mobile</label>
              <input
                id="mobile"
                inputMode="numeric"
                className={`profile-input ${fieldErrors.mobile ? 'is-error' : ''}`}
                value={draft.personal.mobile}
                onChange={(e) => onPersonalChange('mobile', e.target.value)}
                placeholder="10-digit mobile number"
                aria-invalid={fieldErrors.mobile ? 'true' : 'false'}
                aria-describedby={fieldErrors.mobile ? 'mobile-error' : undefined}
              />
              {fieldErrors.mobile && <div id="mobile-error" className="profile-field-error" role="alert">{fieldErrors.mobile}</div>}
            </div>
          </div>
        </section>

        {/* Organization Details */}
        <section className="profile-card">
          <div className="profile-card-header">
            <h2 className="profile-card-title">Organization Details</h2>
            <p className="profile-card-subtitle">Managed by administrators. Read-only by default.</p>
          </div>

          <div className="profile-form-grid">
            <div className="profile-field">
              <label className="profile-label" htmlFor="company">Company</label>
              <div className="profile-readonly">
                <input id="company" className="profile-input" value={draft.organization.companyName} readOnly />
                <span className="profile-readonly-chip"><Lock className="profile-chip-icon" /> Read-only</span>
              </div>
            </div>

            <div className="profile-field">
              <label className="profile-label" htmlFor="role">Role</label>
              <div className="profile-readonly">
                <input id="role" className="profile-input" value={draft.organization.role} readOnly />
                <span className="profile-readonly-chip"><Lock className="profile-chip-icon" /> Read-only</span>
              </div>
            </div>

            <div className="profile-field">
              <label className="profile-label" htmlFor="department">Department</label>
              <div className="profile-readonly">
                <input id="department" className="profile-input" value={draft.organization.department} readOnly />
                <span className="profile-readonly-chip"><Lock className="profile-chip-icon" /> Read-only</span>
              </div>
            </div>
          </div>

          <div className="profile-divider-space" />

          <div className="profile-permissions">
            <div className="profile-permissions-head">
              <div>
                <div className="profile-permissions-title">Role & permissions</div>
                <div className="profile-permissions-subtitle">Visible for transparency. Editing requires admin access.</div>
              </div>
              <span className="profile-readonly-chip"><Lock className="profile-chip-icon" /> Not editable</span>
            </div>

            <div className="profile-permission-list">
              {draft.permissions.map((p) => (
                <div key={p} className="profile-permission-item">
                  <span className="profile-permission-dot" aria-hidden="true" />
                  <span>{p}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Security Settings */}
        <section className="profile-card">
          <div className="profile-card-header">
            <h2 className="profile-card-title">Security Settings</h2>
            <p className="profile-card-subtitle">Update your password and review active sessions.</p>
          </div>

          <div className="profile-security-meta">
            <div className="profile-meta-item">
              <div className="profile-meta-label">Last login</div>
              <div className="profile-meta-value">{new Date(draft.security.lastLogin).toLocaleString('en-IN')}</div>
            </div>
          </div>

          <form className="profile-password" onSubmit={onChangePassword}>
            <div className="profile-password-head">
              <div className="profile-password-title">Change Password</div>
              {pwSaved ? (
                <div className="profile-inline-state profile-inline-state--ok" role="status">
                  <CheckCircle2 className="profile-inline-icon" /> Updated
                </div>
              ) : null}
            </div>

            <div className="profile-form-grid">
              <div className="profile-field">
                <label className="profile-label" htmlFor="pw-current">Current password</label>
                <div className="profile-input-wrap">
                  <input
                    id="pw-current"
                    type={showPw.current ? 'text' : 'password'}
                    className={`profile-input ${pwErrors.current ? 'is-error' : ''}`}
                    value={pw.current}
                    onChange={(e) => {
                      setPw((p) => ({ ...p, current: e.target.value }))
                      if (pwErrors.current) setPwErrors((x) => ({ ...x, current: '' }))
                    }}
                    aria-invalid={pwErrors.current ? 'true' : 'false'}
                    aria-describedby={pwErrors.current ? 'pw-current-error' : undefined}
                  />
                  <button
                    type="button"
                    className="profile-eye"
                    onClick={() => setShowPw((s) => ({ ...s, current: !s.current }))}
                    aria-label={showPw.current ? 'Hide current password' : 'Show current password'}
                  >
                    {showPw.current ? <EyeOff /> : <Eye />}
                  </button>
                </div>
                {pwErrors.current && <div id="pw-current-error" className="profile-field-error" role="alert">{pwErrors.current}</div>}
              </div>

              <div className="profile-field">
                <label className="profile-label" htmlFor="pw-next">New password</label>
                <div className="profile-input-wrap">
                  <input
                    id="pw-next"
                    type={showPw.next ? 'text' : 'password'}
                    className={`profile-input ${pwErrors.next ? 'is-error' : ''}`}
                    value={pw.next}
                    onChange={(e) => {
                      setPw((p) => ({ ...p, next: e.target.value }))
                      if (pwErrors.next) setPwErrors((x) => ({ ...x, next: '' }))
                    }}
                    aria-invalid={pwErrors.next ? 'true' : 'false'}
                    aria-describedby={pwErrors.next ? 'pw-next-error' : 'pw-hint'}
                  />
                  <button
                    type="button"
                    className="profile-eye"
                    onClick={() => setShowPw((s) => ({ ...s, next: !s.next }))}
                    aria-label={showPw.next ? 'Hide new password' : 'Show new password'}
                  >
                    {showPw.next ? <EyeOff /> : <Eye />}
                  </button>
                </div>
                <div id="pw-hint" className="profile-help">
                  8+ chars, upper/lowercase, number, special character.
                </div>
                {pwErrors.next && <div id="pw-next-error" className="profile-field-error" role="alert">{pwErrors.next}</div>}
              </div>

              <div className="profile-field">
                <label className="profile-label" htmlFor="pw-confirm">Confirm new password</label>
                <div className="profile-input-wrap">
                  <input
                    id="pw-confirm"
                    type={showPw.confirm ? 'text' : 'password'}
                    className={`profile-input ${pwErrors.confirm ? 'is-error' : ''}`}
                    value={pw.confirm}
                    onChange={(e) => {
                      setPw((p) => ({ ...p, confirm: e.target.value }))
                      if (pwErrors.confirm) setPwErrors((x) => ({ ...x, confirm: '' }))
                    }}
                    aria-invalid={pwErrors.confirm ? 'true' : 'false'}
                    aria-describedby={pwErrors.confirm ? 'pw-confirm-error' : undefined}
                  />
                  <button
                    type="button"
                    className="profile-eye"
                    onClick={() => setShowPw((s) => ({ ...s, confirm: !s.confirm }))}
                    aria-label={showPw.confirm ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showPw.confirm ? <EyeOff /> : <Eye />}
                  </button>
                </div>
                {pwErrors.confirm && <div id="pw-confirm-error" className="profile-field-error" role="alert">{pwErrors.confirm}</div>}
              </div>
            </div>

            <div className="profile-password-actions">
              <button className="profile-btn profile-btn-secondary" type="submit" disabled={pwSaving}>
                {pwSaving ? 'Updating…' : 'Update password'}
              </button>
            </div>
          </form>

          <div className="profile-divider-space" />

          <div className="profile-sessions">
            <div className="profile-sessions-head">
              <div className="profile-password-title">Active sessions</div>
              <span className="profile-help">Review and revoke access where needed.</span>
            </div>

            <div className="profile-session-list">
              {draft.security.sessions.map((s) => (
                <div key={s.id} className={`profile-session ${s.current ? 'is-current' : ''}`}>
                  <div className="profile-session-left">
                    <div className="profile-session-icon">
                      <Monitor />
                    </div>
                    <div className="profile-session-meta">
                      <div className="profile-session-device">{s.device}</div>
                      <div className="profile-session-sub">{s.location} • {s.lastActive}</div>
                    </div>
                  </div>
                  <div className="profile-session-actions">
                    {s.current ? (
                      <span className="profile-session-chip">Current</span>
                    ) : (
                      <button type="button" className="profile-btn profile-btn-ghost profile-btn-sm">
                        <XCircle className="profile-btn-icon" />
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Preferences */}
        <section className="profile-card">
          <div className="profile-card-header">
            <h2 className="profile-card-title">Preferences</h2>
            <p className="profile-card-subtitle">Configure regional and display defaults for your account.</p>
          </div>

          <div className="profile-form-grid">
            <div className="profile-field">
              <label className="profile-label" htmlFor="language">Language</label>
              <select
                id="language"
                className="profile-input profile-select"
                value={draft.preferences.language}
                onChange={(e) => onPreferenceChange('language', e.target.value)}
              >
                <option value="en-IN">English (India)</option>
                <option value="en-US">English (US)</option>
              </select>
            </div>

            <div className="profile-field">
              <label className="profile-label" htmlFor="timezone">Timezone</label>
              <select
                id="timezone"
                className="profile-input profile-select"
                value={draft.preferences.timezone}
                onChange={(e) => onPreferenceChange('timezone', e.target.value)}
              >
                <option value="Asia/Kolkata">Asia/Kolkata</option>
                <option value="UTC">UTC</option>
              </select>
            </div>

            <div className="profile-field">
              <label className="profile-label" htmlFor="dateFormat">Date format</label>
              <select
                id="dateFormat"
                className="profile-input profile-select"
                value={draft.preferences.dateFormat}
                onChange={(e) => onPreferenceChange('dateFormat', e.target.value)}
              >
                <option value="DD MMM YYYY">DD MMM YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}


