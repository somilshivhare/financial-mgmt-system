import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import '../styles/POEntry.css'

function POEntryIndex() {
  const navigate = useNavigate()

  return (
    <div className="po-entry-index-page">
      <div className="po-entry-index-header">
        <div className="po-entry-index-header-content">
          <h1 className="po-entry-index-title">PO Entry</h1>
          <p className="po-entry-index-subtitle">Manage purchase orders and entries</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/po-entry/new')}
          className="po-entry-index-add-button"
        >
          <Plus className="po-entry-index-add-icon" />
          <span>New PO Entry</span>
        </button>
      </div>

      <div className="po-entry-index-content">
        <div className="po-entry-index-empty">
          <p>No PO entries found. Click "New PO Entry" to create one.</p>
        </div>
      </div>
    </div>
  )
}

export default POEntryIndex

