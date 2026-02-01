import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Plus, X, Trash2 } from 'lucide-react'
import DatePicker from '../components/DatePicker'
import { useMasterData } from '../contexts/MasterDataContext'
import { useToast } from '../contexts/ToastContext'
import { usePersistedFormState } from '../hooks/usePersistedFormState'
import * as momService from '../services/momService'
import '../styles/Meetings.css'

const MEETING_TYPES = ['Internal', 'Client', 'Vendor', 'Other']
const ACTION_STATUSES = ['Pending', 'In Progress', 'Completed', 'Cancelled']
const ACTION_PRIORITIES = ['Low', 'Medium', 'High']

const INITIAL_MOM_FORM_DATA = {
  title: '',
  datetime: '',
  meetingType: 'Internal',
  participants: [],
  agenda: '',
  discussionPoints: '',
  decisionsTaken: '',
  actionItems: [
    { id: `AI-${Date.now()}`, task: '', ownerId: '', dueDate: '', status: 'Pending', priority: 'Medium' },
  ],
  nextMeetingDate: '',
  status: 'draft',
}

function MoMEntry() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { getEmployees, getCustomers } = useMasterData()
  const { showToast } = useToast()
  const [employees, setEmployees] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const { values: formData, setValues: setFormData, clearLocalDraft } = usePersistedFormState({
    pathKey: 'mom-entry',
    defaultValues: INITIAL_MOM_FORM_DATA,
    entityId: id || null,
  })

  useEffect(() => {
    setEmployees(getEmployees())
    setCustomers(getCustomers())
  }, [getEmployees, getCustomers])

  useEffect(() => {
    if (id) {
      loadMoM()
    }
  }, [id])

  const loadMoM = async () => {
    try {
      setLoading(true)
      const mom = await momService.getMoMById(id)
      if (mom) {
        // Format datetime for datetime-local input (YYYY-MM-DDTHH:mm)
        let formattedDateTime = ''
        if (mom.meeting_date) {
          const date = new Date(mom.meeting_date)
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          const hours = String(date.getHours()).padStart(2, '0')
          const minutes = String(date.getMinutes()).padStart(2, '0')
          formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`
        }
        
        setFormData({
          title: mom.title || '',
          datetime: formattedDateTime,
          meetingType: mom.meeting_type || 'Internal',
          participants: mom.participants || [],
          agenda: mom.agenda || '',
          discussionPoints: mom.discussion_points || '',
          decisionsTaken: mom.decisions_taken || '',
          actionItems: mom.actionItems && mom.actionItems.length > 0 ? mom.actionItems : [
            { id: `AI-${Date.now()}`, task: '', ownerId: '', dueDate: '', status: 'Pending', priority: 'Medium' },
          ],
          nextMeetingDate: mom.next_meeting_date || '',
          status: mom.status || 'draft',
        })
      }
    } catch (error) {
      console.error('Failed to load MoM:', error)
      showToast('Failed to load MoM. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.title.trim()) {
      newErrors.title = 'Meeting title is required'
    }
    
    if (!formData.datetime) {
      newErrors.datetime = 'Date & time is required'
    }
    
    if (!formData.meetingType) {
      newErrors.meetingType = 'Meeting type is required'
    }
    
    if (formData.participants.length === 0) {
      newErrors.participants = 'Select at least one participant'
    }
    
    if (formData.actionItems.some((item) => item.task.trim() && !item.ownerId)) {
      newErrors.actionItems = 'All action items with tasks must have an owner assigned'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleParticipantToggle = (participantId, participantType) => {
    setFormData((prev) => {
      const key = `${participantId}_${participantType}`
      const hasParticipant = prev.participants.some((p) => p.id === participantId && p.type === participantType)
      
      if (hasParticipant) {
        return {
          ...prev,
          participants: prev.participants.filter((p) => !(p.id === participantId && p.type === participantType)),
        }
      } else {
        return {
          ...prev,
          participants: [...prev.participants, { id: participantId, type: participantType }],
        }
      }
    })
    
    if (errors.participants) {
      setErrors((prev) => ({ ...prev, participants: '' }))
    }
  }

  const handleActionItemChange = (itemId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      actionItems: prev.actionItems.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      ),
    }))
  }

  const handleAddActionItem = () => {
    setFormData((prev) => ({
      ...prev,
      actionItems: [
        ...prev.actionItems,
        { id: `AI-${Date.now()}`, task: '', ownerId: '', dueDate: '', status: 'Pending', priority: 'Medium' },
      ],
    }))
  }

  const handleRemoveActionItem = (itemId) => {
    if (formData.actionItems.length > 1) {
      setFormData((prev) => ({
        ...prev,
        actionItems: prev.actionItems.filter((item) => item.id !== itemId),
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)
      
      // Prepare data for backend
      const momData = {
        title: formData.title,
        meeting_date: new Date(formData.datetime).toISOString(),
        meeting_type: formData.meetingType,
        agenda: formData.agenda,
        discussion_points: formData.discussionPoints,
        decisions_taken: formData.decisionsTaken,
        next_meeting_date: formData.nextMeetingDate || null,
        status: formData.status,
        participants: formData.participants,
        actionItems: formData.actionItems.filter((item) => item.task.trim()),
      }

      if (id) {
        await momService.saveMoM({ ...momData, id })
        showToast('MoM updated successfully!', 'success')
      } else {
        await momService.saveMoM(momData)
        showToast('MoM created successfully!', 'success')
      }
      if (typeof clearLocalDraft === 'function') clearLocalDraft()
      navigate('/meetings')
    } catch (error) {
      console.error('Failed to save MoM:', error)
      showToast('Failed to save MoM. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const allParticipants = [
    ...employees.map((emp) => ({
      id: emp.id,
      name: emp.values?.nameOfEmployee || emp.name || 'Unnamed Employee',
      type: 'employee',
      label: `${emp.values?.nameOfEmployee || emp.name} (${emp.values?.designation || 'Employee'})`,
    })),
    ...customers.map((cust) => ({
      id: cust.id,
      name: cust.name || cust.customerName || 'Unnamed Customer',
      type: 'customer',
      label: `${cust.name || cust.customerName} (Customer)`,
    })),
  ]

  const allOwners = [
    ...employees.map((emp) => ({
      id: emp.id,
      name: emp.values?.nameOfEmployee || emp.name || 'Unnamed Employee',
    })),
  ]

  return (
    <div className="mom-entry-page">
      {/* Page Header */}
      <div className="mom-entry-header">
        <button
          type="button"
          onClick={() => navigate('/meetings')}
          className="mom-entry-back-button"
          aria-label="Back"
        >
          <ArrowLeft className="mom-entry-back-icon" />
          <span>Back</span>
        </button>
        
        <div className="mom-entry-header-content">
          <h1 className="mom-entry-title">{id ? 'Edit MoM' : 'Create MoM'}</h1>
          <p className="mom-entry-subtitle">Structured, auditable meeting record</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mom-entry-form">
        {/* Basic Information */}
        <div className="mom-entry-section">
          <h2 className="mom-entry-section-title">Basic Information</h2>
          <div className="mom-entry-form-grid">
            <div className="mom-entry-field mom-entry-field-full">
              <label htmlFor="title" className="mom-entry-label">
                Meeting Title <span className="mom-entry-required">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`mom-entry-input ${errors.title ? 'is-error' : ''}`}
                placeholder="e.g., Weekly Collections Review"
                required
              />
              {errors.title && <div className="mom-entry-error">{errors.title}</div>}
            </div>

            <div className="mom-entry-field">
              <label htmlFor="datetime" className="mom-entry-label">
                Date & Time <span className="mom-entry-required">*</span>
              </label>
              <DatePicker
                selected={formData.datetime}
                onChange={handleChange}
                showTimeSelect
                placeholderText="Select date and time"
                name="datetime"
                id="datetime"
                required
              />
              {errors.datetime && <div className="mom-entry-error">{errors.datetime}</div>}
            </div>

            <div className="mom-entry-field">
              <label htmlFor="meetingType" className="mom-entry-label">
                Meeting Type <span className="mom-entry-required">*</span>
              </label>
              <select
                id="meetingType"
                name="meetingType"
                value={formData.meetingType}
                onChange={handleChange}
                className={`mom-entry-select ${errors.meetingType ? 'is-error' : ''}`}
                required
              >
                {MEETING_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.meetingType && <div className="mom-entry-error">{errors.meetingType}</div>}
            </div>

            <div className="mom-entry-field">
              <label htmlFor="status" className="mom-entry-label">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="mom-entry-select"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>

        {/* Participants */}
        <div className="mom-entry-section">
          <h2 className="mom-entry-section-title">Participants</h2>
          <div className="mom-entry-form-grid">
            <div className="mom-entry-field mom-entry-field-full">
              <label className="mom-entry-label">
                Select Participants <span className="mom-entry-required">*</span>
              </label>
              <div className={`mom-entry-participants ${errors.participants ? 'is-error' : ''}`}>
                {allParticipants.map((participant) => {
                  const isSelected = formData.participants.some(
                    (p) => p.id === participant.id && p.type === participant.type
                  )
                  return (
                    <label key={`${participant.id}_${participant.type}`} className="mom-entry-participant">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleParticipantToggle(participant.id, participant.type)}
                      />
                      <span className="mom-entry-participant-text">{participant.label}</span>
                    </label>
                  )
                })}
              </div>
              {errors.participants && <div className="mom-entry-error">{errors.participants}</div>}
              {allParticipants.length === 0 && (
                <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '8px' }}>
                  No participants found. <a href="/master-data/new/employee-profile" style={{ color: 'var(--color-primary)' }}>Create employees in Master Data</a>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Meeting Details */}
        <div className="mom-entry-section">
          <h2 className="mom-entry-section-title">Meeting Details</h2>
          <div className="mom-entry-form-grid">
            <div className="mom-entry-field mom-entry-field-full">
              <label htmlFor="agenda" className="mom-entry-label">
                Agenda
              </label>
              <textarea
                id="agenda"
                name="agenda"
                value={formData.agenda}
                onChange={handleChange}
                className="mom-entry-textarea"
                rows="4"
                placeholder="Enter meeting agenda..."
              />
            </div>

            <div className="mom-entry-field mom-entry-field-full">
              <label htmlFor="discussionPoints" className="mom-entry-label">
                Discussion Points
              </label>
              <textarea
                id="discussionPoints"
                name="discussionPoints"
                value={formData.discussionPoints}
                onChange={handleChange}
                className="mom-entry-textarea"
                rows="6"
                placeholder="Enter discussion points..."
              />
            </div>

            <div className="mom-entry-field mom-entry-field-full">
              <label htmlFor="decisionsTaken" className="mom-entry-label">
                Decisions Taken
              </label>
              <textarea
                id="decisionsTaken"
                name="decisionsTaken"
                value={formData.decisionsTaken}
                onChange={handleChange}
                className="mom-entry-textarea"
                rows="4"
                placeholder="Enter decisions taken..."
              />
            </div>

            <div className="mom-entry-field">
              <label htmlFor="nextMeetingDate" className="mom-entry-label">
                Next Meeting Date
              </label>
              <DatePicker
                selected={formData.nextMeetingDate}
                onChange={handleChange}
                placeholderText="Select next meeting date"
                name="nextMeetingDate"
                id="nextMeetingDate"
              />
            </div>
          </div>
        </div>

        {/* Action Items */}
        <div className="mom-entry-section">
          <h2 className="mom-entry-section-title">Action Items</h2>
          <div className="mom-entry-action-items">
            <table className="mom-entry-action-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Owner</th>
                  <th>Due Date</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {formData.actionItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <input
                        type="text"
                        value={item.task}
                        onChange={(e) => handleActionItemChange(item.id, 'task', e.target.value)}
                        className="mom-entry-action-input"
                        placeholder="Enter task description"
                      />
                    </td>
                    <td>
                      <select
                        value={item.ownerId}
                        onChange={(e) => handleActionItemChange(item.id, 'ownerId', e.target.value)}
                        className="mom-entry-action-select"
                      >
                        <option value="">Select Owner</option>
                        {allOwners.map((owner) => (
                          <option key={owner.id} value={owner.id}>
                            {owner.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <DatePicker
                        selected={item.dueDate}
                        onChange={(e) => handleActionItemChange(item.id, 'dueDate', e.target.value)}
                        placeholderText="Due Date"
                      />
                    </td>
                    <td>
                      <select
                        value={item.priority}
                        onChange={(e) => handleActionItemChange(item.id, 'priority', e.target.value)}
                        className="mom-entry-action-select"
                      >
                        {ACTION_PRIORITIES.map((priority) => (
                          <option key={priority} value={priority}>
                            {priority}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        value={item.status}
                        onChange={(e) => handleActionItemChange(item.id, 'status', e.target.value)}
                        className="mom-entry-action-select"
                      >
                        {ACTION_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {formData.actionItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveActionItem(item.id)}
                          className="mom-entry-action-remove"
                          title="Remove"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              type="button"
              onClick={handleAddActionItem}
              className="mom-entry-action-add"
            >
              <Plus className="mom-entry-action-icon" />
              <span>Add Action Item</span>
            </button>
            {errors.actionItems && <div className="mom-entry-error">{errors.actionItems}</div>}
          </div>
        </div>

        {/* Form Actions */}
        <div className="mom-entry-actions">
          <button
            type="button"
            onClick={() => navigate('/meetings')}
            className="mom-entry-button mom-entry-button-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="mom-entry-button mom-entry-button-primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : id ? 'Update MoM' : 'Create MoM'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default MoMEntry

