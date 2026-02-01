import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import {
  buildDraftKey,
  getDraft,
  mergeWithDefaults,
  scheduleDraftSave,
  setDraft,
  clearDraft as clearStorageDraft,
  cancelScheduledSave,
} from '../utils/formPersistenceStorage'

/**
 * Hook for form state with localStorage-only persistence (no backend draft).
 * Use for pages that don't use useFormPersistence (e.g. InvoiceEntry, PaymentEntry, MoMEntry, ContactSupport).
 * Restores from localStorage on mount and debounce-saves on change. Single draft per page/entity per user.
 *
 * @param {Object} options
 * @param {string} options.pathKey - Route key (e.g. 'invoice-entry', 'payment-entry', 'mom-entry')
 * @param {object} options.defaultValues - Default form values
 * @param {number} options.debounceMs - Debounce for localStorage writes (default 1500)
 * @param {string|null} options.entityId - Optional entity id (e.g. from useParams().id). Use 'new' or null for new entry.
 * @returns {{ values, setValues, clearLocalDraft, reset, persistNow, updateField, updateFields }}
 */
export function usePersistedFormState({ pathKey, defaultValues = {}, debounceMs = 1500, entityId = null }) {
  const params = useParams()
  const resolvedId = entityId ?? params?.id ?? null
  const storageKey = pathKey ? buildDraftKey(pathKey, resolvedId) : null

  const [values, setValues] = useState(() => {
    const defaults = defaultValues && typeof defaultValues === 'object' && !Array.isArray(defaultValues)
      ? defaultValues
      : {}
    if (!storageKey) return defaults
    try {
      const stored = getDraft(storageKey)
      const merged = mergeWithDefaults(defaults, stored)
      return merged && typeof merged === 'object' && !Array.isArray(merged) ? merged : defaults
    } catch {
      return defaults
    }
  })

  const defaultValuesRef = useRef(defaultValues)
  const isFirstRender = useRef(true)

  useEffect(() => {
    defaultValuesRef.current = defaultValues
  }, [defaultValues])

  // Debounced persist to localStorage
  useEffect(() => {
    if (!storageKey || isFirstRender.current) {
      if (isFirstRender.current) isFirstRender.current = false
      return
    }
    if (Object.keys(values).length === 0) return
    scheduleDraftSave(storageKey, values, debounceMs)
    return () => cancelScheduledSave(storageKey)
  }, [values, storageKey, debounceMs])

  const reset = useCallback(() => {
    if (storageKey) clearStorageDraft(storageKey)
    setValues(defaultValuesRef.current)
  }, [storageKey])

  const clearLocalDraft = useCallback(() => {
    if (storageKey) clearStorageDraft(storageKey)
  }, [storageKey])

  /** Persist current values to localStorage immediately (e.g. for "Save Draft" button). */
  const persistNow = useCallback(() => {
    if (storageKey && Object.keys(values).length > 0) {
      cancelScheduledSave(storageKey)
      setDraft(storageKey, values)
    }
  }, [storageKey, values])

  const updateField = useCallback((field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }))
  }, [])

  const updateFields = useCallback((updates) => {
    setValues((prev) => ({ ...prev, ...updates }))
  }, [])

  return {
    values,
    setValues,
    reset,
    clearLocalDraft,
    persistNow,
    updateField,
    updateFields,
  }
}
