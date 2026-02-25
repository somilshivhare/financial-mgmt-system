import { useEffect, useMemo, useRef, useState } from 'react'
import { 
  Clock, FileUp, Mail, Phone, ShieldCheck, MapPin, Building2, CheckCircle2, 
  AlertCircle, X, MessageSquare, Calendar, User, Tag, AlertTriangle, 
  Loader2, FileText, History, Send, Eye, EyeOff
} from 'lucide-react'
import '../styles/Support.css'
import { useToast } from '../contexts/ToastContext'
import { usePersistedFormState } from '../hooks/usePersistedFormState'
import { createTicketJSON, listTickets, getTicket, addReply } from '../api/supportTickets'
import { getSystemSettings } from '../api/settings'
import { getProfile } from '../api/user'
import { getApiUrl } from '../config/api'

function safeParse(json) {
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

const CATEGORIES = [
  { value: 'Billing', label: 'Billing' },
  { value: 'Invoice', label: 'Invoice' },
  { value: 'Payment', label: 'Payment' },
  { value: 'PO', label: 'PO' },
  { value: 'Access', label: 'Access' },
  { value: 'Bug', label: 'Bug' },
  { value: 'Other', label: 'Other' },
]

const PRIORITIES = [
  { value: 'Low', label: 'Low', helper: 'General question or minor issue', sla: '2 business days' },
  { value: 'Medium', label: 'Medium', helper: 'Work impacted, workaround available', sla: '1 business day' },
  { value: 'High', label: 'High', helper: 'Work blocked or high business impact', sla: '4 hours' },
  { value: 'Critical', label: 'Critical', helper: 'System down or critical business impact', sla: '1 hour' },
]

const STATUS_COLORS = {
  open: { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.25)', text: '#1e40af' },
  in_progress: { bg: 'rgba(251, 191, 36, 0.1)', border: 'rgba(251, 191, 36, 0.25)', text: '#92400e' },
  resolved: { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.25)', text: '#065f46' },
  closed: { bg: 'rgba(107, 114, 128, 0.1)', border: 'rgba(107, 114, 128, 0.25)', text: '#374151' },
}

const PRIORITY_COLORS = {
  Low: { bg: 'rgba(107, 114, 128, 0.1)', border: 'rgba(107, 114, 128, 0.25)', text: '#374151' },
  Medium: { bg: 'rgba(251, 191, 36, 0.1)', border: 'rgba(251, 191, 36, 0.25)', text: '#92400e' },
  High: { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.25)', text: '#991b1b' },
  Critical: { bg: 'rgba(220, 38, 38, 0.1)', border: 'rgba(220, 38, 38, 0.25)', text: '#7f1d1d' },
}

function formatDate(dateString) {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return date.toLocaleString('en-IN', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

export default function ContactSupport() {
  const { showToast } = useToast()
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [supportChannels, setSupportChannels] = useState({
    email: 'nbaurum@gmail.com',
    phone: '+91 99674 50118',
    businessHours: 'Mon–Fri, 10:00–18:00 (IST)',
  })
  const [officeInfo, setOfficeInfo] = useState({
    companyName: 'NB Aurum Solutions',
    registeredAddress: 'Lower Ground Floor, LGF-17, Krishna Apra D Mall, Shakti Khand-2, Indirapuram, Ghaziabad District, Uttar Pradesh – 201014, India',
    gstin: '—',
  })
  const { values: ticket, setValues: setTicket, clearLocalDraft } = usePersistedFormState({
    pathKey: 'contact-support',
    defaultValues: { category: '', priority: 'Medium', subject: '', description: '' },
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(null)
  const [submitError, setSubmitError] = useState(null)
  const fileRef = useRef(null)
  const [attachments, setAttachments] = useState([])
  const [tickets, setTickets] = useState([])
  const [loadingTickets, setLoadingTickets] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [loadingTicket, setLoadingTicket] = useState(false)
  const [replyMessage, setReplyMessage] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)
  const [activeTab, setActiveTab] = useState('create') // 'create' or 'history'

  const totalAttachmentBytes = useMemo(
    () => attachments.reduce((sum, f) => sum + (f.size || 0), 0),
    [attachments]
  )

  useEffect(() => {
    const storedUser = safeParse(localStorage.getItem('user') || '')
    if (storedUser) {
      setUser({
        name: storedUser.full_name || storedUser.fullName || storedUser.name || storedUser.companyName || 'NB Aurum Solutions',
        email: storedUser.email || 'user@example.com',
        mobile: storedUser.mobileNumber || storedUser.mobile || storedUser.phone || storedUser.profile?.mobile || storedUser.profile?.phone || '',
      })
      setUserRole(storedUser.role || 'viewer')
    }

    const loadUserProfile = async () => {
      try {
        const res = await getProfile()
        const data = res?.data?.data ?? res?.data ?? res
        const profile = data?.profile ?? data
        if (profile && (profile.mobile || profile.phone)) {
          setUser((prev) => (prev ? { ...prev, mobile: profile.mobile || profile.phone || prev.mobile } : prev))
        }
      } catch (err) {
        console.error('Failed to load user profile for support form:', err)
      }
    }
    loadUserProfile()
    loadSupportChannels()
    loadTickets()
  }, [])

  const DEFAULT_SUPPORT_EMAIL = 'nbaurum@gmail.com'
  const DEFAULT_SUPPORT_PHONE = '+91 99674 50118'

  const loadSupportChannels = async () => {
    try {
      const res = await getSystemSettings()
      const settings = res?.data ?? res
      if (settings?.general) {
        const g = settings.general
        const rawEmail = g.supportEmail || g.companyEmail || DEFAULT_SUPPORT_EMAIL
        const rawPhone = g.supportPhone || g.companyPhone || DEFAULT_SUPPORT_PHONE
        setSupportChannels({
          email: rawEmail && rawEmail !== 'finance@nbaurum.com' && rawEmail !== 'finance@nbaurumsolutions.com' ? rawEmail : DEFAULT_SUPPORT_EMAIL,
          phone: rawPhone && rawPhone !== '+91 00000 00000' ? rawPhone : DEFAULT_SUPPORT_PHONE,
          businessHours: g.businessHours || 'Mon–Fri, 10:00–18:00 (IST)',
        })
        setOfficeInfo({
          companyName: g.companyName || 'NB Aurum Solutions',
          registeredAddress: g.companyAddress || 'Lower Ground Floor, LGF-17, Krishna Apra D Mall, Shakti Khand-2, Indirapuram, Ghaziabad District, Uttar Pradesh – 201014, India',
          gstin: g.gstin || g.gstinNumber || '—',
        })
      }
    } catch (err) {
      console.error('Failed to load support channels:', err)
    }
  }

  const loadTickets = async () => {
    setLoadingTickets(true)
    try {
      const response = await listTickets({ limit: 50 })
      if (response.success) {
        setTickets(response.data || [])
      }
    } catch (err) {
      console.error('Failed to load tickets:', err)
    } finally {
      setLoadingTickets(false)
    }
  }

  const loadTicketDetails = async (ticketId) => {
    setLoadingTicket(true)
    try {
      const response = await getTicket(ticketId)
      if (response.success) {
        setSelectedTicket(response.data)
      }
    } catch (err) {
      console.error('Failed to load ticket details:', err)
      showToast('Failed to load ticket details. Please try again.', 'error')
    } finally {
      setLoadingTicket(false)
    }
  }

  const validate = () => {
    const next = {}
    if (!ticket.category) next.category = 'Select a category'
    if (!ticket.priority) next.priority = 'Select a priority'
    if (!ticket.subject?.trim()) next.subject = 'Subject is required'
    else if (ticket.subject.trim().length > 255) next.subject = 'Subject must be 255 characters or less'
    if (!ticket.description?.trim()) next.description = 'Description is required'
    else if (ticket.description.trim().length < 20) next.description = 'Provide at least 20 characters'
    else if (ticket.description.trim().length > 5000) next.description = 'Description must be 5000 characters or less'

    const maxTotal = 10 * 1024 * 1024
    if (totalAttachmentBytes > maxTotal) next.attachments = 'Attachments must be 10MB total or smaller'

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const onSelectFiles = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const allowed = new Set([
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/webp',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ])

    const filtered = files.filter((f) => allowed.has(f.type))
    setAttachments((prev) => {
      const next = [...prev, ...filtered].slice(0, 5) // cap at 5
      return next
    })
    setErrors((prev) => ({ ...prev, attachments: '' }))
  }

  const removeAttachment = (name) => {
    setAttachments((prev) => prev.filter((f) => f.name !== name))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setSubmitted(null)
    setSubmitError(null)
    if (!validate()) return

    setSubmitting(true)
    try {
      const ticketData = {
        category: ticket.category,
        priority: ticket.priority,
        subject: ticket.subject.trim(),
        description: ticket.description.trim(),
        attachments: [], // Files will be handled via multer in the backend
      }

      const formData = new FormData()
      formData.append('category', ticketData.category)
      formData.append('priority', ticketData.priority)
      formData.append('subject', ticketData.subject)
      formData.append('description', ticketData.description)
      
      attachments.forEach((file) => {
        formData.append('attachments', file)
      })

      const token = localStorage.getItem('token')
      const API_BASE_URL = getApiUrl()
      const response = await fetch(`${API_BASE_URL}/support-tickets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create ticket')
      }

      if (data.success) {
        setSubmitted({ id: data.data.ticketNumber, ticketId: data.data.id })
        if (typeof clearLocalDraft === 'function') clearLocalDraft()
        setTicket({ category: '', priority: 'Medium', subject: '', description: '' })
        setAttachments([])
        if (fileRef.current) fileRef.current.value = ''
        setErrors({})
        await loadTickets()
        setActiveTab('history')
      } else {
        throw new Error(data.message || 'Failed to create ticket')
      }
    } catch (err) {
      console.error('Failed to create ticket:', err)
      setSubmitError(err.message || 'Failed to create ticket. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitReply = async (ticketId) => {
    if (!replyMessage.trim()) return

    setSubmittingReply(true)
    try {
      const response = await addReply(ticketId, replyMessage.trim(), false)
      if (response.success) {
        setReplyMessage('')
        await loadTicketDetails(ticketId)
        await loadTickets()
      } else {
        throw new Error(response.message || 'Failed to add reply')
      }
    } catch (err) {
      console.error('Failed to add reply:', err)
      showToast('Failed to add reply. Please try again.', 'error')
    } finally {
      setSubmittingReply(false)
    }
  }

  if (!user) {
    return (
      <div className="support-page">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <Loader2 className="support-loading-icon" style={{ width: '32px', height: '32px', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="support-page">
      <div className="support-header">
        <div className="support-header-content">
          <h1 className="support-title">Contact & Support</h1>
          <p className="support-subtitle">Support channels, ticketing, and registered office information.</p>
        </div>
      </div>

      <div className="support-tabs">
        <button
          className={`support-tab ${activeTab === 'create' ? 'support-tab--active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          <FileText className="support-tab-icon" />
          Create Ticket
        </button>
        <button
          className={`support-tab ${activeTab === 'history' ? 'support-tab--active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History className="support-tab-icon" />
          My Tickets ({tickets.length})
        </button>
      </div>

      {activeTab === 'create' && (
        <div className="support-grid">
          {/* Support Channels */}
          <section className="support-card">
            <div className="support-card-header">
              <h2 className="support-card-title">Support Channels</h2>
              <p className="support-card-subtitle">Use the channel that best fits your request.</p>
            </div>

            <div className="support-channel-list">
              <div className="support-channel">
                <div className="support-channel-icon"><Mail /></div>
                <div className="support-channel-content">
                  <div className="support-channel-label">Email</div>
                  <div className="support-channel-value">{supportChannels.email}</div>
                  <div className="support-channel-help">Preferred for billing, access, and general requests.</div>
                </div>
              </div>

              <div className="support-channel">
                <div className="support-channel-icon"><Phone /></div>
                <div className="support-channel-content">
                  <div className="support-channel-label">Phone</div>
                  <div className="support-channel-value">{supportChannels.phone}</div>
                  <div className="support-channel-help">For urgent operational issues during business hours.</div>
                </div>
              </div>

              <div className="support-channel">
                <div className="support-channel-icon"><Clock /></div>
                <div className="support-channel-content">
                  <div className="support-channel-label">Business Hours</div>
                  <div className="support-channel-value">{supportChannels.businessHours}</div>
                  <div className="support-channel-help">Priority incidents are triaged first.</div>
                </div>
              </div>
            </div>
          </section>

          {/* Raise a Ticket */}
          <section className="support-card support-card--span">
            <div className="support-card-header support-card-header--row">
              <div>
                <h2 className="support-card-title">Raise a Ticket</h2>
                <p className="support-card-subtitle">Provide clear details for faster resolution.</p>
              </div>
              <div className="support-sla-badge" aria-label="Response SLA">
                <ShieldCheck className="support-sla-icon" />
                <span>Response SLA: Critical ≤ 1h • High ≤ 4h • Medium ≤ 1 day • Low ≤ 2 days</span>
              </div>
            </div>

            {submitted && (
              <div className="support-banner support-banner--ok" role="status">
                <CheckCircle2 className="support-banner-icon" />
                Ticket submitted successfully. Reference: <strong>{submitted.id}</strong>
                <button
                  type="button"
                  className="support-banner-close"
                  onClick={() => setSubmitted(null)}
                  aria-label="Close"
                >
                  <X className="support-banner-close-icon" />
                </button>
              </div>
            )}

            {submitError && (
              <div className="support-banner support-banner--error" role="alert">
                <AlertCircle className="support-banner-icon" />
                {submitError}
                <button
                  type="button"
                  className="support-banner-close"
                  onClick={() => setSubmitError(null)}
                  aria-label="Close"
                >
                  <X className="support-banner-close-icon" />
                </button>
              </div>
            )}

            <form className="support-form" onSubmit={onSubmit} noValidate encType="multipart/form-data">
              <div className="support-form-grid">
                <div className="support-field">
                  <label className="support-label">Name</label>
                  <input className="support-input is-readonly" value={user.name} readOnly />
                </div>
                <div className="support-field">
                  <label className="support-label">Email</label>
                  <input className="support-input is-readonly" value={user.email} readOnly />
                </div>
                <div className="support-field">
                  <label className="support-label">Mobile</label>
                  <input className="support-input is-readonly" value={user.mobile || '—'} readOnly />
                </div>

                <div className="support-field">
                  <label className="support-label" htmlFor="category">Category <span className="support-required">*</span></label>
                  <select
                    id="category"
                    className={`support-input support-select ${errors.category ? 'is-error' : ''}`}
                    value={ticket.category}
                    onChange={(e) => {
                      setTicket((t) => ({ ...t, category: e.target.value }))
                      if (errors.category) setErrors((x) => ({ ...x, category: '' }))
                    }}
                    aria-invalid={errors.category ? 'true' : 'false'}
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  {errors.category && <div className="support-error" role="alert">{errors.category}</div>}
                </div>

                <div className="support-field">
                  <label className="support-label" htmlFor="priority">Priority <span className="support-required">*</span></label>
                  <select
                    id="priority"
                    className={`support-input support-select ${errors.priority ? 'is-error' : ''}`}
                    value={ticket.priority}
                    onChange={(e) => {
                      setTicket((t) => ({ ...t, priority: e.target.value }))
                      if (errors.priority) setErrors((x) => ({ ...x, priority: '' }))
                    }}
                    aria-invalid={errors.priority ? 'true' : 'false'}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                  <div className="support-help">
                    {PRIORITIES.find((p) => p.value === ticket.priority)?.helper}
                    {PRIORITIES.find((p) => p.value === ticket.priority)?.sla && 
                      ` • SLA: ${PRIORITIES.find((p) => p.value === ticket.priority).sla}`
                    }
                  </div>
                </div>

                <div className="support-field support-field--full">
                  <label className="support-label" htmlFor="subject">Subject <span className="support-required">*</span></label>
                  <input
                    id="subject"
                    type="text"
                    className={`support-input ${errors.subject ? 'is-error' : ''}`}
                    placeholder="Brief summary of your issue"
                    value={ticket.subject}
                    onChange={(e) => {
                      setTicket((t) => ({ ...t, subject: e.target.value }))
                      if (errors.subject) setErrors((x) => ({ ...x, subject: '' }))
                    }}
                    aria-invalid={errors.subject ? 'true' : 'false'}
                  />
                  {errors.subject && <div className="support-error" role="alert">{errors.subject}</div>}
                </div>

                <div className="support-field support-field--full">
                  <label className="support-label" htmlFor="desc">Description <span className="support-required">*</span></label>
                  <textarea
                    id="desc"
                    className={`support-textarea ${errors.description ? 'is-error' : ''}`}
                    rows={6}
                    placeholder="Describe the issue, expected behavior, and any relevant invoice/customer identifiers."
                    value={ticket.description}
                    onChange={(e) => {
                      setTicket((t) => ({ ...t, description: e.target.value }))
                      if (errors.description) setErrors((x) => ({ ...x, description: '' }))
                    }}
                    aria-invalid={errors.description ? 'true' : 'false'}
                  />
                  <div className="support-help">
                    {ticket.description.length}/5000 characters
                  </div>
                  {errors.description && <div className="support-error" role="alert">{errors.description}</div>}
                </div>
              </div>

              <div className="support-attachments">
                <div className="support-attachments-head">
                  <div>
                    <div className="support-attachments-title">Attachments</div>
                    <div className="support-help">Optional. Up to 5 files. Total size ≤ 10MB.</div>
                  </div>
                  <input
                    ref={fileRef}
                    className="support-file-input"
                    type="file"
                    multiple
                    onChange={onSelectFiles}
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.xlsx,.docx"
                  />
                  <button
                    type="button"
                    className="support-btn support-btn-secondary"
                    onClick={() => fileRef.current?.click()}
                  >
                    <FileUp className="support-btn-icon" />
                    Add files
                  </button>
                </div>

                {errors.attachments && <div className="support-error" role="alert">{errors.attachments}</div>}

                {attachments.length > 0 && (
                  <div className="support-attachment-list">
                    {attachments.map((f, idx) => (
                      <div key={`${f.name}-${idx}`} className="support-attachment">
                        <div className="support-attachment-left">
                          <FileUp className="support-attachment-icon" />
                          <div className="support-attachment-meta">
                            <div className="support-attachment-name">{f.name}</div>
                            <div className="support-attachment-size">{Math.round((f.size || 0) / 1024)} KB</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="support-attachment-remove"
                          onClick={() => removeAttachment(f.name)}
                          aria-label={`Remove ${f.name}`}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="support-form-actions">
                <div className="support-note">
                  <AlertCircle className="support-note-icon" />
                  Include invoice IDs, payment references, and timestamps where applicable to reduce turnaround time.
                </div>
                <button className="support-btn support-btn-primary" type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="support-btn-icon" style={{ animation: 'spin 1s linear infinite' }} />
                      Submitting…
                    </>
                  ) : (
                    'Submit ticket'
                  )}
                </button>
              </div>
            </form>
          </section>

          {/* Office Information */}
          <section className="support-card">
            <div className="support-card-header">
              <h2 className="support-card-title">Office Information</h2>
              <p className="support-card-subtitle">Registered and billing information for compliance.</p>
            </div>

            <div className="support-office">
              <div className="support-office-row">
                <div className="support-office-icon"><MapPin /></div>
                <div>
                  <div className="support-office-label">Registered Address</div>
                  <div className="support-office-value" style={{ whiteSpace: 'pre-line' }}>
                    {officeInfo.companyName}
                    {'\n'}
                    {officeInfo.registeredAddress}
                  </div>
                </div>
              </div>

              <div className="support-office-row">
                <div className="support-office-icon"><Building2 /></div>
                <div>
                  <div className="support-office-label">GST Details</div>
                  <div className="support-office-value">
                    GSTIN: <span className="support-mono">{officeInfo.gstin}</span><br />
                    Legal Entity: {officeInfo.companyName}
                  </div>
                  <div className="support-help">Update GSTIN when applicable for tax invoices.</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="support-tickets-container">
          {loadingTickets ? (
            <div className="support-empty">
              <Loader2 className="support-empty-icon" style={{ animation: 'spin 1s linear infinite' }} />
              <p>Loading tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="support-empty">
              <FileText className="support-empty-icon" />
              <h3>No tickets yet</h3>
              <p>You haven't created any support tickets. Create your first ticket to get started.</p>
              <button
                className="support-btn support-btn-primary"
                onClick={() => setActiveTab('create')}
              >
                Create Ticket
              </button>
            </div>
          ) : (
            <div className="support-tickets-list">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  className={`support-ticket-card ${selectedTicket?.ticket?.id === t.id ? 'support-ticket-card--active' : ''}`}
                  onClick={() => {
                    if (selectedTicket?.ticket?.id === t.id) {
                      setSelectedTicket(null)
                    } else {
                      loadTicketDetails(t.id)
                    }
                  }}
                >
                  <div className="support-ticket-header">
                    <div className="support-ticket-number">{t.ticketNumber}</div>
                    <div
                      className="support-ticket-status"
                      style={{
                        backgroundColor: STATUS_COLORS[t.status]?.bg,
                        borderColor: STATUS_COLORS[t.status]?.border,
                        color: STATUS_COLORS[t.status]?.text,
                      }}
                    >
                      {t.status.replace('_', ' ')}
                    </div>
                  </div>
                  <div className="support-ticket-subject">{t.subject}</div>
                  <div className="support-ticket-meta">
                    <span className="support-ticket-meta-item">
                      <Tag className="support-ticket-meta-icon" />
                      {t.category}
                    </span>
                    <span
                      className="support-ticket-meta-item support-ticket-priority"
                      style={{
                        backgroundColor: PRIORITY_COLORS[t.priority]?.bg,
                        borderColor: PRIORITY_COLORS[t.priority]?.border,
                        color: PRIORITY_COLORS[t.priority]?.text,
                      }}
                    >
                      {t.priority}
                    </span>
                    <span className="support-ticket-meta-item">
                      <Calendar className="support-ticket-meta-icon" />
                      {formatDate(t.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedTicket && (
            <div className="support-ticket-details">
              <div className="support-ticket-details-header">
                <div>
                  <h3 className="support-ticket-details-title">{selectedTicket.ticket.subject}</h3>
                  <div className="support-ticket-details-meta">
                    <span className="support-ticket-details-number">{selectedTicket.ticket.ticketNumber}</span>
                    <span
                      className="support-ticket-details-status"
                      style={{
                        backgroundColor: STATUS_COLORS[selectedTicket.ticket.status]?.bg,
                        borderColor: STATUS_COLORS[selectedTicket.ticket.status]?.border,
                        color: STATUS_COLORS[selectedTicket.ticket.status]?.text,
                      }}
                    >
                      {selectedTicket.ticket.status.replace('_', ' ')}
                    </span>
                    <span
                      className="support-ticket-details-priority"
                      style={{
                        backgroundColor: PRIORITY_COLORS[selectedTicket.ticket.priority]?.bg,
                        borderColor: PRIORITY_COLORS[selectedTicket.ticket.priority]?.border,
                        color: PRIORITY_COLORS[selectedTicket.ticket.priority]?.text,
                      }}
                    >
                      {selectedTicket.ticket.priority}
                    </span>
                  </div>
                </div>
                <button
                  className="support-ticket-details-close"
                  onClick={() => setSelectedTicket(null)}
                  aria-label="Close"
                >
                  <X />
                </button>
              </div>

              {loadingTicket ? (
                <div className="support-ticket-details-loading">
                  <Loader2 style={{ animation: 'spin 1s linear infinite' }} />
                  <p>Loading ticket details...</p>
                </div>
              ) : (
                <>
                  <div className="support-ticket-details-content">
                    <div className="support-ticket-details-section">
                      <h4 className="support-ticket-details-section-title">Description</h4>
                      <p className="support-ticket-details-text">{selectedTicket.ticket.description}</p>
                    </div>

                    {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                      <div className="support-ticket-details-section">
                        <h4 className="support-ticket-details-section-title">Attachments</h4>
                        <div className="support-ticket-attachments-list">
                          {selectedTicket.attachments.map((att) => (
                            <div key={att.id} className="support-ticket-attachment">
                              <FileText className="support-ticket-attachment-icon" />
                              <div className="support-ticket-attachment-info">
                                <div className="support-ticket-attachment-name">{att.fileName}</div>
                                <div className="support-ticket-attachment-size">
                                  {Math.round(att.fileSizeBytes / 1024)} KB
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedTicket.replies && selectedTicket.replies.length > 0 && (
                      <div className="support-ticket-details-section">
                        <h4 className="support-ticket-details-section-title">Conversation</h4>
                        <div className="support-ticket-replies">
                          {selectedTicket.replies.map((reply) => (
                            <div
                              key={reply.id}
                              className={`support-ticket-reply ${reply.isInternal ? 'support-ticket-reply--internal' : ''}`}
                            >
                              <div className="support-ticket-reply-header">
                                <span className="support-ticket-reply-author">{reply.userName}</span>
                                {reply.isInternal && (
                                  <span className="support-ticket-reply-badge">Internal</span>
                                )}
                                <span className="support-ticket-reply-date">{formatDate(reply.createdAt)}</span>
                              </div>
                              <div className="support-ticket-reply-message">{reply.message}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedTicket.ticket.status !== 'closed' && (
                      <div className="support-ticket-details-reply">
                        <textarea
                          className="support-ticket-reply-input"
                          placeholder="Add a reply..."
                          rows={4}
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                        />
                        <button
                          className="support-btn support-btn-primary"
                          onClick={() => handleSubmitReply(selectedTicket.ticket.id)}
                          disabled={!replyMessage.trim() || submittingReply}
                        >
                          {submittingReply ? (
                            <>
                              <Loader2 className="support-btn-icon" style={{ animation: 'spin 1s linear infinite' }} />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="support-btn-icon" />
                              Send Reply
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
