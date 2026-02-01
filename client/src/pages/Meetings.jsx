import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Download, Edit3, Plus, Save, X, AlertCircle } from 'lucide-react'
import DatePicker from '../components/DatePicker'
import '../styles/Meetings.css'
import * as masterDataApi from '../api/masterData'
import { me } from '../api/auth'

function safeParse(json) {
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

function toISODate(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function sameDay(a, b) {
  return toISODate(new Date(a)) === toISODate(new Date(b))
}

function startOfWeek(d) {
  const x = startOfDay(d)
  const day = x.getDay() // 0 Sun
  const diff = (day + 6) % 7 // Monday as start
  x.setDate(x.getDate() - diff)
  return x
}

function addDays(d, n) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

function formatDateTime(iso) {
  const d = new Date(iso)
  return d.toLocaleString('en-IN', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const DEFAULT_MOM = () => ({
  id: `MOM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
  title: '',
  datetime: '',
  meetingType: 'Internal',
  participants: [],
  agenda: '',
  discussionPoints: '',
  decisionsTaken: '',
  actionItems: [
    { id: `AI-${Math.random().toString(36).slice(2, 7).toUpperCase()}`, task: '', ownerId: '', dueDate: '', status: 'Pending' },
  ],
  nextMeetingDate: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

function canEdit(role) {
  const r = (role || '').toLowerCase()
  return r === 'admin' || r === 'administrator' || r === 'manager'
}

function buildPrintableHTML(mom, participantsMap) {
  const esc = (s) =>
    String(s || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;')

  const participants = mom.participants
    .map((id) => participantsMap.get(id)?.label || id)
    .join(', ')

  const actions = mom.actionItems
    .map((a) => {
      const owner = participantsMap.get(a.ownerId)?.label || '—'
      return `<tr>
        <td>${esc(a.task)}</td>
        <td>${esc(owner)}</td>
        <td>${esc(a.dueDate || '—')}</td>
        <td>${esc(a.status)}</td>
      </tr>`
    })
    .join('')

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${esc(mom.id)} - Minutes of Meeting</title>
      <style>
        body{font-family: Inter,Segoe UI,Arial,sans-serif; color:#0f172a; margin:32px;}
        h1{font-size:20px;margin:0 0 8px;}
        .meta{color:#475569;font-size:12px;margin-bottom:18px;}
        .section{margin-top:18px;}
        .label{font-weight:700;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#64748b;margin-bottom:6px;}
        .box{border:1px solid #e2e8f0;border-radius:10px;padding:12px;background:#fff;line-height:1.55;white-space:pre-wrap;}
        table{width:100%;border-collapse:collapse;margin-top:10px;}
        th,td{border-bottom:1px solid #e2e8f0;padding:10px 8px;text-align:left;font-size:12px;vertical-align:top;}
        th{color:#64748b;text-transform:uppercase;letter-spacing:.08em;font-size:11px;}
      </style>
    </head>
    <body>
      <h1>Minutes of Meeting</h1>
      <div class="meta">
        <div><strong>ID:</strong> ${esc(mom.id)}</div>
        <div><strong>Title:</strong> ${esc(mom.title)}</div>
        <div><strong>Date & Time:</strong> ${esc(formatDateTime(mom.datetime))}</div>
        <div><strong>Type:</strong> ${esc(mom.meetingType)}</div>
        <div><strong>Participants:</strong> ${esc(participants || '—')}</div>
      </div>

      <div class="section">
        <div class="label">Agenda</div>
        <div class="box">${esc(mom.agenda || '—')}</div>
      </div>
      <div class="section">
        <div class="label">Discussion Points</div>
        <div class="box">${esc(mom.discussionPoints || '—')}</div>
      </div>
      <div class="section">
        <div class="label">Decisions Taken</div>
        <div class="box">${esc(mom.decisionsTaken || '—')}</div>
      </div>
      <div class="section">
        <div class="label">Action Items</div>
        <table>
          <thead><tr><th>Task</th><th>Owner</th><th>Due Date</th><th>Status</th></tr></thead>
          <tbody>${actions || '<tr><td colspan="4">—</td></tr>'}</tbody>
        </table>
      </div>
      <div class="section">
        <div class="label">Next Meeting Date</div>
        <div class="box">${esc(mom.nextMeetingDate || '—')}</div>
      </div>
    </body>
  </html>`
}

export default function Meetings() {
  const navigate = useNavigate()
  const [userRole, setUserRole] = useState('User')

  const [view, setView] = useState('month') // month | week
  const [cursor, setCursor] = useState(() => startOfDay(new Date()))
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()))

  const [moms, setMoms] = useState([])
  const [selectedId, setSelectedId] = useState(null)

  const [mode, setMode] = useState('list') // list | create | edit | detail
  const [draft, setDraft] = useState(DEFAULT_MOM)
  const [errors, setErrors] = useState({})

  // Participants data state
  const [participants, setParticipants] = useState([])
  const [participantsLoading, setParticipantsLoading] = useState(true)
  const [participantsError, setParticipantsError] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)

  const filePrintRef = useRef(null)

  // Create participants map for quick lookup
  const participantsMap = useMemo(() => {
    const map = new Map()
    participants.forEach((p) => {
      map.set(p.id, p)
    })
    return map
  }, [participants])

  // Fetch participants (users and customers) from backend
  useEffect(() => {
    const fetchParticipants = async () => {
      setParticipantsLoading(true)
      setParticipantsError(null)

      try {
        // Fetch current user
        let userData = null
        try {
          const userResponse = await me()
          if (userResponse?.data?.data?.user) {
            const user = userResponse.data.data.user
            userData = {
              id: user.id,
              fullName: user.fullName || user.full_name,
              email: user.email,
              role: user.role,
            }
            setCurrentUser(userData)
            setUserRole(user.role || 'User')
          }
        } catch (userError) {
          console.warn('Failed to fetch current user:', userError)
          // Continue without current user data
        }

        // Fetch employees (internal users) from masterData
        let employees = []
        try {
          const employeesResponse = await masterDataApi.getMasterDataByType('employee-profile')
          // Handle different response structures: response.data.data, response.data, or direct array
          let employeesData = []
          if (employeesResponse?.data?.data && Array.isArray(employeesResponse.data.data)) {
            employeesData = employeesResponse.data.data
          } else if (employeesResponse?.data && Array.isArray(employeesResponse.data)) {
            employeesData = employeesResponse.data
          } else if (Array.isArray(employeesResponse)) {
            employeesData = employeesResponse
          }

          employees = employeesData.map((emp) => {
            const name = emp.values?.nameOfEmployee || emp.values?.name || 'Unnamed Employee'
            const designation = emp.values?.designation || ''
            const label = designation ? `${name} (${designation})` : name
            return {
              id: `emp-${emp.id}`,
              label,
              type: 'User',
              originalId: emp.id,
              name,
              designation,
            }
          })
        } catch (empError) {
          console.warn('Failed to fetch employees:', empError)
          // Continue without employees
        }

        // Add current user to employees list if not already present
        if (userData && !employees.find((e) => e.originalId === userData.id)) {
          employees.unshift({
            id: `user-${userData.id}`,
            label: `${userData.fullName} (You)`,
            type: 'User',
            originalId: userData.id,
            name: userData.fullName,
            role: userData.role,
          })
        }

        // Fetch customers from masterData
        let customers = []
        try {
          const customersResponse = await masterDataApi.getMasterDataByType('customer-profile')
          // Handle different response structures: response.data.data, response.data, or direct array
          let customersData = []
          if (customersResponse?.data?.data && Array.isArray(customersResponse.data.data)) {
            customersData = customersResponse.data.data
          } else if (customersResponse?.data && Array.isArray(customersResponse.data)) {
            customersData = customersResponse.data
          } else if (Array.isArray(customersResponse)) {
            customersData = customersResponse
          }

          customers = customersData.map((cust) => {
            const name = cust.values?.customerName || cust.values?.name || cust.name || 'Unnamed Customer'
            return {
              id: `cust-${cust.id}`,
              label: `${name} (Client)`,
              type: 'Customer',
              originalId: cust.id,
              name,
            }
          })
        } catch (custError) {
          console.warn('Failed to fetch customers:', custError)
          // Continue without customers
        }

        // Combine all participants
        const allParticipants = [...employees, ...customers]

        if (allParticipants.length === 0) {
          setParticipantsError('No participants available. Please ensure employees and customers are configured in Master Data.')
        } else {
          setParticipants(allParticipants)
          setParticipantsError(null)
        }
      } catch (error) {
        console.error('Failed to fetch participants:', error)
        setParticipantsError(
          error.message || 'Failed to load participants. Please check your connection and try again.'
        )
        setParticipants([])
      } finally {
        setParticipantsLoading(false)
      }
    }

    fetchParticipants()
  }, [])

  useEffect(() => {
    const user = safeParse(localStorage.getItem('user') || '') || {}
    setUserRole(user.role || 'User')

    const stored = safeParse(localStorage.getItem('moms') || '')
    if (stored && Array.isArray(stored)) {
      setMoms(stored)
      return
    }
    // Seed with a sample record for UX
    const seed = {
      ...DEFAULT_MOM(),
      title: 'Collections Review - Weekly',
      datetime: new Date().toISOString(),
      meetingType: 'Internal',
      participants: [],
      agenda: 'Review overdue invoices and plan follow-up schedule.',
      discussionPoints: 'Discuss top delinquent accounts and escalation rules.',
      decisionsTaken: 'Prioritize invoices overdue > 30 days. Escalate critical accounts.',
      actionItems: [
        { id: 'AI-SEED1', task: 'Prepare list of invoices overdue > 30 days', ownerId: '', dueDate: toISODate(addDays(new Date(), 2)), status: 'Pending' },
        { id: 'AI-SEED2', task: 'Schedule client follow-up calls for top 5 accounts', ownerId: '', dueDate: toISODate(addDays(new Date(), 3)), status: 'In Progress' },
      ],
      nextMeetingDate: toISODate(addDays(new Date(), 7)),
    }
    setMoms([seed])
  }, [])

  useEffect(() => {
    localStorage.setItem('moms', JSON.stringify(moms))
  }, [moms])

  const editable = useMemo(() => canEdit(userRole), [userRole])

  const selected = useMemo(() => moms.find((m) => m.id === selectedId) || null, [moms, selectedId])

  const meetingsForSelectedDate = useMemo(() => {
    const d = selectedDate
    return moms
      .filter((m) => m.datetime && sameDay(m.datetime, d))
      .sort((a, b) => new Date(a.datetime) - new Date(b.datetime))
  }, [moms, selectedDate])

  const monthGrid = useMemo(() => {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const first = new Date(year, month, 1)
    const start = startOfWeek(first)
    return Array.from({ length: 42 }, (_, i) => addDays(start, i))
  }, [cursor])

  const weekDays = useMemo(() => {
    const start = startOfWeek(cursor)
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }, [cursor])

  const meetingsByDate = useMemo(() => {
    const map = new Map()
    for (const m of moms) {
      if (!m.datetime) continue
      const key = toISODate(new Date(m.datetime))
      map.set(key, (map.get(key) || 0) + 1)
    }
    return map
  }, [moms])

  const validateDraft = (d) => {
    const next = {}
    if (!d.title.trim()) next.title = 'Meeting title is required'
    if (!d.datetime) next.datetime = 'Date & time is required'
    if (!d.meetingType) next.meetingType = 'Meeting type is required'
    if (!d.participants.length) next.participants = 'Select at least one participant'
    if (d.actionItems.some((a) => !a.task.trim())) next.actionItems = 'All action items must have a task'
    if (d.actionItems.some((a) => a.task.trim() && !a.ownerId)) next.actionItemsOwner = 'Assign an owner to each action item'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const openCreate = () => {
    setDraft(DEFAULT_MOM())
    setErrors({})
    setMode('create')
  }

  const openDetail = (id) => {
    setSelectedId(id)
    setMode('detail')
  }

  const openEdit = () => {
    if (!selected) return
    setDraft(structuredClone(selected))
    setErrors({})
    setMode('edit')
  }

  const onSave = () => {
    if (!validateDraft(draft)) return
    const now = new Date().toISOString()

    if (mode === 'create') {
      const next = { ...draft, createdAt: now, updatedAt: now }
      setMoms((prev) => [next, ...prev])
      setSelectedId(next.id)
      setMode('detail')
      return
    }

    if (mode === 'edit') {
      const next = { ...draft, updatedAt: now }
      setMoms((prev) => prev.map((m) => (m.id === next.id ? next : m)))
      setSelectedId(next.id)
      setMode('detail')
    }
  }

  const onCancelForm = () => {
    if (selectedId) setMode('detail')
    else setMode('list')
  }

  const addActionItem = () => {
    setDraft((prev) => ({
      ...prev,
      actionItems: [
        ...prev.actionItems,
        { id: `AI-${Math.random().toString(36).slice(2, 7).toUpperCase()}`, task: '', ownerId: '', dueDate: '', status: 'Pending' },
      ],
    }))
  }

  const removeActionItem = (id) => {
    setDraft((prev) => ({ ...prev, actionItems: prev.actionItems.filter((a) => a.id !== id) }))
  }

  const updateActionItem = (id, patch) => {
    setDraft((prev) => ({
      ...prev,
      actionItems: prev.actionItems.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }))
  }

  const toggleParticipant = (id) => {
    setDraft((prev) => {
      const has = prev.participants.includes(id)
      const participants = has ? prev.participants.filter((p) => p !== id) : [...prev.participants, id]
      return { ...prev, participants }
    })
  }

  const setSelectedAndSync = (d) => {
    const x = startOfDay(d)
    setSelectedDate(x)
    setCursor(x)
    setMode('list')
    setSelectedId(null)
  }

  const downloadPDF = (mom) => {
    const w = window.open('', '_blank', 'noopener,noreferrer')
    if (!w) return
    w.document.open()
    w.document.write(buildPrintableHTML(mom, participantsMap))
    w.document.close()
    w.focus()
    w.print()
  }

  // Filter participants by type for action item owners (only users)
  const userParticipants = useMemo(() => {
    return participants.filter((p) => p.type === 'User')
  }, [participants])

  return (
    <div className="mom-page">
      <div className="mom-header">
        <div className="mom-header-content">
          <h1 className="mom-title">Minutes of Meeting</h1>
          <p className="mom-subtitle">Create and manage auditable meeting records with actionable follow-ups.</p>
        </div>

        <div className="mom-header-actions">
          <div className="mom-view-toggle" role="tablist" aria-label="Calendar view">
            <button
              type="button"
              className={`mom-toggle ${view === 'month' ? 'is-active' : ''}`}
              onClick={() => setView('month')}
              role="tab"
              aria-selected={view === 'month'}
            >
              Month
            </button>
            <button
              type="button"
              className={`mom-toggle ${view === 'week' ? 'is-active' : ''}`}
              onClick={() => setView('week')}
              role="tab"
              aria-selected={view === 'week'}
            >
              Week
            </button>
          </div>

          <button 
            type="button" 
            className="mom-btn mom-btn-primary" 
            onClick={() => navigate('/mom/new')}
          >
            <Plus className="mom-btn-icon" />
            Create MoM
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="mom-calendar-card">
        <div className="mom-calendar-head">
          <div className="mom-calendar-title">
            <CalendarDays className="mom-calendar-icon" />
            {cursor.toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
          </div>
          <div className="mom-calendar-nav">
            <button type="button" className="mom-btn mom-btn-ghost mom-btn-sm" onClick={() => setCursor(addDays(cursor, view === 'week' ? -7 : -30))}>
              Prev
            </button>
            <button type="button" className="mom-btn mom-btn-ghost mom-btn-sm" onClick={() => setCursor(startOfDay(new Date()))}>
              Today
            </button>
            <button type="button" className="mom-btn mom-btn-ghost mom-btn-sm" onClick={() => setCursor(addDays(cursor, view === 'week' ? 7 : 30))}>
              Next
            </button>
          </div>
        </div>

        {view === 'month' ? (
          <div className="mom-month">
            <div className="mom-weekdays">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <div key={d} className="mom-weekday">{d}</div>
              ))}
            </div>
            <div className="mom-grid">
              {monthGrid.map((d) => {
                const key = toISODate(d)
                const count = meetingsByDate.get(key) || 0
                const isCurrentMonth = d.getMonth() === cursor.getMonth()
                const isSelected = sameDay(d, selectedDate)
                return (
                  <button
                    key={key}
                    type="button"
                    className={`mom-day ${isSelected ? 'is-selected' : ''} ${isCurrentMonth ? '' : 'is-muted'}`}
                    onClick={() => setSelectedAndSync(d)}
                    aria-label={`Select ${key}`}
                  >
                    <span className="mom-day-num">{d.getDate()}</span>
                    {count > 0 && <span className="mom-day-dot" aria-label={`${count} meetings`} />}
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="mom-week">
            {weekDays.map((d) => {
              const key = toISODate(d)
              const count = meetingsByDate.get(key) || 0
              const isSelected = sameDay(d, selectedDate)
              return (
                <button
                  key={key}
                  type="button"
                  className={`mom-week-row ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => setSelectedAndSync(d)}
                >
                  <span className="mom-week-date">
                    <span className="mom-week-dow">{d.toLocaleString('en-IN', { weekday: 'short' })}</span>
                    <span className="mom-week-dom">{d.getDate()}</span>
                  </span>
                  <span className="mom-week-meta">{count > 0 ? `${count} meeting(s)` : 'No meetings'}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="mom-body">
        {/* Left: List for selected day */}
        <div className="mom-list-card">
          <div className="mom-list-head">
            <div className="mom-list-title">
              Meetings on {selectedDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' })}
            </div>
            <div className="mom-list-meta">{meetingsForSelectedDate.length} record(s)</div>
          </div>

          {meetingsForSelectedDate.length === 0 ? (
            <div className="mom-empty">No meetings scheduled for this date.</div>
          ) : (
            <div className="mom-list">
              {meetingsForSelectedDate.map((m) => (
                <button key={m.id} type="button" className={`mom-list-item ${selectedId === m.id ? 'is-active' : ''}`} onClick={() => openDetail(m.id)}>
                  <div className="mom-list-item-top">
                    <span className="mom-list-item-title">{m.title}</span>
                    <span className="mom-list-item-time">{formatDateTime(m.datetime)}</span>
                  </div>
                  <div className="mom-list-item-sub">
                    <span className="mom-chip">{m.meetingType}</span>
                    <span className="mom-muted">{m.id}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Detail or Form */}
        <div className="mom-detail-card">
          {mode === 'list' && (
            <div className="mom-detail-empty">
              Select a meeting to view details, or create a new record.
            </div>
          )}

          {mode === 'detail' && selected && (
            <div className="mom-detail">
              <div className="mom-detail-head">
                <div>
                  <div className="mom-detail-title">{selected.title}</div>
                  <div className="mom-detail-sub">
                    <span className="mom-chip">{selected.meetingType}</span>
                    <span className="mom-muted">{formatDateTime(selected.datetime)}</span>
                    <span className="mom-muted">•</span>
                    <span className="mom-muted">{selected.id}</span>
                  </div>
                </div>
                <div className="mom-detail-actions">
                  <button type="button" className="mom-btn mom-btn-secondary" onClick={() => downloadPDF(selected)}>
                    <Download className="mom-btn-icon" />
                    Download PDF
                  </button>
                  <button type="button" className="mom-btn mom-btn-ghost" onClick={openEdit} disabled={!editable}>
                    <Edit3 className="mom-btn-icon" />
                    Edit
                  </button>
                </div>
              </div>

              <div className="mom-section">
                <div className="mom-section-label">Participants</div>
                <div className="mom-section-body">
                  {(selected.participants || [])
                    .map((id) => participantsMap.get(id)?.label || id)
                    .join(', ') || '—'}
                </div>
              </div>

              <div className="mom-section">
                <div className="mom-section-label">Agenda</div>
                <div className="mom-section-body pre">{selected.agenda || '—'}</div>
              </div>

              <div className="mom-section">
                <div className="mom-section-label">Discussion Points</div>
                <div className="mom-section-body pre">{selected.discussionPoints || '—'}</div>
              </div>

              <div className="mom-section">
                <div className="mom-section-label">Decisions Taken</div>
                <div className="mom-section-body pre">{selected.decisionsTaken || '—'}</div>
              </div>

              <div className="mom-section">
                <div className="mom-section-label">Action Items</div>
                <div className="mom-actions">
                  {(selected.actionItems || []).map((a) => {
                    const owner = participantsMap.get(a.ownerId)?.label || '—'
                    return (
                      <div key={a.id} className="mom-action">
                        <div className="mom-action-main">
                          <div className="mom-action-task">{a.task || '—'}</div>
                          <div className="mom-action-meta">
                            <span className="mom-muted">Owner: <strong>{owner}</strong></span>
                            <span className="mom-muted">Due: <strong>{a.dueDate || '—'}</strong></span>
                          </div>
                        </div>
                        <div className={`mom-status mom-status-${(a.status || '').toLowerCase().replace(/\s/g, '')}`}>
                          {a.status}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="mom-section">
                <div className="mom-section-label">Next Meeting Date</div>
                <div className="mom-section-body">{selected.nextMeetingDate || '—'}</div>
              </div>

              <div className="mom-audit">
                <div className="mom-audit-item">
                  <span className="mom-audit-label">Created</span>
                  <span className="mom-audit-value">{new Date(selected.createdAt).toLocaleString('en-IN')}</span>
                </div>
                <div className="mom-audit-item">
                  <span className="mom-audit-label">Last updated</span>
                  <span className="mom-audit-value">{new Date(selected.updatedAt).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}

          {(mode === 'create' || mode === 'edit') && (
            <div className="mom-form">
              <div className="mom-detail-head">
                <div>
                  <div className="mom-detail-title">{mode === 'create' ? 'Create MoM' : 'Edit MoM'}</div>
                  <div className="mom-detail-sub">Structured, auditable meeting record.</div>
                </div>
                <div className="mom-detail-actions">
                  <button type="button" className="mom-btn mom-btn-secondary" onClick={onCancelForm}>
                    <X className="mom-btn-icon" />
                    Cancel
                  </button>
                  <button type="button" className="mom-btn mom-btn-primary" onClick={onSave}>
                    <Save className="mom-btn-icon" />
                    Save
                  </button>
                </div>
              </div>

              {participantsError && (
                <div className="mom-error-banner" role="alert">
                  <AlertCircle className="mom-error-icon" />
                  <div>
                    <strong>Unable to load participants</strong>
                    <p>{participantsError}</p>
                  </div>
                </div>
              )}

              {participantsLoading && (
                <div className="mom-loading-banner">
                  <div className="mom-spinner" />
                  <span>Loading participants...</span>
                </div>
              )}

              <div className="mom-form-grid">
                <div className="mom-field mom-field--span">
                  <label className="mom-label">Meeting Title <span className="mom-required">*</span></label>
                  <input
                    className={`mom-input ${errors.title ? 'is-error' : ''}`}
                    value={draft.title}
                    onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
                    placeholder="e.g., Weekly Collections Review"
                  />
                  {errors.title && <div className="mom-error" role="alert">{errors.title}</div>}
                </div>

                <div className="mom-field">
                  <label className="mom-label">Date & Time <span className="mom-required">*</span></label>
                  <DatePicker
                    showTimeSelect
                    className={errors.datetime ? 'is-error' : ''}
                    selected={draft.datetime}
                    onChange={(e) => setDraft((p) => ({ ...p, datetime: e.target.value }))}
                    placeholderText="Select date and time"
                  />
                  {errors.datetime && <div className="mom-error" role="alert">{errors.datetime}</div>}
                </div>

                <div className="mom-field">
                  <label className="mom-label">Meeting Type <span className="mom-required">*</span></label>
                  <select
                    className="mom-input mom-select"
                    value={draft.meetingType}
                    onChange={(e) => setDraft((p) => ({ ...p, meetingType: e.target.value }))}
                  >
                    <option value="Internal">Internal</option>
                    <option value="Client">Client</option>
                    <option value="Vendor">Vendor</option>
                  </select>
                </div>

                <div className="mom-field mom-field--span">
                  <label className="mom-label">Participants <span className="mom-required">*</span></label>
                  {participantsLoading ? (
                    <div className="mom-loading-text">Loading participants...</div>
                  ) : participants.length === 0 ? (
                    <div className="mom-empty-state">
                      <AlertCircle className="mom-empty-icon" />
                      <p>No participants available. Please configure employees and customers in Master Data.</p>
                    </div>
                  ) : (
                    <>
                      <div className={`mom-participants ${errors.participants ? 'is-error' : ''}`}>
                        {participants.map((p) => (
                          <label key={p.id} className="mom-participant">
                            <input
                              type="checkbox"
                              checked={draft.participants.includes(p.id)}
                              onChange={() => toggleParticipant(p.id)}
                              disabled={participantsLoading}
                            />
                            <span className="mom-participant-text">{p.label}</span>
                            <span className="mom-participant-type">{p.type}</span>
                          </label>
                        ))}
                      </div>
                      {errors.participants && <div className="mom-error" role="alert">{errors.participants}</div>}
                    </>
                  )}
                </div>

                <div className="mom-field mom-field--span">
                  <label className="mom-label">Agenda</label>
                  <textarea className="mom-textarea" rows={3} value={draft.agenda} onChange={(e) => setDraft((p) => ({ ...p, agenda: e.target.value }))} />
                </div>
                <div className="mom-field mom-field--span">
                  <label className="mom-label">Discussion Points</label>
                  <textarea className="mom-textarea" rows={4} value={draft.discussionPoints} onChange={(e) => setDraft((p) => ({ ...p, discussionPoints: e.target.value }))} />
                </div>
                <div className="mom-field mom-field--span">
                  <label className="mom-label">Decisions Taken</label>
                  <textarea className="mom-textarea" rows={3} value={draft.decisionsTaken} onChange={(e) => setDraft((p) => ({ ...p, decisionsTaken: e.target.value }))} />
                </div>

                <div className="mom-field mom-field--span">
                  <div className="mom-action-head">
                    <div>
                      <div className="mom-action-title">Action Items</div>
                      <div className="mom-muted">Tasks with owners, due dates, and status for accountability.</div>
                    </div>
                    <button type="button" className="mom-btn mom-btn-ghost mom-btn-sm" onClick={addActionItem}>
                      <Plus className="mom-btn-icon" />
                      Add action
                    </button>
                  </div>

                  {errors.actionItems && <div className="mom-error" role="alert">{errors.actionItems}</div>}
                  {errors.actionItemsOwner && <div className="mom-error" role="alert">{errors.actionItemsOwner}</div>}

                  <div className="mom-action-table">
                    <div className="mom-action-row mom-action-row--head">
                      <span>Task</span>
                      <span>Owner</span>
                      <span>Due date</span>
                      <span>Status</span>
                      <span />
                    </div>
                    {draft.actionItems.map((a) => (
                      <div key={a.id} className="mom-action-row">
                        <input
                          className="mom-input"
                          value={a.task}
                          onChange={(e) => updateActionItem(a.id, { task: e.target.value })}
                          placeholder="Action item"
                        />
                        <select 
                          className="mom-input mom-select" 
                          value={a.ownerId} 
                          onChange={(e) => updateActionItem(a.id, { ownerId: e.target.value })}
                          disabled={userParticipants.length === 0}
                        >
                          <option value="">Select owner</option>
                          {userParticipants.map((u) => (
                            <option key={u.id} value={u.id}>{u.label}</option>
                          ))}
                        </select>
                        <DatePicker
                          selected={a.dueDate}
                          onChange={(e) => updateActionItem(a.id, { dueDate: e.target.value })}
                          placeholderText="Due date"
                        />
                        <select className="mom-input mom-select" value={a.status} onChange={(e) => updateActionItem(a.id, { status: e.target.value })}>
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                        <button type="button" className="mom-icon-btn" onClick={() => removeActionItem(a.id)} disabled={draft.actionItems.length === 1} aria-label="Remove action item">
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  {userParticipants.length === 0 && !participantsLoading && (
                    <div className="mom-warning-text">
                      No users available for action item assignment. Please configure employees in Master Data.
                    </div>
                  )}
                </div>

                <div className="mom-field">
                  <label className="mom-label">Next Meeting Date</label>
                  <DatePicker
                    selected={draft.nextMeetingDate}
                    onChange={(e) => setDraft((p) => ({ ...p, nextMeetingDate: e.target.value }))}
                    placeholderText="Select date"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
