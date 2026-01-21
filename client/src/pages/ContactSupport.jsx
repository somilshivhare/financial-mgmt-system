import { useEffect, useMemo, useRef, useState } from 'react'
import { Clock, FileUp, Mail, Phone, ShieldCheck, MapPin, Building2, CheckCircle2, AlertCircle } from 'lucide-react'
import '../styles/Support.css'

function safeParse(json) {
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

const CATEGORIES = [
  'Billing & Subscription',
  'Invoice & Payments',
  'Collections',
  'Master Data',
  'Access & Security',
  'Bug / Incident',
  'Other',
]

const PRIORITIES = [
  { value: 'low', label: 'Low', helper: 'General question or minor issue' },
  { value: 'medium', label: 'Medium', helper: 'Work impacted, workaround available' },
  { value: 'high', label: 'High', helper: 'Work blocked or high business impact' },
]

export default function ContactSupport() {
  const [user, setUser] = useState({ name: 'User', email: 'user@example.com', mobile: '' })
  const [ticket, setTicket] = useState({ category: '', priority: 'medium', description: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(null)
  const fileRef = useRef(null)

  const [attachments, setAttachments] = useState([])
  const totalAttachmentBytes = useMemo(
    () => attachments.reduce((sum, f) => sum + (f.size || 0), 0),
    [attachments]
  )

  useEffect(() => {
    const storedUser = safeParse(localStorage.getItem('user') || '')
    if (!storedUser) return
    setUser({
      name: storedUser.name || 'User',
      email: storedUser.email || 'user@example.com',
      mobile: storedUser.mobileNumber || storedUser.mobile || '',
    })
  }, [])

  const validate = () => {
    const next = {}
    if (!ticket.category) next.category = 'Select a category'
    if (!ticket.priority) next.priority = 'Select a priority'
    if (!ticket.description.trim()) next.description = 'Description is required'
    else if (ticket.description.trim().length < 20) next.description = 'Provide at least 20 characters'

    // Attachments: allow common docs/images, max 10MB total
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
    if (!validate()) return

    setSubmitting(true)
    try {
      // UI-only workflow; integrate with backend later.
      await new Promise((r) => setTimeout(r, 650))
      const id = `TCK-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
      setSubmitted({ id })
      setTicket({ category: '', priority: 'medium', description: '' })
      setAttachments([])
      if (fileRef.current) fileRef.current.value = ''
      setErrors({})
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="support-page">
      <div className="support-header">
        <div className="support-header-content">
          <h1 className="support-title">Contact & Support</h1>
          <p className="support-subtitle">Support channels, ticketing, and registered office information.</p>
        </div>
      </div>

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
                <div className="support-channel-value">support@nbaurum.com</div>
                <div className="support-channel-help">Preferred for billing, access, and general requests.</div>
              </div>
            </div>

            <div className="support-channel">
              <div className="support-channel-icon"><Phone /></div>
              <div className="support-channel-content">
                <div className="support-channel-label">Phone</div>
                <div className="support-channel-value">+91 00000 00000</div>
                <div className="support-channel-help">For urgent operational issues during business hours.</div>
              </div>
            </div>

            <div className="support-channel">
              <div className="support-channel-icon"><Clock /></div>
              <div className="support-channel-content">
                <div className="support-channel-label">Business Hours</div>
                <div className="support-channel-value">Mon–Fri, 10:00–18:00 (IST)</div>
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
              <span>Response SLA: High ≤ 4h • Medium ≤ 1 business day • Low ≤ 2 business days</span>
            </div>
          </div>

          {submitted && (
            <div className="support-banner support-banner--ok" role="status">
              <CheckCircle2 className="support-banner-icon" />
              Ticket submitted successfully. Reference: <strong>{submitted.id}</strong>
            </div>
          )}

          <form className="support-form" onSubmit={onSubmit} noValidate>
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
                    <option key={c} value={c}>{c}</option>
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
                </div>
              </div>
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
              {errors.description && <div className="support-error" role="alert">{errors.description}</div>}
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
                  {attachments.map((f) => (
                    <div key={f.name} className="support-attachment">
                      <div className="support-attachment-left">
                        <Upload className="support-attachment-icon" />
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
                {submitting ? 'Submitting…' : 'Submit ticket'}
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
                <div className="support-office-value">
                  Nbaurum Technologies Pvt. Ltd.<br />
                  123 Business Street, Andheri East<br />
                  Mumbai, Maharashtra 400001, India
                </div>
              </div>
            </div>

            <div className="support-office-row">
              <div className="support-office-icon"><Building2 /></div>
              <div>
                <div className="support-office-label">GST Details</div>
                <div className="support-office-value">
                  GSTIN: <span className="support-mono">—</span><br />
                  Legal Entity: Nbaurum Technologies Pvt. Ltd.
                </div>
                <div className="support-help">Update GSTIN when applicable for tax invoices.</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}


