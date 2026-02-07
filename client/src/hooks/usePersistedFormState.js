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
