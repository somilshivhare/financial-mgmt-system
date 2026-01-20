import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import '../styles/InvoiceEntry.css'

function InvoiceIndex() {
  const navigate = useNavigate()

  return (
    <div className="invoice-entry-index-page">
      <div className="invoice-entry-index-header">
        <div className="invoice-entry-index-header-content">
          <h1 className="invoice-entry-index-title">Invoice Entry</h1>
          <p className="invoice-entry-index-subtitle">Create and manage invoices linked to PO Entries</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/invoices/new')}
          className="invoice-entry-index-add-button"
        >
          <Plus className="invoice-entry-index-add-icon" />
          <span>New Invoice</span>
        </button>
      </div>

      <div className="invoice-entry-index-content">
        <div className="invoice-entry-index-empty">
          <p>No invoices found. Click "New Invoice" to create one.</p>
          <p style={{ fontSize: '14px', color: 'var(--color-text-tertiary)', marginTop: '8px' }}>
            Make sure you have created a PO Entry first, as invoices must be linked to a PO Number.
          </p>
        </div>
      </div>
    </div>
  )
}

export default InvoiceIndex

