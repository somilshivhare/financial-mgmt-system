import { X } from 'lucide-react'
import '../styles/Toast.css'

export default function Toast({ id, message, type = 'success', onDismiss }) {
  return (
    <div
      role="alert"
      className={`toast toast-${type}`}
      onClick={onDismiss}
      onKeyDown={(e) => e.key === 'Escape' && onDismiss()}
    >
      <span className="toast-message">{message}</span>
      <button
        type="button"
        className="toast-dismiss"
        onClick={(e) => {
          e.stopPropagation()
          onDismiss()
        }}
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  )
}
