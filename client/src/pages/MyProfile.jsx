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
import { getProfile, updateProfile, updatePassword, revokeSession, getLoginHistory, uploadProfilePhoto } from '../api/user'
import { ConfirmDialog, useConfirmDialog } from '../components/ConfirmDialog'
import { useToast } from '../contexts/ToastContext'
import '../styles/MyProfile.css'
import { getApiBaseUrl } from '../config/api'

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
    phone: '',
  },
  organization: {
    companyName: 'NB Aurum Solutions',
    role: 'User',
    department: '',
    designation: '',
  },
  address: {
    address: '',
    city: '',
    state: '',
    country: 'India',
    pinCode: '',
  },
  bio: '',
  profilePictureUrl: '',
  permissions: ['Invoice: Read', 'Invoice: Create', 'Collections: Read', 'Master Data: Read'],
  security: {
    lastLogin: null,
    lastLoginIp: '',
    sessions: [],
  },
  preferences: {
    language: 'en-IN',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD MMM YYYY',
  },
  preferencesOther: {
    languageOther: '',
    timezoneOther: '',
    dateFormatOther: '',
  },
}

export default function MyProfile() {
  const { confirm, dialogProps } = useConfirmDialog()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(DEFAULT_PROFILE)
  const [draft, setDraft] = useState(DEFAULT_PROFILE)
  const [fieldErrors, setFieldErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('')
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoFile, setPhotoFile] = useState(null)
  const photoFileRef = useRef(null)

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pwErrors, setPwErrors] = useState({})
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false })

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true)
        setError('')
        const response = await getProfile()
        
        if (!response.data || !response.data.success) {
          throw new Error(response.data?.message || 'Failed to load profile')
        }
        
        const data = response.data.data

        if (data && data.user) {
          const userProfile = {
            personal: {
              name: data.user?.fullName || data.user?.full_name || 'User',
              email: data.user?.email || 'user@example.com',
              mobile: data.profile?.mobile || '',
              phone: data.profile?.phone || '',
            },
            organization: {
              companyName: data.profile?.company_name || 'NB Aurum Solutions',
              role: data.user?.role || 'User',
              department: data.profile?.department || '',
              designation: data.profile?.designation || '',
            },
            address: {
              address: data.profile?.address || '',
              city: data.profile?.city || '',
              state: data.profile?.state || '',
              country: data.profile?.country || 'India',
              pinCode: data.profile?.pin_code || '',
            },
            permissions: ['Invoice: Read', 'Invoice: Create', 'Collections: Read', 'Master Data: Read'],
            security: {
              lastLogin: data.user?.lastLoginAt || data.user?.last_login_at || new Date().toISOString(),
              lastLoginIp: data.user?.lastLoginIp || data.user?.last_login_ip || '',
              sessions: data.sessions || [],
            },
            preferences: {
              language: data.preferences?.language || data.profile?.language || 'en-IN',
              timezone: data.preferences?.timezone || data.profile?.timezone || 'Asia/Kolkata',
              dateFormat: data.preferences?.date_format || data.profile?.date_format || 'DD MMM YYYY',
            },
            preferencesOther: {
              languageOther: '',
              timezoneOther: '',
              dateFormatOther: '',
            },
            bio: data.profile?.bio || '',
            profilePictureUrl: data.profile?.profile_picture_url || '',
          }
          setProfile(userProfile)
          setDraft(userProfile)
          
          if (data.profile?.profile_picture_url) {
            const apiBase = getApiBaseUrl()
            const photoUrl = data.profile.profile_picture_url.startsWith('http')
              ? data.profile.profile_picture_url
              : `${apiBase}${data.profile.profile_picture_url}`
            setPhotoPreviewUrl(photoUrl)
          }
          
          if (data.user) {
            localStorage.setItem('user', JSON.stringify({
              id: data.user.id,
              fullName: data.user.fullName || data.user.full_name,
              email: data.user.email,
              role: data.user.role,
            }))
          }
        }
      } catch (err) {
        console.error('Failed to load profile:', err)
        let errorMessage = err.response?.data?.message || err.message || 'Failed to load profile data'
        
        if (err.response?.status === 429 || err.status === 429) {
          errorMessage = 'Rate limit exceeded. Please wait a moment and try again.'
        } else if (err.response?.status === 404) {
          errorMessage = 'Profile endpoint not found. Please ensure the server is running and migrations are up to date.'
        } else if (err.code === 'NETWORK_ERROR' || err.isNetworkError) {
          errorMessage = 'Network error: Unable to connect to server. Please check your connection.'
        } else if (!err.response) {
          errorMessage = 'Unable to connect to server. If this persists, please ensure database migrations are run: npm run migrate'
        }
        
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
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

  const onSelectPhoto = async (e) => {
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
    
    if (photoPreviewUrl && photoPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreviewUrl)
    }
    setPhotoPreviewUrl(URL.createObjectURL(file))
    setPhotoFile(file)

    setPhotoUploading(true)
    try {
      const response = await uploadProfilePhoto(file)
      if (response.data?.success && response.data?.data?.photoUrl) {
        const apiBase = getApiBaseUrl()
        const photoUrl = response.data.data.photoUrl.startsWith('http')
          ? response.data.data.photoUrl
          : `${apiBase}${response.data.data.photoUrl}`
        
        setProfile((prev) => ({ ...prev, profilePictureUrl: photoUrl }))
        setDraft((prev) => ({ ...prev, profilePictureUrl: photoUrl }))
        
        if (photoPreviewUrl && photoPreviewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(photoPreviewUrl)
        }
        setPhotoPreviewUrl(photoUrl)
        setPhotoFile(null)
      }
    } catch (err) {
      console.error('Failed to upload photo:', err)
      setFieldErrors((prev) => ({ 
        ...prev, 
        photo: err.response?.data?.message || 'Failed to upload photo. Please try again.' 
      }))
      if (photoPreviewUrl && photoPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreviewUrl)
      }
      setPhotoPreviewUrl(profile.profilePictureUrl || '')
      setPhotoFile(null)
    } finally {
      setPhotoUploading(false)
      e.target.value = '' // Reset file input
    }
  }

  const onSaveProfile = async () => {
    const errors = validatePersonal(draft.personal)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSaving(true)
    setError('')
    try {
      const storedUser = safeParse(localStorage.getItem('user') || '') || {}
      const isAdmin = storedUser.role === 'admin'
      
      const updateData = {
        name: draft.personal.name, // Update full_name in users table
        phone: draft.personal.phone || '',
        mobile: draft.personal.mobile || '',
        department: draft.organization.department || '',
        designation: draft.organization.designation || '',
        address: draft.address?.address || '',
        city: draft.address?.city || '',
        state: draft.address?.state || '',
        country: draft.address?.country || 'India',
        pin_code: draft.address?.pinCode || '',
        bio: draft.bio || '',
        timezone: draft.preferences.timezone,
        language: draft.preferences.language,
        date_format: draft.preferences.dateFormat,
      }
      
      if (isAdmin) {
        updateData.company_name = draft.organization.companyName || ''
      }

      await updateProfile(updateData)

      setProfile(draft)
      setSaved(true)
      
      localStorage.setItem('user', JSON.stringify({
        ...storedUser,
        fullName: draft.personal.name,
        email: draft.personal.email,
      }))
    } catch (err) {
      console.error('Failed to save profile:', err)
      setError(err.response?.data?.message || err.message || 'Failed to save profile. Please try again.')
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
    setPwErrors({})
    try {
      await updatePassword(pw.current, pw.next)
      setPw({ current: '', next: '', confirm: '' })
      setPwSaved(true)
    } catch (err) {
      console.error('Failed to update password:', err)
      const errorMsg = err.response?.data?.message || 'Failed to update password. Please try again.'
      if (errorMsg.includes('Current password')) {
        setPwErrors({ current: errorMsg })
      } else if (errorMsg.includes('at least 8')) {
        setPwErrors({ next: errorMsg })
      } else {
        setPwErrors({ next: errorMsg })
      }
    } finally {
      setPwSaving(false)
    }
  }

  const handleRevokeSession = async (sessionId) => {
    const confirmed = await confirm({
      title: 'Revoke session?',
      message: 'This device will be signed out and must log in again.',
      confirmText: 'Revoke session',
      tone: 'warning',
    })
    if (!confirmed) return

    try {
      await revokeSession(sessionId)
      const response = await getProfile()
      const data = response.data.data
      if (data?.sessions) {
        setProfile((prev) => ({
          ...prev,
          security: {
            ...prev.security,
            sessions: data.sessions,
          },
        }))
        setDraft((prev) => ({
          ...prev,
          security: {
            ...prev.security,
            sessions: data.sessions,
          },
        }))
      }
    } catch (err) {
      console.error('Failed to revoke session:', err)
      showToast('Failed to revoke session. Please try again.', 'error')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return formatDate(dateString)
  }

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">Loading profile...</div>
      </div>
    )
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
            disabled={saving || !isDirty || loading}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      {error && (
        <div className="profile-error" role="alert">
          {error}
        </div>
      )}

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
                <img className="profile-photo-img" src={photoPreviewUrl} alt="Profile" />
              ) : (
                <div className="profile-photo-placeholder" aria-hidden="true">
                  <Camera className="profile-photo-icon" />
                </div>
              )}
              {photoUploading && (
                <div className="profile-photo-uploading">
                  <div className="profile-photo-uploading-spinner" />
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
                disabled={photoUploading || loading}
              />
              <button
                type="button"
                className="profile-btn profile-btn-secondary"
                onClick={() => photoFileRef.current?.click()}
                disabled={photoUploading || loading}
              >
                <Upload className="profile-btn-icon" />
                {photoUploading ? 'Uploading…' : 'Upload photo'}
              </button>
              <div className="profile-help">PNG/JPG/WEBP, max 2MB. Photo uploads immediately.</div>
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
                disabled={loading}
                aria-invalid={fieldErrors.name ? 'true' : 'false'}
                aria-describedby={fieldErrors.name ? 'name-error' : undefined}
              />
              {fieldErrors.name && <div id="name-error" className="profile-field-error" role="alert">{fieldErrors.name}</div>}
            </div>

            <div className="profile-field">
              <label className="profile-label" htmlFor="email">Email</label>
              <div className="profile-readonly">
                <input
                  id="email"
                  type="email"
                  className={`profile-input ${fieldErrors.email ? 'is-error' : ''}`}
                  value={draft.personal.email}
                  readOnly
                  disabled={loading}
                  aria-invalid={fieldErrors.email ? 'true' : 'false'}
                />
                <span className="profile-readonly-chip"><Lock className="profile-chip-icon" /> Read-only</span>
              </div>
              <div className="profile-help">Email cannot be changed. Contact administrator if needed.</div>
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
                disabled={loading}
                aria-invalid={fieldErrors.mobile ? 'true' : 'false'}
                aria-describedby={fieldErrors.mobile ? 'mobile-error' : undefined}
              />
              {fieldErrors.mobile && <div id="mobile-error" className="profile-field-error" role="alert">{fieldErrors.mobile}</div>}
            </div>

            <div className="profile-field">
              <label className="profile-label" htmlFor="phone">Phone</label>
              <input
                id="phone"
                inputMode="tel"
                className={`profile-input ${fieldErrors.phone ? 'is-error' : ''}`}
                value={draft.personal.phone || ''}
                onChange={(e) => onPersonalChange('phone', e.target.value)}
                placeholder="Phone number"
                disabled={loading}
              />
            </div>

            <div className="profile-field profile-field--full">
              <label className="profile-label" htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                className="profile-input"
                value={draft.bio || ''}
                onChange={(e) => setDraft((prev) => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell us about yourself"
                rows={3}
                disabled={loading}
              />
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
              {(() => {
                const storedUser = safeParse(localStorage.getItem('user') || '') || {}
                const isAdmin = storedUser.role === 'admin'
                
                if (isAdmin) {
                  return (
                    <input
                      id="company"
                      className="profile-input"
                      value={draft.organization.companyName}
                      onChange={(e) => setDraft((prev) => ({
                        ...prev,
                        organization: { ...prev.organization, companyName: e.target.value },
                      }))}
                      disabled={loading}
                    />
                  )
                } else {
                  return (
                    <div className="profile-readonly">
                      <input
                        id="company"
                        className="profile-input"
                        value={draft.organization.companyName}
                        readOnly
                        disabled={loading}
                      />
                      <span className="profile-readonly-chip"><Lock className="profile-chip-icon" /> Read-only</span>
                    </div>
                  )
                }
              })()}
            </div>

            <div className="profile-field">
              <label className="profile-label" htmlFor="role">Role</label>
              <div className="profile-readonly">
                <input id="role" className="profile-input" value={draft.organization.role} readOnly disabled={loading} />
                <span className="profile-readonly-chip"><Lock className="profile-chip-icon" /> Read-only</span>
              </div>
            </div>

            <div className="profile-field">
              <label className="profile-label" htmlFor="department">Department</label>
              <input
                id="department"
                className="profile-input"
                value={draft.organization.department}
                onChange={(e) => setDraft((prev) => ({
                  ...prev,
                  organization: { ...prev.organization, department: e.target.value },
                }))}
                disabled={loading}
              />
            </div>

            <div className="profile-field">
              <label className="profile-label" htmlFor="designation">Designation</label>
              <input
                id="designation"
                className="profile-input"
                value={draft.organization.designation}
                onChange={(e) => setDraft((prev) => ({
                  ...prev,
                  organization: { ...prev.organization, designation: e.target.value },
                }))}
                placeholder="Job title"
                disabled={loading}
              />
            </div>  
          </div>

          <div className="profile-divider-space" />

          <div className="profile-form-grid">
            <div className="profile-field profile-field--full">
              <label className="profile-label" htmlFor="address">Address</label>
              <textarea
                id="address"
                className="profile-input"
                value={draft.address?.address || ''}
                onChange={(e) => setDraft((prev) => ({
                  ...prev,
                  address: { ...prev.address, address: e.target.value },
                }))}
                placeholder="Street address"
                rows={2}
                disabled={loading}
              />
            </div>

            <div className="profile-field">
              <label className="profile-label" htmlFor="city">City</label>
              <input
                id="city"
                className="profile-input"
                value={draft.address?.city || ''}
                onChange={(e) => setDraft((prev) => ({
                  ...prev,
                  address: { ...prev.address, city: e.target.value },
                }))}
                disabled={loading}
              />
            </div>

            <div className="profile-field">
              <label className="profile-label" htmlFor="state">State</label>
              <input
                id="state"
                className="profile-input"
                value={draft.address?.state || ''}
                onChange={(e) => setDraft((prev) => ({
                  ...prev,
                  address: { ...prev.address, state: e.target.value },
                }))}
                disabled={loading}
              />
            </div>

            <div className="profile-field">
              <label className="profile-label" htmlFor="country">Country</label>
              <input
                id="country"
                className="profile-input"
                value={draft.address?.country || 'India'}
                onChange={(e) => setDraft((prev) => ({
                  ...prev,
                  address: { ...prev.address, country: e.target.value },
                }))}
                disabled={loading}
              />
            </div>

            <div className="profile-field">
              <label className="profile-label" htmlFor="pinCode">Pin Code</label>
              <input
                id="pinCode"
                className="profile-input"
                value={draft.address?.pinCode || ''}
                onChange={(e) => setDraft((prev) => ({
                  ...prev,
                  address: { ...prev.address, pinCode: e.target.value },
                }))}
                placeholder="PIN code"
                disabled={loading}
              />
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
              <div className="profile-meta-value">
                {draft.security.lastLogin ? formatDate(draft.security.lastLogin) : 'Never'}
                {draft.security.lastLoginIp && (
                  <span className="profile-meta-sub"> from {draft.security.lastLoginIp}</span>
                )}
              </div>
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
              {loading ? (
                <div className="profile-loading">Loading sessions...</div>
              ) : draft.security.sessions.length === 0 ? (
                <div className="profile-empty">No active sessions</div>
              ) : (
                draft.security.sessions.map((s) => (
                  <div key={s.id} className={`profile-session ${s.current ? 'is-current' : ''}`}>
                    <div className="profile-session-left">
                      <div className="profile-session-icon">
                        <Monitor />
                      </div>
                      <div className="profile-session-meta">
                        <div className="profile-session-device">{s.device || 'Unknown device'}</div>
                        <div className="profile-session-sub">
                          {s.location || 'Unknown location'} • {formatRelativeTime(s.lastActive)}
                          {s.ipAddress && ` • ${s.ipAddress}`}
                        </div>
                      </div>
                    </div>
                    <div className="profile-session-actions">
                      {s.current ? (
                        <span className="profile-session-chip">Current</span>
                      ) : (
                        <button
                          type="button"
                          className="profile-btn profile-btn-ghost profile-btn-sm"
                          onClick={() => handleRevokeSession(s.id)}
                        >
                          <XCircle className="profile-btn-icon" />
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
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
                disabled={loading}
              >
                <option value="en-IN">English (India)</option>
                <option value="en-US">English (US)</option>
                <option value="Other">Other</option>
              </select>
              {draft.preferences.language === 'Other' && (
                <input
                  type="text"
                  id="languageOther"
                  className="profile-input"
                  value={draft.preferencesOther?.languageOther || ''}
                  onChange={(e) => setDraft((prev) => ({
                    ...prev,
                    preferencesOther: { ...prev.preferencesOther, languageOther: e.target.value },
                  }))}
                  placeholder="Enter language code"
                  disabled={loading}
                  style={{ marginTop: '8px' }}
                />
              )}
            </div>

            <div className="profile-field">
              <label className="profile-label" htmlFor="timezone">Timezone</label>
              <select
                id="timezone"
                className="profile-input profile-select"
                value={draft.preferences.timezone}
                onChange={(e) => onPreferenceChange('timezone', e.target.value)}
                disabled={loading}
              >
                <option value="Asia/Kolkata">Asia/Kolkata</option>
                <option value="UTC">UTC</option>
                <option value="Other">Other</option>
              </select>
              {draft.preferences.timezone === 'Other' && (
                <input
                  type="text"
                  id="timezoneOther"
                  className="profile-input"
                  value={draft.preferencesOther?.timezoneOther || ''}
                  onChange={(e) => setDraft((prev) => ({
                    ...prev,
                    preferencesOther: { ...prev.preferencesOther, timezoneOther: e.target.value },
                  }))}
                  placeholder="Enter timezone (e.g., America/New_York)"
                  disabled={loading}
                  style={{ marginTop: '8px' }}
                />
              )}
            </div>

            <div className="profile-field">
              <label className="profile-label" htmlFor="dateFormat">Date format</label>
              <select
                id="dateFormat"
                className="profile-input profile-select"
                value={draft.preferences.dateFormat}
                onChange={(e) => onPreferenceChange('dateFormat', e.target.value)}
                disabled={loading}
              >
                <option value="DD MMM YYYY">DD MMM YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="Other">Other</option>
              </select>
              {draft.preferences.dateFormat === 'Other' && (
                <input
                  type="text"
                  id="dateFormatOther"
                  className="profile-input"
                  value={draft.preferencesOther?.dateFormatOther || ''}
                  onChange={(e) => setDraft((prev) => ({
                    ...prev,
                    preferencesOther: { ...prev.preferencesOther, dateFormatOther: e.target.value },
                  }))}
                  placeholder="Enter date format (e.g., MM/DD/YYYY)"
                  disabled={loading}
                  style={{ marginTop: '8px' }}
                />
              )}
            </div>
          </div>
        </section>
      </div>
      <ConfirmDialog {...dialogProps} />
    </div>
  )
}


