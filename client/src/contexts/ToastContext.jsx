import { createContext, useContext, useState, useCallback } from 'react'
import Toast from '../components/Toast'

const ToastContext = createContext(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    return {
      showToast: (message) => {
        console.warn('[Toast] No provider. Message:', message)
      },
    }
  }
  return ctx
}

const TOAST_DURATION_MS = 4000

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, TOAST_DURATION_MS)
  }, [])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            id={t.id}
            message={t.message}
            type={t.type}
            onDismiss={() => dismiss(t.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
