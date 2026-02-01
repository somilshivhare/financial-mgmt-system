import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import '../styles/ConfirmDialog.css'

const toneIcons = {
  danger: AlertTriangle,
  warning: AlertTriangle,
  info: CheckCircle2,
}

export function ConfirmDialog({
  open,
  title,
  message,
  details,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  tone = 'warning',
  onConfirm,
  onCancel,
}) {
  if (!open) return null

  const Icon = toneIcons[tone] || toneIcons.warning

  return (
    <div className="confirm-dialog-overlay" onClick={onCancel} role="presentation">
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="confirm-dialog-header">
          <div className={`confirm-dialog-icon confirm-dialog-icon--${tone}`}>
            <Icon size={20} />
          </div>
          <div className="confirm-dialog-title">{title}</div>
        </div>
        <div className="confirm-dialog-body">
          <p className="confirm-dialog-message">{message}</p>
          {Array.isArray(details) && details.length > 0 && (
            <ul className="confirm-dialog-details">
              {details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="confirm-dialog-actions">
          <button type="button" className="confirm-dialog-btn confirm-dialog-btn-secondary" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            type="button"
            className={`confirm-dialog-btn ${
              tone === 'danger' ? 'confirm-dialog-btn-danger' : 'confirm-dialog-btn-primary'
            }`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export function useConfirmDialog() {
  const [dialog, setDialog] = useState(null)

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setDialog({ ...options, resolve })
    })
  }, [])

  const handleCancel = useCallback(() => {
    if (!dialog) return
    dialog.resolve(false)
    setDialog(null)
  }, [dialog])

  const handleConfirm = useCallback(() => {
    if (!dialog) return
    dialog.resolve(true)
    setDialog(null)
  }, [dialog])

  const dialogProps = dialog
    ? {
        open: true,
        title: dialog.title,
        message: dialog.message,
        details: dialog.details,
        confirmText: dialog.confirmText,
        cancelText: dialog.cancelText,
        tone: dialog.tone,
        onConfirm: handleConfirm,
        onCancel: handleCancel,
      }
    : { open: false, onConfirm: handleConfirm, onCancel: handleCancel }

  return { confirm, dialogProps }
}
