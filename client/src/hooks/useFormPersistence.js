import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { buildDraftKey, getDraft, mergeWithDefaults, scheduleDraftSave, clearDraft as clearStorageDraft, cancelScheduledSave } from '../utils/formPersistenceStorage'

export function useFormPersistence({
  saveFn,
  loadFn,
  entityType,
  entityId = null,
  storagePathKey = null,
  defaultValues = {},
  autoSaveDelay = 2000,
  localStorageDebounceMs = 1500,
  enableAutoSave = true,
}) {
  const params = useParams()
  const resolvedEntityId = entityId ?? params?.id ?? null
  const storageKey = storagePathKey ? buildDraftKey(storagePathKey, resolvedEntityId) : null

  const [values, setValues] = useState(() => {
    if (!storageKey) return defaultValues
    const stored = getDraft(storageKey)
    return mergeWithDefaults(defaultValues, stored)
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [lastSaved, setLastSaved] = useState(null)
  
  const autoSaveTimerRef = useRef(null)
  const isInitialLoadRef = useRef(true)
  const loadingInProgressRef = useRef(false)
  const loadFnRef = useRef(loadFn)
  const hasLoadedRef = useRef(false)
  const saveFnRef = useRef(saveFn)
  const valuesRef = useRef(values)
  const defaultValuesRef = useRef(defaultValues)
  const lastEntityIdRef = useRef(resolvedEntityId)
  const resolvedEntityIdRef = useRef(resolvedEntityId)
  
  useEffect(() => {
    defaultValuesRef.current = defaultValues
  }, [defaultValues])
  
  useEffect(() => {
    loadFnRef.current = loadFn
  }, [loadFn])
  
  useEffect(() => {
    saveFnRef.current = saveFn
    valuesRef.current = values
    resolvedEntityIdRef.current = resolvedEntityId
  }, [saveFn, values, resolvedEntityId])

  const save = useCallback(async (showLoading = true) => {
    const currentSaveFn = saveFnRef.current
    const currentValues = valuesRef.current
    const currentEntityId = resolvedEntityIdRef.current
    
    if (!currentSaveFn) {
      console.warn(`[useFormPersistence] No save function provided for ${entityType}`)
      return null
    }

    try {
      if (showLoading) {
        setSaving(true)
      }
      setError(null)

      const result = await currentSaveFn(currentValues, currentEntityId)
      
      if (result) {
        setLastSaved(new Date().toISOString())
        
        if (result.values || result.data) {
          setValues(prev => ({
            ...prev,
            ...(result.values || result.data),
          }))
        }
        
        return result
      }
      
      return null
    } catch (err) {
      console.error(`[useFormPersistence] Failed to save ${entityType}:`, err)
      setError(err.message || 'Failed to save data')
      throw err
    } finally {
      if (showLoading) {
        setSaving(false)
      }
    }
  }, [entityType]) // Only entityType as dependency - use refs for others

  useEffect(() => {
    if (loadingInProgressRef.current) {
      loadingInProgressRef.current = false
      setLoading(false)
    }

    if (hasLoadedRef.current && lastEntityIdRef.current === resolvedEntityId) {
      setLoading(false)
      return
    }
    
    if (!loadFnRef.current) {
      setLoading(false)
      isInitialLoadRef.current = false
      hasLoadedRef.current = true
      return
    }
    
    const currentEntityId = resolvedEntityId
    const entityIdChanged = lastEntityIdRef.current !== currentEntityId
    lastEntityIdRef.current = currentEntityId
    
    if (entityIdChanged) {
      hasLoadedRef.current = false
      isInitialLoadRef.current = true
    }
    
    if (hasLoadedRef.current && !entityIdChanged) {
      return
    }
    
    let mounted = true
    
    const loadData = async () => {
      const currentLoadFn = loadFnRef.current
      
      if (!currentLoadFn || loadingInProgressRef.current) {
        if (!currentLoadFn) {
          setLoading(false)
          isInitialLoadRef.current = false
          hasLoadedRef.current = true
        }
        return
      }

      loadingInProgressRef.current = true
      
      try {
        setLoading(true)
        setError(null)
        
        const data = await currentLoadFn(currentEntityId)
        
        if (mounted && data) {
          setValues(prev => ({
            ...defaultValuesRef.current,
            ...prev,
            ...data,
          }))
          setLastSaved(new Date().toISOString())
          hasLoadedRef.current = true
        } else if (mounted) {
          setValues(defaultValuesRef.current)
          hasLoadedRef.current = true
        }
      } catch (err) {
        console.error(`[useFormPersistence] Failed to load ${entityType}:`, err)
        if (mounted) {
          setError(err.message || 'Failed to load data')
          setValues(defaultValuesRef.current)
          hasLoadedRef.current = true // Mark as loaded even on error to prevent retry loops
        }
      } finally {
        if (mounted) {
          setLoading(false)
          isInitialLoadRef.current = false
          loadingInProgressRef.current = false
        }
      }
    }

    if (isInitialLoadRef.current || entityIdChanged) {
      loadData()
    }
    
    return () => {
      mounted = false
    }
  }, [resolvedEntityId]) // Only reload if entityId changes - defaultValues accessed via ref

  const autoSaveEnabled = typeof enableAutoSave === 'function' ? enableAutoSave(values) : !!enableAutoSave

  useEffect(() => {
    if (!autoSaveEnabled || !saveFnRef.current || isInitialLoadRef.current || loading || saving) {
      return
    }

    if (Object.keys(values).length === 0) {
      return
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    autoSaveTimerRef.current = setTimeout(() => {
      if (!isInitialLoadRef.current && !loading && !saving && Object.keys(values).length > 0 && saveFnRef.current) {
        save(false).catch(err => {
          console.warn(`[useFormPersistence] Auto-save failed for ${entityType}:`, err)
        })
      }
    }, autoSaveDelay)

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [values, autoSaveEnabled, autoSaveDelay, loading, saving, save]) // Include save but it's stable now

  useEffect(() => {
    if (!storageKey || isInitialLoadRef.current || loading) return
    if (Object.keys(values).length === 0) return
    scheduleDraftSave(storageKey, values, localStorageDebounceMs)
    return () => cancelScheduledSave(storageKey)
  }, [values, storageKey, localStorageDebounceMs, loading])

  const load = useCallback(async () => {
    const currentLoadFn = loadFnRef.current
    
    if (!currentLoadFn) {
      console.warn(`[useFormPersistence] No load function provided for ${entityType}`)
      return null
    }

    try {
      setLoading(true)
      setError(null)
      
      const data = await currentLoadFn(resolvedEntityIdRef.current)
      
      if (data) {
        setValues(prev => ({
          ...defaultValuesRef.current,
          ...prev,
          ...data,
        }))
        setLastSaved(new Date().toISOString())
        hasLoadedRef.current = true
        return data
      }
      
      return null
    } catch (err) {
      console.error(`[useFormPersistence] Failed to load ${entityType}:`, err)
      setError(err.message || 'Failed to load data')
      throw err
    } finally {
      setLoading(false)
    }
  }, [entityType]) // Only entityType as dependency - use refs for others

  const reset = useCallback(() => {
    if (storageKey) clearStorageDraft(storageKey)
    setValues(defaultValuesRef.current)
    setError(null)
    setLastSaved(null)
  }, [storageKey])

  const clearLocalDraft = useCallback(() => {
    if (storageKey) clearStorageDraft(storageKey)
  }, [storageKey])

  const updateField = useCallback((field, value) => {
    setValues(prev => ({
      ...prev,
      [field]: value,
    }))
  }, [])

  const updateFields = useCallback((updates) => {
    setValues(prev => ({
      ...prev,
      ...updates,
    }))
  }, [])

  return {
    values,
    setValues,
    loading,
    saving,
    error,
    lastSaved,
    save,
    load,
    reset,
    clearLocalDraft,
    updateField,
    updateFields,
  }
}
